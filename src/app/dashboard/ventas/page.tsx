import { getDashboardStats, getFilterOptions } from "@/lib/data";
import DashboardView from "@/components/dashboard/DashboardView";

export default async function VentasPage() {
    const stats = await getDashboardStats({ tab: 'ventas' });
    const filterOptions = await getFilterOptions();

    return (
        <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 text-sm">
                <strong>Pestaña Ventas:</strong> Monitoreo de productividad de asesores y tiempos de respuesta.
            </div>
            <DashboardView
                initialStats={stats}
                filterOptions={filterOptions}
                tab="ventas"
            />
        </div>
    );
}
