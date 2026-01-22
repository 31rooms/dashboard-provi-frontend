import { getDashboardStats, getFilterOptions } from "@/lib/data";
import DashboardView from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
    const stats = await getDashboardStats({ tab: 'direccion' });
    const filterOptions = await getFilterOptions();

    return (
        <DashboardView
            initialStats={stats}
            filterOptions={filterOptions}
            tab="direccion"
        />
    );
}
