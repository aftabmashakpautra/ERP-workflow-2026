import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Eye, FileText, Loader2, Pencil, Plus, Trash2, X, XCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

// Route Helpers
const ordersDestroy = (id: number) => ({ url: `/orders/${id}`, method: 'delete' as const });
const ordersUpdate = (id: number) => ({ url: `/orders/${id}`, method: 'put' as const });
const ordersApprove = (id: number) => ({ url: `/orders/${id}/approve`, method: 'post' as const });
const ordersReject = (id: number) => ({ url: `/orders/${id}/reject`, method: 'post' as const });
const ordersPay = (id: number) => ({ url: `/orders/${id}/pay`, method: 'post' as const });
const ordersActivity = (id: number) => `/orders/${id}/activity`;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders',
        href: '/orders',
    },
];

// Types
interface OrderItem {
    id?: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
}

interface Order {
    id: number;
    customer_name: string;
    amount: string; // Total amount
    status: 'pending' | 'approved' | 'rejected';
    payment_status: 'unpaid' | 'paid';
    created_at: string;
    user: {
        name: string;
    };
    approver?: {
        name: string;
    };
    items: OrderItem[];
}

interface Activity {
    id: number;
    action: string;
    description: string;
    created_at: string;
    user: {
        name: string;
    };
}

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-white shadow-lg transition-all animate-in slide-in-from-bottom-5 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 rounded-full p-1 hover:bg-white/20">
                <X size={16} />
            </button>
        </div>
    );
}

export default function OrdersIndex({ orders }: { orders: Order[] }) {
    const { auth, flash } = usePage<SharedData & { flash: { success?: string; error?: string } }>().props;
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Update toast when flash props change
    useEffect(() => {
        if (flash.success) setToast({ message: flash.success, type: 'success' });
        if (flash.error) setToast({ message: flash.error, type: 'error' });
    }, [flash]);

    // Modals State
    const [createOpen, setCreateOpen] = useState(false);
    const [editOrder, setEditOrder] = useState<Order | null>(null);
    const [logsOrder, setLogsOrder] = useState<Order | null>(null);
    const [logs, setLogs] = useState<Activity[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Fetch Logs
    useEffect(() => {
        if (logsOrder) {
            setLoadingLogs(true);
            fetch(ordersActivity(logsOrder.id))
                .then(res => res.json())
                .then(data => {
                    setLogs(data);
                    setLoadingLogs(false);
                })
                .catch(() => setLoadingLogs(false));
        }
    }, [logsOrder]);

    const handleAction = (url: string, method: 'post' | 'delete' = 'post') => {
        if (confirm('Are you sure you want to perform this action?')) {
            router.visit(url, { method });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Order Management</h2>
                    {auth.user.role === 'sales' && (
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Order
                        </Button>
                    )}
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border flex-1 overflow-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-sidebar-accent text-sidebar-foreground sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-medium">Order #</th>
                                <th className="p-4 font-medium">Customer</th>
                                <th className="p-4 font-medium">Items</th>
                                <th className="p-4 font-medium">Total</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Payment</th>
                                <th className="p-4 font-medium">Created By</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-4 text-center text-gray-500">No orders found.</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="border-sidebar-border/50 border-b last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900 group">
                                        <td className="p-4 font-mono">#{order.id}</td>
                                        <td className="p-4 font-medium text-foreground">{order.customer_name}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {order.items.length} items
                                        </td>
                                        <td className="p-4 font-bold text-foreground">${Number(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                                                ${order.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    order.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                {order.status}
                                            </span>
                                            {order.status === 'approved' && order.approver && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    by {order.approver.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                                                ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td className="p-4">{order.user.name}</td>
                                        <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-blue-600" title="View Activity" onClick={() => setLogsOrder(order)}>
                                                    <FileText size={16} />
                                                </Button>

                                                {auth.user.role === 'sales' && (order.status === 'pending' || order.status === 'rejected') && (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Edit" onClick={() => setEditOrder(order)}>
                                                            <Pencil size={16} />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Delete" onClick={() => handleAction(ordersDestroy(order.id).url, 'delete')}>
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </>
                                                )}

                                                {auth.user.role === 'manager' && order.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleAction(ordersApprove(order.id).url)}>
                                                            Approve
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleAction(ordersReject(order.id).url)}>
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {auth.user.role === 'accounts' && order.payment_status === 'unpaid' && order.status === 'approved' && (
                                                    <Button size="sm" variant="outline" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleAction(ordersPay(order.id).url)}>
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Create Order Modal */}
                <OrderFormModal
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    mode="create"
                />

                {/* Edit Order Modal */}
                {editOrder && (
                    <OrderFormModal
                        open={!!editOrder}
                        onOpenChange={(open) => !open && setEditOrder(null)}
                        mode="edit"
                        order={editOrder}
                    />
                )}

                {/* Activity Logs Modal */}
                <Dialog open={!!logsOrder} onOpenChange={(open) => !open && setLogsOrder(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Activity Logs - Order #{logsOrder?.id}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto mt-4">
                            {loadingLogs ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : logs.length === 0 ? (
                                <p className="text-center text-muted-foreground p-8">No activity found for this order.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {logs.map((log) => (
                                        <li key={log.id} className="relative pl-6 pb-2 border-l-2 border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
                                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-white dark:ring-neutral-950"></div>
                                            <div className="text-sm font-semibold text-foreground flex justify-between">
                                                <span>{log.user.name}</span>
                                                <span className="text-xs text-muted-foreground font-normal">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">{log.action}</div>
                                            <div className="text-sm text-muted-foreground mt-1">{log.description}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

function OrderFormModal({ open, onOpenChange, mode, order }: { open: boolean, onOpenChange: (open: boolean) => void, mode: 'create' | 'edit', order?: Order }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        customer_name: order?.customer_name || '',
        items: order?.items.map(i => ({ ...i, price: String(i.price), quantity: String(i.quantity) })) || [{ product_name: '', quantity: '1', price: '0', total: 0 }],
    });

    useEffect(() => {
        if (open && order) {
            setData({
                customer_name: order.customer_name,
                items: order.items.map(i => ({ product_name: i.product_name, quantity: String(i.quantity), price: String(i.price), total: i.total }))
            });
        }
        if (open && !order && mode === 'create') {
            reset();
        }
    }, [open, order]);

    const addItem = () => {
        setData('items', [...data.items, { product_name: '', quantity: '1', price: '0', total: 0 }]);
    };

    const removeItem = (index: number) => {
        if (data.items.length > 1) {
            setData('items', data.items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        // Recalculate total if qty or price changes
        if (field === 'quantity' || field === 'price') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].price) || 0;
            newItems[index].total = qty * price;
        }
        setData('items', newItems);
    };

    const calculateTotal = () => {
        return data.items.reduce((sum, item) => sum + (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.price)) || 0), 0);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const payload = {
            ...data,
            items: data.items.map(i => ({ ...i, quantity: Number(i.quantity), price: Number(i.price) }))
        };

        if (mode === 'create') {
            post('/orders', {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
                onError: (errors) => console.log(errors)
            });
        } else {
            // @ts-ignore
            router.put(`/orders/${order!.id}`, payload, {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Create New Order' : `Edit Order #${order?.id}`}</DialogTitle>
                    <DialogDescription>Fill in the order details and items below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-6 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                            id="customer_name"
                            value={data.customer_name}
                            onChange={(e) => setData('customer_name', e.target.value)}
                            placeholder="Enter customer name"
                            required
                        />
                        {errors.customer_name && <p className="text-red-500 text-sm">{errors.customer_name}</p>}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Order Items</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus size={14} className="mr-1" /> Add Item</Button>
                        </div>
                        <div className="space-y-2">
                            {data.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end bg-accent/20 p-3 rounded-lg">
                                    <div className="col-span-1 border-r flex items-center justify-center font-mono text-xs text-muted-foreground h-10">{index + 1}</div>
                                    <div className="col-span-5">
                                        <Label className="text-xs mb-1 block">Product</Label>
                                        <Input value={item.product_name} onChange={(e) => updateItem(index, 'product_name', e.target.value)} placeholder="Product Name" required className="h-8 text-xs" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs mb-1 block">Qty</Label>
                                        <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} placeholder="1" min="1" required className="h-8 text-xs" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs mb-1 block">Price</Label>
                                        <Input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(index, 'price', e.target.value)} placeholder="0.00" min="0" required className="h-8 text-xs" />
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(index)} disabled={data.items.length === 1}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end items-center gap-2 pt-2 border-t">
                            <span className="font-semibold text-sm">Total Amount:</span>
                            <span className="text-xl font-bold">${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{mode === 'create' ? 'Create Order' : 'Update Order'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
