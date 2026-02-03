"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { KPIStatsCards } from "./StatCards";
import { LeadsChart } from "./LeadsChart";
import { SourcesChart } from "./SourcesChart";
import { SourcesDetailChart } from "./SourcesDetailChart";
import { AdvisorPerformance } from "./AdvisorPerformance";
import { WalkInsTable } from "./WalkInsTable";
import { Building2, UserCircle, Loader2, ChevronDown, Filter, Users, TrendingUp, TrendingDown } from "lucide-react";
import { AccordionSection } from "./AccordionSection";
import { startOfDay, subDays, endOfDay, startOfMonth, format } from "date-fns";
import { DateRangePicker } from "./DateRangePicker";

type TimeRangeOption = "today" | "7days" | "month" | "custom";

export default function DashboardView({
    initialStats,
    filterOptions,
    tab = "direccion"
}: {
    initialStats: any;
    filterOptions: any;
    tab?: string;
}) {
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(false);
    const [desarrollo, setDesarrollo] = useState("all");
    const [asesor, setAsesor] = useState("all");

    // Filtrar asesores según el desarrollo seleccionado
    const filteredAsesores = useMemo(() => {
        if (desarrollo === "all") {
            return filterOptions.asesores || [];
        }
        // Usar el mapeo de asesores por desarrollo si está disponible
        if (filterOptions.asesoresByDesarrollo && filterOptions.asesoresByDesarrollo[desarrollo]) {
            return filterOptions.asesoresByDesarrollo[desarrollo];
        }
        return filterOptions.asesores || [];
    }, [desarrollo, filterOptions]);

    // Resetear asesor cuando cambia el desarrollo
    const handleDesarrolloChange = useCallback((newDesarrollo: string) => {
        setDesarrollo(newDesarrollo);
        // Si el asesor actual no está en la lista del nuevo desarrollo, resetear a "all"
        if (newDesarrollo !== "all") {
            const asesoresDelDesarrollo = filterOptions.asesoresByDesarrollo?.[newDesarrollo] || [];
            if (asesor !== "all" && !asesoresDelDesarrollo.includes(asesor)) {
                setAsesor("all");
            }
        }
    }, [asesor, filterOptions.asesoresByDesarrollo]);

    // Time Range State
    const [timeRange, setTimeRange] = useState<TimeRangeOption>("7days");
    const [customDates, setCustomDates] = useState({
        from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd")
    });

    const getQueryDates = useCallback(() => {
        const now = new Date();
        switch (timeRange) {
            case "today":
                return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
            case "7days":
                return { from: startOfDay(subDays(now, 7)).toISOString(), to: endOfDay(now).toISOString() };
            case "month":
                return { from: startOfMonth(now).toISOString(), to: endOfDay(now).toISOString() };
            case "custom":
                return {
                    from: startOfDay(new Date(customDates.from)).toISOString(),
                    to: endOfDay(new Date(customDates.to)).toISOString()
                };
            default:
                return { from: startOfDay(subDays(now, 7)).toISOString(), to: endOfDay(now).toISOString() };
        }
    }, [timeRange, customDates]);

    const fetchFilteredData = useCallback(async () => {
        setLoading(true);
        try {
            const { from, to } = getQueryDates();
            const params = new URLSearchParams({
                from,
                to,
                tab
            });
            if (desarrollo !== "all") params.append("desarrollo", desarrollo);
            if (asesor !== "all") params.append("asesor", asesor);

            const response = await fetch(`/api/stats?${params.toString()}`);
            if (response.ok) {
                const newData = await response.json();
                setStats(newData);
            }
        } catch (error) {
            console.error("Error fetching filtered stats:", error);
        } finally {
            setLoading(false);
        }
    }, [getQueryDates, desarrollo, asesor, tab]);

    const [isFirstMount, setIsFirstMount] = useState(true);
    useEffect(() => {
        if (isFirstMount) {
            setIsFirstMount(false);
            return;
        }
        fetchFilteredData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [desarrollo, asesor, timeRange, customDates, tab, isFirstMount]);

    const getTitle = () => {
        switch (tab) {
            case "direccion": return "Visión Macro";
            case "ventas": return "Rendimiento Operativo";
            case "marketing": return "Análisis de Canales";
            case "remarketing": return "Recuperación de Leads";
            case "brokers": return "Aliados Externos";
            default: return "Dashboard";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {getTitle()}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Información actualizada en tiempo real desde la base de datos.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Project Filter */}
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold pointer-events-none">
                            <Building2 size={16} />
                        </span>
                        <select
                            value={desarrollo}
                            onChange={(e) => handleDesarrolloChange(e.target.value)}
                            className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-50 focus:border-slate-400 transition-all appearance-none cursor-pointer shadow-sm min-w-[200px]"
                        >
                            <option value="all">Todos los Desarrollos</option>
                            {filterOptions.desarrollos.map((d: string) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Advisor Filter */}
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold pointer-events-none">
                            <UserCircle size={16} />
                        </span>
                        <select
                            value={asesor}
                            onChange={(e) => setAsesor(e.target.value)}
                            className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-50 focus:border-slate-400 transition-all appearance-none cursor-pointer shadow-sm min-w-[180px]"
                        >
                            <option value="all">
                                {desarrollo === "all" ? "Todos los Asesores" : `Asesores de ${desarrollo.split(" ")[0]}`}
                            </option>
                            {filteredAsesores.filter((a: string) => a !== "Por asignar").map((a: string) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                            {filteredAsesores.includes("Por asignar") && (
                                <option value="Por asignar">Por asignar</option>
                            )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Time Filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                            {(["7days", "today", "month", "custom"] as const).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setTimeRange(opt)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === opt
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    {opt === "today" ? "Hoy" : opt === "7days" ? "7 d" : opt === "month" ? "Mes" : "Cust"}
                                </button>
                            ))}
                        </div>

                        {timeRange === "custom" && (
                            <div className="animate-in slide-in-from-right-2 duration-300">
                                <DateRangePicker
                                    from={customDates.from}
                                    to={customDates.to}
                                    onSelect={(range) => setCustomDates(range)}
                                />
                            </div>
                        )}
                    </div>

                    {loading && <Loader2 className="w-5 h-5 animate-spin text-orange-500" />}
                </div>
            </div>

            {!stats ? (
                <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                </div>
            ) : (
                <>
                    <KPIStatsCards stats={stats.summary} tab={tab} />

                    {/* ============================================ */}
                    {/* VISTA DE DIRECCIÓN (Macro) */}
                    {/* ============================================ */}
                    {tab === "direccion" && (
                        <>
                            {/* Nota informativa sobre citas */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-sm text-blue-700">
                                    <strong>Nota:</strong> Las citas y visitados mostrados corresponden a leads donde el checkbox fue marcado durante el periodo seleccionado.
                                </p>
                            </div>

                            {/* Ventas del Periodo */}
                            {stats.summary?.salesSummary && stats.summary.salesSummary.totalGanadas > 0 && (
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Ventas del Periodo</h3>
                                            <p className="text-sm text-slate-500">Leads cerrados como ganados</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="text-green-500" size={20} />
                                            <span className="text-2xl font-bold text-green-600">{stats.summary.salesSummary.totalGanadas}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.entries(stats.summary.salesSummary.porDesarrollo || {}).map(([desarrollo, data]: [string, any]) => (
                                            <div key={desarrollo} className="bg-slate-50 rounded-xl p-4">
                                                <p className="text-sm font-medium text-slate-600">{desarrollo}</p>
                                                <p className="text-xl font-bold text-slate-900">{data.count} ventas</p>
                                                <p className="text-sm text-green-600 font-semibold">
                                                    ${data.monto.toLocaleString("es-MX")}
                                                    {data.sinMonto > 0 && <span className="text-amber-600">*</span>}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Monto total de ventas</span>
                                            <span className="text-xl font-bold text-green-600">
                                                ${stats.summary.salesSummary.montoGanadas?.toLocaleString("es-MX") || 0}
                                            </span>
                                        </div>
                                        {stats.summary.salesSummary.sinMonto > 0 && (
                                            <p className="text-xs text-amber-600 mt-2">
                                                * {stats.summary.salesSummary.sinMonto} venta(s) sin monto asignado
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Distribución por Tipo de Canal */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Gráfico de barras por tipo */}
                                <SourcesChart data={stats.sourcesData} />

                                {/* Tabla resumen por tipo de canal */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-slate-900">Resumen por Tipo de Canal</h3>
                                        <p className="text-sm text-slate-500">Leads agrupados por categoría</p>
                                    </div>
                                    {/* Nota informativa */}
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                        <p className="text-xs text-blue-700">
                                            <strong>Nota:</strong> Facebook Leads Ads y WhatsApp Business pueden contener leads similares.
                                            Algunos prospectos entran directo por WhatsApp sin ser detectados como campaña.
                                        </p>
                                    </div>
                                    <div className="overflow-y-auto max-h-[320px]">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tipo de Canal</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Leads</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">%</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {stats.sourcesData && stats.sourcesData.length > 0 ? (
                                                    (() => {
                                                        const total = stats.sourcesData.reduce((sum: number, s: any) => sum + s.value, 0);
                                                        return stats.sourcesData.map((source: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                                    {source.name}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-700">
                                                                    {source.value.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right text-slate-500">
                                                                    {total > 0 ? ((source.value / total) * 100).toFixed(1) : 0}%
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                                                            No hay datos disponibles
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================ */}
                    {/* VISTA DE VENTAS (Operativa) */}
                    {/* ============================================ */}
                    {tab === "ventas" && (
                        <>
                            {/* Ventas del Periodo */}
                            {stats.summary?.salesSummary && (stats.summary.salesSummary.totalGanadas > 0 || stats.summary.salesSummary.totalPerdidas > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Ventas Ganadas</h3>
                                                <p className="text-sm text-slate-500">Leads cerrados exitosamente</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="text-green-500" size={24} />
                                                <span className="text-3xl font-bold text-green-600">{stats.summary.salesSummary.totalGanadas}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(stats.summary.salesSummary.porDesarrollo || {}).map(([desarrollo, data]: [string, any]) => (
                                                <div key={desarrollo} className="flex justify-between items-center bg-green-50 rounded-lg p-3">
                                                    <span className="text-sm font-medium text-slate-700">{desarrollo}</span>
                                                    <div className="text-right">
                                                        <span className="text-sm font-bold text-green-700">{data.count}</span>
                                                        <span className="text-xs text-slate-500 ml-2">
                                                            ${data.monto.toLocaleString("es-MX")}
                                                            {data.sinMonto > 0 && <span className="text-amber-600">*</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-green-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-slate-600">Monto Total</span>
                                                <span className="text-xl font-bold text-green-600">
                                                    ${stats.summary.salesSummary.montoGanadas?.toLocaleString("es-MX") || 0}
                                                </span>
                                            </div>
                                            {stats.summary.salesSummary.sinMonto > 0 && (
                                                <p className="text-xs text-amber-600 mt-2">
                                                    * {stats.summary.salesSummary.sinMonto} venta(s) sin monto asignado
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Ventas Perdidas</h3>
                                                <p className="text-sm text-slate-500">Leads cerrados sin venta</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="text-red-500" size={24} />
                                                <span className="text-3xl font-bold text-red-600">{stats.summary.salesSummary.totalPerdidas}</span>
                                            </div>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-4">
                                            <p className="text-sm text-red-700">
                                                Monto perdido: <span className="font-bold">${stats.summary.salesSummary.montoPerdidas?.toLocaleString("es-MX") || 0}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* KPI #10: Walk-ins */}
                            {stats.walkIns && stats.walkIns.length > 0 && (
                                <WalkInsTable data={stats.walkIns} />
                            )}

                            {/* Leads por etapa del pipeline - Rendimiento de asesores por desarrollo */}
                            {stats.advisorPerformanceDetailed && stats.advisorPerformanceDetailed.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Inventario de Leads por Asesor</h3>
                                    {["Bosques de Cholul", "Cumbres de San Pedro", "Paraíso Caucel"].map((desarrollo) => {
                                        const asesoresDesarrollo = stats.advisorPerformanceDetailed.filter(
                                            (row: any) => row.desarrollo === desarrollo
                                        );

                                        if (asesoresDesarrollo.length === 0) return null;

                                        // Calcular totales del desarrollo
                                        const totales = asesoresDesarrollo.reduce((acc: any, row: any) => ({
                                            total_leads: (acc.total_leads || 0) + (row.total_leads || 0),
                                            para_seguimiento_manual: (acc.para_seguimiento_manual || 0) + (row.para_seguimiento_manual || 0),
                                            en_seguimiento_manual: (acc.en_seguimiento_manual || 0) + (row.en_seguimiento_manual || 0),
                                            cita_agendada: (acc.cita_agendada || 0) + (row.cita_agendada || 0),
                                            cancelacion_no_show: (acc.cancelacion_no_show || 0) + (row.cancelacion_no_show || 0),
                                            negociacion_activa: (acc.negociacion_activa || 0) + (row.negociacion_activa || 0),
                                            apartado_realizado: (acc.apartado_realizado || 0) + (row.apartado_realizado || 0),
                                            cliente_futuro: (acc.cliente_futuro || 0) + (row.cliente_futuro || 0),
                                            leads_ganados: (acc.leads_ganados || 0) + (row.leads_ganados || 0),
                                            leads_perdidos: (acc.leads_perdidos || 0) + (row.leads_perdidos || 0),
                                            monto_ganado: (acc.monto_ganado || 0) + (row.monto_ganado || 0),
                                        }), {});

                                        return (
                                            <AccordionSection
                                                key={desarrollo}
                                                title={desarrollo}
                                                subtitle={`${totales.total_leads} leads activos (no se aplica filtro de periodo)`}
                                                badge={{ text: "Inventario actual", color: "bg-amber-100 text-amber-700" }}
                                                headerRight={
                                                    <div className="flex items-center gap-4 text-sm">
                                                        {totales.leads_ganados > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <TrendingUp className="text-green-500" size={14} />
                                                                <span className="font-bold text-green-600">{totales.leads_ganados}</span>
                                                            </div>
                                                        )}
                                                        {totales.leads_perdidos > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <TrendingDown className="text-red-500" size={14} />
                                                                <span className="font-bold text-red-600">{totales.leads_perdidos}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                }
                                            >
                                                <div className="overflow-x-auto">
                                                    <table className="w-full table-fixed">
                                                        <colgroup>
                                                            <col className="w-[140px]" />
                                                            <col className="w-[60px]" />
                                                            <col className="w-[60px]" />
                                                            <col className="w-[60px]" />
                                                            <col className="w-[60px]" />
                                                            <col className="w-[60px]" />
                                                            <col className="w-[60px]" />
                                                            <col className="w-[70px]" />
                                                            <col className="w-[70px]" />
                                                            <col className="w-[60px]" />
                                                            <col className="w-[60px]" />
                                                        </colgroup>
                                                        <thead className="bg-slate-50/50">
                                                            <tr>
                                                                <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asesor</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">P.Seg</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">E.Seg</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cita</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cancel</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Negoc</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apartado</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">C.Futuro</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50">Ganados</th>
                                                                <th className="px-2 py-3 text-center text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50">Perdidos</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-slate-50">
                                                            {asesoresDesarrollo.map((row: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-3 py-3 text-sm font-semibold text-slate-900 truncate">{row.asesor || "Sin asignar"}</td>
                                                                    <td className="px-2 py-3 text-sm text-center font-bold text-slate-900">{row.total_leads || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center text-slate-600">{row.para_seguimiento_manual || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center text-slate-600">{row.en_seguimiento_manual || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center text-blue-600 font-semibold">{row.cita_agendada || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center text-orange-600">{row.cancelacion_no_show || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center text-purple-600 font-semibold">{row.negociacion_activa || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center">
                                                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-bold">
                                                                            {row.apartado_realizado || 0}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-3 text-sm text-center text-slate-500">{row.cliente_futuro || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center font-bold text-green-600 bg-green-50/50">{row.leads_ganados || 0}</td>
                                                                    <td className="px-2 py-3 text-sm text-center font-bold text-red-600 bg-red-50/50">{row.leads_perdidos || 0}</td>
                                                                </tr>
                                                            ))}
                                                            {/* Fila de totales */}
                                                            <tr className="bg-slate-100 font-bold">
                                                                <td className="px-3 py-3 text-sm text-slate-900">TOTAL</td>
                                                                <td className="px-2 py-3 text-sm text-center text-slate-900">{totales.total_leads || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-slate-700">{totales.para_seguimiento_manual || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-slate-700">{totales.en_seguimiento_manual || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-blue-700">{totales.cita_agendada || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-orange-700">{totales.cancelacion_no_show || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-purple-700">{totales.negociacion_activa || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-green-700">{totales.apartado_realizado || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-slate-700">{totales.cliente_futuro || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-green-700 bg-green-100">{totales.leads_ganados || 0}</td>
                                                                <td className="px-2 py-3 text-sm text-center text-red-700 bg-red-100">{totales.leads_perdidos || 0}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </AccordionSection>
                                        );
                                    })}
                                </div>
                            ) : (
                                <AdvisorPerformance data={stats.performance || []} />
                            )}
                        </>
                    )}

                    {/* ============================================ */}
                    {/* VISTA DE MARKETING */}
                    {/* ============================================ */}
                    {tab === "marketing" && (
                        <>
                            {/* Distribución por Canal - Gráfico */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <SourcesChart data={stats.sourcesData} title="Distribución por Canal" />

                                {/* Ventas del Periodo (mismo que Dirección) */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Ventas del Periodo</h3>
                                            <p className="text-sm text-slate-500">Leads cerrados como ganados</p>
                                        </div>
                                        {stats.summary?.salesSummary && (
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="text-green-500" size={20} />
                                                <span className="text-2xl font-bold text-green-600">{stats.summary.salesSummary.totalGanadas}</span>
                                            </div>
                                        )}
                                    </div>
                                    {stats.summary?.salesSummary && stats.summary.salesSummary.totalGanadas > 0 ? (
                                        <>
                                            <div className="space-y-2">
                                                {Object.entries(stats.summary.salesSummary.porDesarrollo || {}).map(([desarrollo, data]: [string, any]) => (
                                                    <div key={desarrollo} className="flex justify-between items-center bg-green-50 rounded-lg p-3">
                                                        <span className="text-sm font-medium text-slate-700">{desarrollo}</span>
                                                        <div className="text-right">
                                                            <span className="text-sm font-bold text-green-700">{data.count}</span>
                                                            <span className="text-xs text-slate-500 ml-2">
                                                                ${data.monto.toLocaleString("es-MX")}
                                                                {data.sinMonto > 0 && <span className="text-amber-600">*</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-slate-600">Monto Total</span>
                                                    <span className="text-xl font-bold text-green-600">
                                                        ${stats.summary.salesSummary.montoGanadas?.toLocaleString("es-MX") || 0}
                                                    </span>
                                                </div>
                                                {stats.summary.salesSummary.sinMonto > 0 && (
                                                    <p className="text-xs text-amber-600 mt-2">
                                                        * {stats.summary.salesSummary.sinMonto} venta(s) sin monto asignado
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-slate-400">
                                            <p>No hay ventas cerradas en este periodo</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Estadísticas por Tipo de Canal - Accordions */}
                            {stats.leadsByChannel?.grouped && stats.leadsByChannel.grouped.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Detalle por Tipo de Canal</h3>
                                    {stats.leadsByChannel.grouped.map((tipoGroup: any) => (
                                        <AccordionSection
                                            key={tipoGroup.tipo}
                                            title={tipoGroup.tipo}
                                            subtitle={`${tipoGroup.canales?.length || 0} canales`}
                                            headerRight={
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="text-center">
                                                        <div className="font-bold text-blue-600">{tipoGroup.total_leads}</div>
                                                        <div className="text-xs text-slate-500">Leads</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-slate-700">{tipoGroup.citas}</div>
                                                        <div className="text-xs text-slate-500">Citas</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-green-600">{tipoGroup.apartados}</div>
                                                        <div className="text-xs text-slate-500">Apartados</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-slate-900">${(tipoGroup.monto_proyectado || 0).toLocaleString("es-MX")}</div>
                                                        <div className="text-xs text-slate-500">Monto Proy.</div>
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div className="overflow-x-auto">
                                                <table className="w-full table-fixed">
                                                    <colgroup>
                                                        <col className="w-[40%]" />
                                                        <col className="w-[15%]" />
                                                        <col className="w-[15%]" />
                                                        <col className="w-[15%]" />
                                                        <col className="w-[15%]" />
                                                    </colgroup>
                                                    <thead className="bg-slate-50/50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Canal</th>
                                                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Leads</th>
                                                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Citas</th>
                                                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Apartados</th>
                                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Proy.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-slate-50">
                                                        {tipoGroup.canales.map((row: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-3 text-sm font-medium text-slate-800 truncate">{row.canal}</td>
                                                                <td className="px-6 py-3 text-sm text-center font-semibold text-blue-600">{row.total_leads || 0}</td>
                                                                <td className="px-6 py-3 text-sm text-center text-slate-600">{row.citas || 0}</td>
                                                                <td className="px-6 py-3 text-sm text-center text-slate-600">{row.apartados || 0}</td>
                                                                <td className="px-6 py-3 text-sm text-right font-mono text-slate-700">
                                                                    ${(row.monto_proyectado || 0).toLocaleString("es-MX")}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </AccordionSection>
                                    ))}
                                </div>
                            ) : stats.leadsByChannel && Array.isArray(stats.leadsByChannel) && stats.leadsByChannel.length > 0 ? (
                                /* Fallback para compatibilidad con formato anterior */
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-50">
                                        <h3 className="text-lg font-bold text-slate-900">Leads por Canal de Adquisición</h3>
                                        <p className="text-sm text-slate-500">Rendimiento de cada canal de marketing</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Canal</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Leads</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Citas</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Apartados</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-50">
                                                {stats.leadsByChannel.map((row: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.canal}</td>
                                                        <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">{row.total_leads || 0}</td>
                                                        <td className="px-6 py-4 text-sm text-center text-slate-700">{row.citas || 0}</td>
                                                        <td className="px-6 py-4 text-sm text-center text-slate-700">{row.apartados || 0}</td>
                                                        <td className="px-6 py-4 text-sm text-right font-mono font-bold text-slate-900">
                                                            ${(row.monto_total || 0).toLocaleString("es-MX")}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
                                    <div className="text-slate-400 mb-2">
                                        <Users className="w-12 h-12 mx-auto opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700">Sin datos de canales</h3>
                                    <p className="text-sm text-slate-500 mt-1">No hay leads registrados en el periodo seleccionado</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ============================================ */}
                    {/* VISTA DE REMARKETING */}
                    {/* ============================================ */}
                    {tab === "remarketing" && (
                        <>
                            {/* KPI #4: Métricas de remarketing */}
                            {stats.remarketingMetrics && stats.remarketingMetrics.length > 0 ? (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold mb-4">Métricas de Remarketing (KPI #4)</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pipeline</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asesor</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Leads en RMKT</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mensajes Enviados</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Citas Recuperadas</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Apartados</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tasa Recuperación</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {stats.remarketingMetrics.map((row: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-700">{row.pipeline_name || "N/A"}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.responsible_user_name || "Sin asignar"}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-900">{row.leads_en_rmkt || 0}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-blue-600">{row.total_mensajes_enviados || 0}</td>
                                                        <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">{row.citas_recuperadas || 0}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-900">{row.apartados_recuperados || 0}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold">
                                                                {row.tasa_recuperacion || 0}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold mb-4">Métricas de Remarketing</h3>
                                    <p className="text-gray-500 text-center py-8">No hay datos de remarketing disponibles</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                <LeadsChart data={stats.dailyLeadsData} />
                            </div>

                            {/* Detalle de Fuentes por Tipo */}
                            {stats.sourcesDetailData && stats.sourcesDetailData.length > 0 && (
                                <SourcesDetailChart data={stats.sourcesDetailData} />
                            )}
                        </>
                    )}

                    {/* ============================================ */}
                    {/* VISTA DE BROKERS */}
                    {/* ============================================ */}
                    {tab === "brokers" && (
                        <>
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-4">Leads de Brokers</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Vista especializada para gestión de aliados externos (Pipeline: Brokers)
                                </p>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <LeadsChart data={stats.dailyLeadsData} />
                                    <SourcesChart data={stats.sourcesData} />
                                </div>
                            </div>

                            {stats.performance && stats.performance.length > 0 && (
                                <AdvisorPerformance data={stats.performance} />
                            )}
                        </>
                    )}

                    {/* Tabla general de últimos movimientos (NO se muestra en dirección, marketing ni ventas) */}
                    {tab !== "direccion" && tab !== "marketing" && tab !== "ventas" && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 capitalize">últimos movimientos</h3>
                                    <p className="text-sm text-slate-500">Listado detallado de actividad reciente</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Prospecto</th>
                                            <th className="px-6 py-4">Proyecto</th>
                                            <th className="px-6 py-4">Asesor</th>
                                            <th className="px-6 py-4">Canal</th>
                                            <th className="px-6 py-4">Monto</th>
                                            <th className="px-6 py-4 text-right">Etapa CRM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-sm">
                                        {stats.rawData?.length > 0 ? (
                                            stats.rawData.slice(0, 15).map((lead: any) => (
                                                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{lead.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">ID: {lead.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{lead.desarrollo || "Sin Proyecto"}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono uppercase">{lead.pipeline_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">{lead.responsible_user_name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                            {lead.fuente || lead.utm_source || "Orgánico"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(lead.price || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-extrabold italic uppercase tracking-tighter">
                                                            {lead.status_name}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-24 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Filter className="text-slate-200" size={48} />
                                                        <p className="text-slate-400 italic">No se encontraron prospectos con los filtros actuales.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
