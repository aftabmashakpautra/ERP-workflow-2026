<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $stats = [
            'total' => \App\Models\Order::count(),
            'pending' => \App\Models\Order::where('status', 'pending')->count(),
            'approved' => \App\Models\Order::where('status', 'approved')->count(),
            'rejected' => \App\Models\Order::where('status', 'rejected')->count(),
        ];
        return Inertia::render('dashboard', [
            'stats' => $stats
        ]);
    })->name('dashboard');

    Route::resource('orders', \App\Http\Controllers\OrderController::class);
    Route::post('orders/{order}/approve', [\App\Http\Controllers\OrderController::class, 'approve'])->name('orders.approve');
    Route::post('orders/{order}/reject', [\App\Http\Controllers\OrderController::class, 'reject'])->name('orders.reject');
    Route::post('orders/{order}/pay', [\App\Http\Controllers\OrderController::class, 'pay'])->name('orders.pay');
    Route::get('orders/{id}/activity', [\App\Http\Controllers\OrderController::class, 'getActivity'])->name('orders.activity');

    Route::get('activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-logs.index');
});

require __DIR__ . '/settings.php';
