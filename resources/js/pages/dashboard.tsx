import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export default function Dashboard({ stats }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sidebar-accent to-sidebar-primary/10 p-8 shadow-sm border border-sidebar-border">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Welcome back, {auth.user.name}!
                        </h2>
                        <p className="mt-2 text-lg text-muted-foreground">
                            You are logged in as <span className="font-semibold text-primary capitalize">{auth.user.role}</span>.
                            Here's what's happening correctly.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Orders"
                        value={stats.total}
                        icon={FileText}
                        className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                    />
                    <StatCard
                        title="Approved Orders"
                        value={stats.approved}
                        icon={CheckCircle2}
                        className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                    />
                    <StatCard
                        title="Pending Orders"
                        value={stats.pending}
                        icon={Clock}
                        className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400"
                    />
                    <StatCard
                        title="Rejected Orders"
                        value={stats.rejected}
                        icon={XCircle}
                        className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon: Icon, className }: { title: string, value: number, icon: any, className?: string }) {
    return (
        <Link href="/orders" className="block transition-transform hover:scale-[1.02]">
            <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className={`rounded-lg p-3 ${className}`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                    </div>
                </div>
            </div>
        </Link>
    );
}
