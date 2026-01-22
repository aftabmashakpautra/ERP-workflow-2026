<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class OrderController extends Controller
{
    use \Illuminate\Foundation\Validation\ValidatesRequests;

    public function index()
    {
        $orders = \App\Models\Order::with(['user', 'items', 'approver'])->latest()->get();
        return \Inertia\Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Only sales team can create orders.');
        }

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        $totalAmount = 0;
        foreach ($validated['items'] as $item) {
            $totalAmount += $item['quantity'] * $item['price'];
        }

        $order = \App\Models\Order::create([
            'customer_name' => $validated['customer_name'],
            'amount' => $totalAmount,
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        foreach ($validated['items'] as $item) {
            $order->items()->create([
                'product_name' => $item['product_name'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'total' => $item['quantity'] * $item['price'],
            ]);
        }

        \App\Models\ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Created Order',
            'description' => "Order #{$order->id} for {$order->customer_name} created with " . count($validated['items']) . " items. Total: " . number_format($totalAmount, 2),
        ]);

        return redirect()->back()->with('success', 'Order created successfully.');
    }

    public function update(Request $request, \App\Models\Order $order)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Only sales team can update orders.');
        }

        if ($order->status !== 'pending' && $order->status !== 'rejected') {
            // Managers might reject, then Sales can fix? Or just Pending. Let's allow editing Pending.
            // Usually approved orders shouldn't be edited easily.
            if ($order->status === 'approved') {
                return redirect()->back()->withErrors(['message' => 'Cannot edit approved orders.']);
            }
        }

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        // Recalculate total
        $totalAmount = 0;
        foreach ($validated['items'] as $item) {
            $totalAmount += $item['quantity'] * $item['price'];
        }

        $order->update([
            'customer_name' => $validated['customer_name'],
            'amount' => $totalAmount,
        ]);

        // Sync items - delete old, create new (simple approach) or update.
        // For simplicity: delete all and recreate.
        $order->items()->delete();
        foreach ($validated['items'] as $item) {
            $order->items()->create([
                'product_name' => $item['product_name'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'total' => $item['quantity'] * $item['price'],
            ]);
        }

        \App\Models\ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Updated Order',
            'description' => "Order #{$order->id} updated by {$request->user()->name}. New Total: " . number_format($totalAmount, 2),
        ]);

        return redirect()->back()->with('success', 'Order updated successfully.');
    }

    public function destroy(Request $request, \App\Models\Order $order)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Only sales team can delete orders.');
        }

        if ($order->status === 'approved') {
            return redirect()->back()->withErrors(['message' => 'Cannot delete approved orders.']);
        }

        $orderId = $order->id;
        $order->delete();

        \App\Models\ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Deleted Order',
            'description' => "Order #{$orderId} deleted by {$request->user()->name}",
        ]);

        return redirect()->back()->with('success', 'Order deleted successfully.');
    }

    public function approve(Request $request, $id)
    {
        if ($request->user()->role !== 'manager') {
            abort(403, 'Only managers can approve orders.');
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
            $order = \App\Models\Order::lockForUpdate()->find($id);

            if (!$order) {
                return redirect()->back()->withErrors(['message' => 'Order not found.']);
            }

            if ($order->status !== 'pending') {
                return redirect()->back()->withErrors(['message' => 'Order has already been processed by another manager.']);
            }

            $order->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id
            ]);

            \App\Models\ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'Approved Order',
                'description' => "Order #{$order->id} approved by {$request->user()->name}",
            ]);

            return redirect()->back()->with('success', 'Order approved.');
        });
    }

    public function reject(Request $request, $id)
    {
        if ($request->user()->role !== 'manager') {
            abort(403, 'Only managers can reject orders.');
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
            $order = \App\Models\Order::lockForUpdate()->find($id);

            if (!$order) {
                return redirect()->back()->withErrors(['message' => 'Order not found.']);
            }

            if ($order->status !== 'pending') {
                return redirect()->back()->withErrors(['message' => 'Order has already been processed by another manager.']);
            }

            $order->update(['status' => 'rejected']);

            \App\Models\ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'Rejected Order',
                'description' => "Order #{$order->id} rejected by {$request->user()->name}",
            ]);

            return redirect()->back()->with('success', 'Order rejected.');
        });
    }

    public function pay(Request $request, \App\Models\Order $order)
    {
        if ($request->user()->role !== 'accounts') {
            abort(403, 'Only accounts team can mark orders as paid.');
        }

        if ($order->status !== 'approved') {
            return redirect()->back()->withErrors(['message' => 'Order must be approved before payment.']);
        }

        $order->update(['payment_status' => 'paid']);

        \App\Models\ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Marked Paid',
            'description' => "Order #{$order->id} marked as paid by {$request->user()->name}",
        ]);

        return redirect()->back()->with('success', 'Order paid.');
    }

    public function getActivity(Request $request, $orderId)
    {
        // Simple search in description for "Order #$orderId"
        // Brittle but effective for this simple log structure without polymorphic relations.
        $activities = \App\Models\ActivityLog::with('user')
            ->where('description', 'LIKE', "%Order #{$orderId}%")
            ->latest()
            ->get();

        return response()->json($activities);
    }
}
