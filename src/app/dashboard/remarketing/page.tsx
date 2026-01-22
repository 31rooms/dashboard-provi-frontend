import { getDashboardStats, getFilterOptions } from "@/lib/data";
import DashboardView from "@/components/dashboard/DashboardView";

export default async function RemarketingPage() {
    const stats = await getDashboardStats({ tab: 'remarketing' });
    const filterOptions = await getFilterOptions();

    return (
        <div className="space-y-6">
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-purple-800 text-sm flex items-center justify-between">
                <div>
                    <strong>Pestaña Remarketing:</strong> Análisis exclusivo de leads en pipelines de RMKT.
                </div>
                <div className="text-xs bg-purple-200 px-2 py-1 rounded-lg font-bold">RMKT ONLY</div>
            </div>
            <DashboardView
                initialStats={stats}
                filterOptions={filterOptions}
                tab="remarketing"
            />
        </div>
    );
}
