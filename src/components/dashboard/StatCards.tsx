import { Users, Calendar, MapPin, DollarSign, Footprints, Monitor, CheckCircle, XCircle, Wallet } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    trend?: {
        value: string;
        positive: boolean;
    };
    subValue?: {
        label: string;
        value: string | number;
    };
    secondSubValue?: {
        label: string;
        value: string | number;
    };
}

const StatCard = ({ title, value, description, icon: Icon, trend, subValue, secondSubValue }: StatCardProps) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-900">
                <Icon size={24} />
            </div>
        </div>
        <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
            {(subValue || secondSubValue) && (
                <div className="flex gap-4 mt-2">
                    {subValue && (
                        <div className="flex items-center gap-1.5">
                            <Monitor size={12} className="text-blue-500" />
                            <span className="text-xs font-semibold text-blue-600">{subValue.value}</span>
                            <span className="text-xs text-slate-400">{subValue.label}</span>
                        </div>
                    )}
                    {secondSubValue && (
                        <div className="flex items-center gap-1.5">
                            <Footprints size={12} className="text-orange-500" />
                            <span className="text-xs font-semibold text-orange-600">{secondSubValue.value}</span>
                            <span className="text-xs text-slate-400">{secondSubValue.label}</span>
                        </div>
                    )}
                </div>
            )}
            <p className="text-xs text-slate-400 mt-2">{description}</p>
        </div>
    </div>
);

export function KPIStatsCards({ stats, tab = "direccion" }: { stats: any; tab?: string }) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    // Calcular leads digitales y walk-ins
    const totalLeads = stats.newLeads || 0;
    const walkInLeads = stats.walkInLeads || 0;
    const digitalLeads = totalLeads - walkInLeads;

    // Para la vista de Dirección: 4 cards (Leads con desglose, Citas, Visitados, Monto)
    if (tab === "direccion") {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Nuevos Leads"
                    value={totalLeads}
                    description="Prospectos en el periodo"
                    icon={Users}
                    trend={stats.trends?.leads}
                    subValue={{ label: "Digital", value: digitalLeads }}
                    secondSubValue={{ label: "Walk-in", value: walkInLeads }}
                />
                <StatCard
                    title="Citas Agendadas"
                    value={stats.appointmentsCount || 0}
                    description="Leads con cita confirmada"
                    icon={Calendar}
                    trend={stats.trends?.appointments}
                />
                <StatCard
                    title="Visitados"
                    value={stats.visitedCount || 0}
                    description="Leads que visitaron el desarrollo"
                    icon={MapPin}
                    trend={stats.trends?.visited}
                />
                <StatCard
                    title="Monto Proyectado"
                    value={formatCurrency(stats.totalAmount || 0)}
                    description="Valor total de oportunidades"
                    icon={DollarSign}
                    trend={stats.trends?.amount}
                />
            </div>
        );
    }

    // Para la vista de Marketing: Total leads, calificados/no calificados, citas, visitados, presupuesto
    if (tab === "marketing") {
        const qualifiedLeads = stats.qualifiedLeads || 0;
        const nonQualifiedLeads = stats.nonQualifiedLeads || 0;
        const budget = stats.budgetByDesarrollo?.total || 135000; // Presupuesto de muestra

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                <StatCard
                    title="Nuevos Leads"
                    value={totalLeads}
                    description="Total en el periodo"
                    icon={Users}
                    trend={stats.trends?.leads}
                    subValue={{ label: "Digital", value: digitalLeads }}
                    secondSubValue={{ label: "Walk-in", value: walkInLeads }}
                />
                <StatCard
                    title="Leads Calificados"
                    value={qualifiedLeads}
                    description="Leads con status QL"
                    icon={CheckCircle}
                />
                <StatCard
                    title="No Calificados"
                    value={nonQualifiedLeads}
                    description="Leads pendientes de calificar"
                    icon={XCircle}
                />
                <StatCard
                    title="Citas Agendadas"
                    value={stats.appointmentsCount || 0}
                    description="Leads con cita confirmada"
                    icon={Calendar}
                />
                <StatCard
                    title="Visitados"
                    value={stats.visitedCount || 0}
                    description="Leads que visitaron desarrollo"
                    icon={MapPin}
                />
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                            <Wallet size={24} />
                        </div>
                        <span className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase">
                            Muestra
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-slate-500">Presupuesto Campaña</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(budget)}</h3>
                        <div className="flex flex-col gap-1 mt-2 text-xs text-slate-400">
                            <span>Bosques: {formatCurrency(stats.budgetByDesarrollo?.["Bosques de Cholul"] || 45000)}</span>
                            <span>Cumbres: {formatCurrency(stats.budgetByDesarrollo?.["Cumbres de San Pedro"] || 38000)}</span>
                            <span>Paraíso: {formatCurrency(stats.budgetByDesarrollo?.["Paraíso Caucel"] || 52000)}</span>
                        </div>
                        <p className="text-xs text-amber-600 mt-2 italic">* Dato de muestra (Meta API pendiente)</p>
                    </div>
                </div>
            </div>
        );
    }

    // Para otras vistas: mostrar cards relevantes
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Nuevos Leads"
                value={totalLeads}
                description="Prospectos en el periodo"
                icon={Users}
                trend={stats.trends?.leads}
                subValue={{ label: "Digital", value: digitalLeads }}
                secondSubValue={{ label: "Walk-in", value: walkInLeads }}
            />
            <StatCard
                title="Citas Agendadas"
                value={stats.appointmentsCount || 0}
                description="Leads con cita confirmada"
                icon={Calendar}
                trend={stats.trends?.appointments}
            />
            <StatCard
                title="Visitados"
                value={stats.visitedCount || 0}
                description="Leads que visitaron el desarrollo"
                icon={MapPin}
            />
            <StatCard
                title="Monto Proyectado"
                value={formatCurrency(stats.totalAmount || 0)}
                description="Valor total de oportunidades"
                icon={DollarSign}
                trend={stats.trends?.amount}
            />
        </div>
    );
}
