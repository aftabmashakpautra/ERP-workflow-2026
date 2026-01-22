import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activity Logs',
        href: '/activity-logs',
    },
];

interface Activity {
    id: number;
    action: string;
    description: string;
    created_at: string;
    user: {
        name: string;
    };
}

export default function ActivityLogsIndex({ activities }: { activities: Activity[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Activity Logs</h2>
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border flex-1 overflow-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-sidebar-accent text-sidebar-foreground sticky top-0">
                            <tr>
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Action</th>
                                <th className="p-4 font-medium">Description</th>
                                <th className="p-4 font-medium">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">No activities found.</td>
                                </tr>
                            ) : (
                                activities.map((log) => (
                                    <tr key={log.id} className="border-sidebar-border/50 border-b last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                        <td className="p-4 font-medium text-foreground">{log.user.name}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">{log.description}</td>
                                        <td className="p-4">{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
