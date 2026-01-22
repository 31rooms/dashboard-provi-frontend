import { getDashboardStats, getFilterOptions } from "@/lib/data";
import DashboardView from "@/components/dashboard/DashboardView";

export default async function BrokersPage() {
    const stats = await getDashboardStats({ tab: 'brokers' });
    const filterOptions = await getFilterOptions();

    return (
        <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-sm">
                <strong>Pestaña Brokers:</strong> Gestión de leads enviados por aliados externos.
            </div>
            <DashboardView
                initialStats={stats}
                filterOptions={filterOptions}
                tab="brokers"
            />
        </div>
    );
}
