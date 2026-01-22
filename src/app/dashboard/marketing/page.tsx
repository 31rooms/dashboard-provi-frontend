import { getDashboardStats, getFilterOptions } from "@/lib/data";
import DashboardView from "@/components/dashboard/DashboardView";

export default async function MarketingPage() {
    const stats = await getDashboardStats({ tab: 'marketing' });
    const filterOptions = await getFilterOptions();

    return (
        <DashboardView
            initialStats={stats}
            filterOptions={filterOptions}
            tab="marketing"
        />
    );
}
