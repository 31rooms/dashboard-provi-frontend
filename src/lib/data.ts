import { supabase } from "./supabase";
import { startOfDay, subDays, endOfDay, differenceInDays, startOfMonth } from "date-fns";

// IDs de los pipelines principales (V2)
// PARAISO CAUCEL V2 (12290640), CUMBRES DE SAN PEDRO V2 (12535008), BOSQUES DE CHOLUL V2 (12535020)
export const MAIN_PIPELINES = [12290640, 12535008, 12535020];

// Helper para derivar el desarrollo del pipeline_name cuando no está asignado
function deriveDesarrollo(lead: any): any {
    if (lead.desarrollo) return lead;

    const pipelineName = (lead.pipeline_name || "").toUpperCase();
    let desarrollo = null;

    if (pipelineName.includes("PARAISO") || pipelineName.includes("CAUCEL")) {
        desarrollo = "Paraíso Caucel";
    } else if (pipelineName.includes("CUMBRES")) {
        desarrollo = "Cumbres de San Pedro";
    } else if (pipelineName.includes("BOSQUES")) {
        desarrollo = "Bosques de Cholul";
    }

    return { ...lead, desarrollo };
}

// Helper to fetch all records bypassing the 1000 limit
async function fetchAll(query: any, limit = 1000) {
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await query.range(from, from + limit - 1);
        if (error) throw error;
        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allData = [...allData, ...data];
            if (data.length < limit) {
                hasMore = false;
            } else {
                from += limit;
            }
        }
    }
    return allData;
}

export async function getDashboardStats(filters: {
    dateRange?: { from: string; to: string };
    desarrollo?: string;
    asesor?: string;
    tab?: string;
}) {
    // Rango por defecto (7 días)
    const fromDate = filters.dateRange?.from || startOfDay(subDays(new Date(), 7)).toISOString();
    const toDate = filters.dateRange?.to || endOfDay(new Date()).toISOString();

    // Rango previo para tendencias (opcional, para conteo rápido)
    const currentDuration = differenceInDays(new Date(toDate), new Date(fromDate)) + 1;
    const prevToDate = endOfDay(subDays(new Date(fromDate), 1)).toISOString();
    const prevFromDate = startOfDay(subDays(new Date(fromDate), currentDuration)).toISOString();

    const fetchCurrentLeads = async () => {
        // Usar tabla leads directamente para incluir leads sin campo desarrollo
        let query = supabase.from("leads").select("*", { count: "exact" });
        query = applyFilters(query, filters, fromDate, toDate);
        const rawData = await fetchAll(query);
        // Derivar desarrollo del pipeline_name cuando no está asignado
        const data = rawData.map(deriveDesarrollo);
        return { data, count: data.length };
    };

    const fetchPreviousLeads = async () => {
        let query = supabase.from("leads").select("*", { count: "exact", head: true });
        query = applyFilters(query, filters, prevFromDate, prevToDate);
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
    };

    const fetchUserPerformance = async () => {
        let query = supabase.from("user_performance").select("*");
        if (filters.desarrollo && filters.desarrollo !== "all") {
            query = query.ilike("desarrollo", `%${filters.desarrollo.replace(" V2", "")}%`);
        }
        if (filters.asesor && filters.asesor !== "all") {
            query = query.eq("user_name", filters.asesor);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    };

    const fetchMarketingMetrics = async () => {
        let query = supabase.from("meta_daily_metrics").select("*");
        query = query.gte("date", fromDate.split('T')[0]).lte("date", toDate.split('T')[0]);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    };

    const fetchRemarketingStats = async () => {
        let query = supabase.from("looker_remarketing_stats").select("*");
        if (filters.asesor && filters.asesor !== "all") {
            query = query.eq("responsible_user_name", filters.asesor);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    };

    const calculateFunnelFromData = (data: any[]) => {
        const stats = {
            total_leads: data.length,
            total_citas: data.filter(l => l.is_cita_agendada).length,
            total_visitas: data.filter(l => l.is_visitado).length,
            total_apartados: data.filter(l => l.status_name === 'Apartado Realizado' || l.status_name === 'Apartado').length,
            total_ventas: data.filter(l => l.closed_at && l.status_id === 142).length  // 142 = Ganado/Firmado
        };
        return [{ ...stats, desarrollo: filters.desarrollo || 'Global' }];
    };

    // IDs de custom fields para checkboxes
    const CITA_AGENDADA_FIELD_ID = 2093478;
    const VISITADO_FIELD_ID = 2093480;

    // Consulta para citas agendadas basada en EVENTOS de cambio de checkbox
    // Esto replica la lógica de Kommo UI: contar leads donde el checkbox CAMBIÓ en el período
    const fetchAppointments = async () => {
        try {
            // Buscar eventos de cambio del checkbox "Cita Agendada" en el rango de fechas
            const { data: events, error: eventsError } = await supabase
                .from("events")
                .select("lead_id")
                .eq("event_type", `custom_field_${CITA_AGENDADA_FIELD_ID}_value_changed`)
                .gte("created_at", fromDate)
                .lte("created_at", toDate);

            if (eventsError) {
                console.error("Error fetching cita events:", eventsError);
                return 0;
            }

            if (!events || events.length === 0) {
                return 0;
            }

            // Obtener lead_ids únicos
            const leadIds = [...new Set(events.map((e: any) => e.lead_id))];

            // Contar leads que tienen el checkbox actualmente marcado Y están en los pipelines correctos
            let query = supabase
                .from("leads")
                .select("id", { count: "exact", head: true })
                .in("id", leadIds)
                .eq("is_cita_agendada", true);

            // Aplicar filtros de pipeline
            if (filters.tab === "remarketing") {
                query = query.ilike("pipeline_name", "%RMKT%");
            } else {
                query = query.in("pipeline_id", MAIN_PIPELINES);
            }

            // Aplicar filtro de desarrollo
            if (filters.desarrollo && filters.desarrollo !== "all") {
                const d = filters.desarrollo.replace(" V2", "");
                if (d.toLowerCase().includes("paraiso") || d.toLowerCase().includes("paraíso")) {
                    query = query.or(`desarrollo.ilike.%Paraiso%,pipeline_name.ilike.%Paraiso%,desarrollo.ilike.%Paraíso%,pipeline_name.ilike.%Paraíso%`);
                } else {
                    query = query.or(`desarrollo.ilike.%${d}%,pipeline_name.ilike.%${d}%`);
                }
            }

            // Aplicar filtro de asesor
            if (filters.asesor && filters.asesor !== "all") {
                query = query.eq("responsible_user_name", filters.asesor);
            }

            const { count, error } = await query;
            if (error) {
                console.error("Error counting appointments:", error);
                return 0;
            }
            return count || 0;
        } catch (err) {
            console.error("Error in fetchAppointments:", err);
            return 0;
        }
    };

    // Consulta para visitados basada en EVENTOS de cambio de checkbox
    const fetchVisited = async () => {
        try {
            // Buscar eventos de cambio del checkbox "Visitado" en el rango de fechas
            const { data: events, error: eventsError } = await supabase
                .from("events")
                .select("lead_id")
                .eq("event_type", `custom_field_${VISITADO_FIELD_ID}_value_changed`)
                .gte("created_at", fromDate)
                .lte("created_at", toDate);

            if (eventsError) {
                console.error("Error fetching visitado events:", eventsError);
                return 0;
            }

            if (!events || events.length === 0) {
                return 0;
            }

            // Obtener lead_ids únicos
            const leadIds = [...new Set(events.map((e: any) => e.lead_id))];

            // Contar leads que tienen el checkbox actualmente marcado Y están en los pipelines correctos
            let query = supabase
                .from("leads")
                .select("id", { count: "exact", head: true })
                .in("id", leadIds)
                .eq("is_visitado", true);

            // Aplicar filtros de pipeline
            if (filters.tab === "remarketing") {
                query = query.ilike("pipeline_name", "%RMKT%");
            } else {
                query = query.in("pipeline_id", MAIN_PIPELINES);
            }

            // Aplicar filtro de desarrollo
            if (filters.desarrollo && filters.desarrollo !== "all") {
                const d = filters.desarrollo.replace(" V2", "");
                if (d.toLowerCase().includes("paraiso") || d.toLowerCase().includes("paraíso")) {
                    query = query.or(`desarrollo.ilike.%Paraiso%,pipeline_name.ilike.%Paraiso%,desarrollo.ilike.%Paraíso%,pipeline_name.ilike.%Paraíso%`);
                } else {
                    query = query.or(`desarrollo.ilike.%${d}%,pipeline_name.ilike.%${d}%`);
                }
            }

            // Aplicar filtro de asesor
            if (filters.asesor && filters.asesor !== "all") {
                query = query.eq("responsible_user_name", filters.asesor);
            }

            const { count, error } = await query;
            if (error) {
                console.error("Error counting visited:", error);
                return 0;
            }
            return count || 0;
        } catch (err) {
            console.error("Error in fetchVisited:", err);
            return 0;
        }
    };

    const fetchKommoSources = async () => {
        const { data, error } = await supabase
            .from("kommo_sources")
            .select("source_id, source_name, source_type");
        if (error) {
            console.error("Error fetching kommo sources:", error);
            return [];
        }
        return data || [];
    };

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from("users")
            .select("id, name");
        if (error) {
            console.error("Error fetching users:", error);
            return [];
        }
        return data || [];
    };

    const [current, prevCount, performance, marketing, rmkt, appointmentsCount, visitedCount, kommoSources, usersData] = await Promise.all([
        fetchCurrentLeads(),
        fetchPreviousLeads(),
        fetchUserPerformance(),
        fetchMarketingMetrics(),
        fetchRemarketingStats(),
        fetchAppointments(),
        fetchVisited(),
        fetchKommoSources(),
        fetchUsers()
    ]);

    const funnel = calculateFunnelFromData(current.data || []);
    const totalLeads = current.count;
    const totalAmount = current.data?.reduce((acc, current) => acc + (current.price || 0), 0) || 0;

    // Consulta separada para ventas cerradas DURANTE el periodo (por closed_at, no created_at)
    // Usamos status_id para identificar:
    // - 142 = Ganado/Firmado (venta exitosa)
    // - 143 = Ventas Perdidos/VENTA PERDIDA (venta perdida)
    const fetchClosedLeadsInPeriod = async () => {
        // Ventas ganadas: cerradas en el periodo y no perdidas (status_id = 142 es "Ganado/Firmado")
        let queryGanadas = supabase
            .from("leads")
            .select("id, name, desarrollo, pipeline_name, price, closed_at, status_name, status_id")
            .not("closed_at", "is", null)
            .gte("closed_at", fromDate)
            .lte("closed_at", toDate)
            .eq("status_id", 142);  // 142 = Ganado/Firmado

        // Aplicar filtros de pipeline (excluye Portal San Pedro automáticamente)
        if (filters.tab === "remarketing") {
            queryGanadas = queryGanadas.ilike("pipeline_name", "%RMKT%");
        } else {
            queryGanadas = queryGanadas.in("pipeline_id", MAIN_PIPELINES);
        }

        // Aplicar filtro de desarrollo
        if (filters.desarrollo && filters.desarrollo !== "all") {
            const d = filters.desarrollo.replace(" V2", "");
            if (d.toLowerCase().includes("paraiso") || d.toLowerCase().includes("paraíso")) {
                queryGanadas = queryGanadas.or(`desarrollo.ilike.%Paraiso%,pipeline_name.ilike.%Paraiso%,desarrollo.ilike.%Paraíso%,pipeline_name.ilike.%Paraíso%`);
            } else {
                queryGanadas = queryGanadas.or(`desarrollo.ilike.%${d}%,pipeline_name.ilike.%${d}%`);
            }
        }

        if (filters.asesor && filters.asesor !== "all") {
            queryGanadas = queryGanadas.eq("responsible_user_name", filters.asesor);
        }

        const ganadasData = await fetchAll(queryGanadas);
        const ganadas = ganadasData.map(deriveDesarrollo);

        // Ventas perdidas: cerradas en el periodo con status_id = 143 (Perdido)
        let queryPerdidas = supabase
            .from("leads")
            .select("id, name, desarrollo, pipeline_name, price, closed_at, status_name, status_id")
            .not("closed_at", "is", null)
            .gte("closed_at", fromDate)
            .lte("closed_at", toDate)
            .eq("status_id", 143);  // 143 = Ventas Perdidos/VENTA PERDIDA

        if (filters.tab === "remarketing") {
            queryPerdidas = queryPerdidas.ilike("pipeline_name", "%RMKT%");
        } else {
            queryPerdidas = queryPerdidas.in("pipeline_id", MAIN_PIPELINES);
        }

        if (filters.desarrollo && filters.desarrollo !== "all") {
            const d = filters.desarrollo.replace(" V2", "");
            if (d.toLowerCase().includes("paraiso") || d.toLowerCase().includes("paraíso")) {
                queryPerdidas = queryPerdidas.or(`desarrollo.ilike.%Paraiso%,pipeline_name.ilike.%Paraiso%,desarrollo.ilike.%Paraíso%,pipeline_name.ilike.%Paraíso%`);
            } else {
                queryPerdidas = queryPerdidas.or(`desarrollo.ilike.%${d}%,pipeline_name.ilike.%${d}%`);
            }
        }

        if (filters.asesor && filters.asesor !== "all") {
            queryPerdidas = queryPerdidas.eq("responsible_user_name", filters.asesor);
        }

        const perdidasData = await fetchAll(queryPerdidas);
        const perdidas = perdidasData.map(deriveDesarrollo);

        return { ganadas, perdidas };
    };

    const closedLeads = await fetchClosedLeadsInPeriod();
    const ventasGanadas = closedLeads.ganadas;
    const ventasPerdidas = closedLeads.perdidas;

    // Agrupar ventas ganadas por desarrollo (excluir Portal San Pedro)
    const ventasPorDesarrollo: Record<string, { count: number; monto: number; sinMonto: number }> = {};
    let totalSinMonto = 0;

    ventasGanadas.forEach((lead: any) => {
        const desarrollo = lead.desarrollo || 'Sin desarrollo';

        // Saltar si es Portal San Pedro
        if (desarrollo.toLowerCase().includes('portal') || desarrollo.toLowerCase().includes('san pedro v2')) {
            return;
        }

        if (!ventasPorDesarrollo[desarrollo]) {
            ventasPorDesarrollo[desarrollo] = { count: 0, monto: 0, sinMonto: 0 };
        }
        ventasPorDesarrollo[desarrollo].count++;
        if (lead.price && lead.price > 0) {
            ventasPorDesarrollo[desarrollo].monto += lead.price;
        } else {
            ventasPorDesarrollo[desarrollo].sinMonto++;
            totalSinMonto++;
        }
    });

    const salesSummary = {
        totalGanadas: ventasGanadas.length,
        totalPerdidas: ventasPerdidas.length,
        montoGanadas: ventasGanadas.reduce((sum: number, l: any) => sum + (l.price || 0), 0),
        montoPerdidas: ventasPerdidas.reduce((sum: number, l: any) => sum + (l.price || 0), 0),
        porDesarrollo: ventasPorDesarrollo,
        sinMonto: totalSinMonto
    };

    // Conteo de walk-ins (fuente = "Casa Muestra")
    const walkInLeads = current.data?.filter(lead => {
        const fuente = (lead.fuente || "").toLowerCase();
        return fuente === "casa muestra" || fuente === "casa_muestra";
    }).length || 0;

    // Conteo de leads calificados (status_name = "QL")
    const qualifiedLeads = current.data?.filter(lead => {
        const status = (lead.status_name || "").toUpperCase();
        return status === "QL" || status.includes("CALIFICADO");
    }).length || 0;

    // Leads no calificados (total - calificados)
    const nonQualifiedLeads = totalLeads - qualifiedLeads;

    const calculateTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? "+100%" : "0%";
        const diff = ((curr - prev) / prev) * 100;
        return `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`;
    };

    const trends = {
        leads: { value: calculateTrend(totalLeads, prevCount), positive: totalLeads >= prevCount },
        appointments: { value: "N/A", positive: true },
        amount: { value: "N/A", positive: true },
        responseTime: { value: "N/A", positive: true }
    };

    // Prepare charts data - Distribución por canal
    // sourcesData: agrupado por source_type (para Dirección)
    // sourcesDetailData: detallado por source_name individual (para Marketing)
    const kommoSourcesMap: Record<number, { name: string | null; type: string | null }> = {};
    (kommoSources || []).forEach((s: any) => {
        kommoSourcesMap[s.source_id] = {
            name: s.source_name,
            type: s.source_type
        };
    });

    // Mapa de usuarios para detectar "Creado por un Asesor"
    const usersMap: Record<number, string> = {};
    (usersData || []).forEach((u: any) => {
        usersMap[u.id] = u.name;
    });

    // Datos AGRUPADOS por tipo (para Dirección)
    const sourcesGroupedMap = current.data?.reduce((acc: any, curr) => {
        let source: string;

        if (curr.source_id && kommoSourcesMap[curr.source_id]) {
            const mapped = kommoSourcesMap[curr.source_id];
            // Si tiene tipo, usarlo. Si no, mostrar nombre o ID
            source = mapped.type || mapped.name || `Fuente #${curr.source_id} (sin tipo)`;
        } else if (curr.source_id) {
            // source_id existe pero no está en kommo_sources
            source = `Fuente #${curr.source_id} (sin tipo)`;
        } else if (curr.fuente) {
            // Usa el campo fuente del lead
            source = curr.fuente;
        } else if (curr.created_by && usersMap[curr.created_by]) {
            // Lead creado manualmente por un asesor
            source = "Creado por un Asesor";
        } else {
            // Lead sin source_id, sin fuente y sin created_by conocido
            source = "Sin fuente identificada";
        }

        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    const sourcesData = Object.entries(sourcesGroupedMap || {}).map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value);

    // Datos DETALLADOS por nombre individual (para Marketing)
    const sourcesDetailMap = current.data?.reduce((acc: any, curr) => {
        let source: string;
        let type: string;

        if (curr.source_id && kommoSourcesMap[curr.source_id]) {
            const mapped = kommoSourcesMap[curr.source_id];
            source = mapped.name || `Fuente #${curr.source_id}`;
            type = mapped.type || `Fuente #${curr.source_id} (sin tipo)`;
        } else if (curr.source_id) {
            source = `Fuente #${curr.source_id}`;
            type = `Fuente #${curr.source_id} (sin tipo)`;
        } else if (curr.fuente) {
            source = curr.fuente;
            type = curr.fuente;
        } else if (curr.created_by && usersMap[curr.created_by]) {
            // Lead creado manualmente por un asesor - mostrar nombre del asesor
            source = usersMap[curr.created_by];
            type = "Creado por un Asesor";
        } else {
            source = `Lead ID: ${curr.id}`;
            type = "Sin fuente identificada";
        }

        if (!acc[type]) acc[type] = {};
        acc[type][source] = (acc[type][source] || 0) + 1;
        return acc;
    }, {});

    // Convertir a formato para el chart de Marketing (agrupado por tipo, con detalle)
    const sourcesDetailData = Object.entries(sourcesDetailMap || {}).map(([type, sources]: [string, any]) => ({
        type,
        sources: Object.entries(sources).map(([name, value]) => ({ name, value }))
            .sort((a: any, b: any) => b.value - a.value),
        total: Object.values(sources).reduce((sum: number, v: any) => sum + v, 0)
    })).sort((a, b) => b.total - a.total);

    const dailyLeadsMap = current.data?.reduce((acc: any, curr) => {
        const dateObj = new Date(curr.created_at);
        const label = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});
    const dailyLeadsData = Object.entries(dailyLeadsMap || {}).map(([date, count]) => ({ date, count }));

    // ============================================================================
    // DATOS ESPECÍFICOS POR TAB (10 KPIs)
    // ============================================================================
    let extraData: any = {};

    // KPI #1: Avance vs Meta (Vista Dirección)
    if (filters.tab === "direccion" || !filters.tab) {
        try {
            const avanceMeta = await getAvanceVsMeta({ desarrollo: filters.desarrollo });
            extraData.avanceVsMeta = avanceMeta;
        } catch (error) {
            console.error("Error fetching avance vs meta:", error);
            extraData.avanceVsMeta = [];
        }
    }

    // KPI #2, #3, #5: Gastos de marketing (Vista Marketing)
    if (filters.tab === "marketing") {
        try {
            const marketingSpend = await getMarketingSpend({
                dateRange: filters.dateRange
            });
            const leadsByChannel = await getLeadsByChannel({
                dateRange: filters.dateRange,
                desarrollo: filters.desarrollo
            });
            extraData.marketingSpend = marketingSpend;
            extraData.leadsByChannel = leadsByChannel;
        } catch (error) {
            console.error("Error fetching marketing data:", error);
            extraData.marketingSpend = [];
            extraData.leadsByChannel = [];
        }
    }

    // KPI #6, #7, #8, #9: Rendimiento de asesores (Vista Ventas)
    if (filters.tab === "ventas") {
        try {
            const advisorPerformance = await getAdvisorPerformance({
                dateRange: filters.dateRange,
                desarrollo: filters.desarrollo,
                asesor: filters.asesor
            });
            const walkIns = await getWalkIns({
                desarrollo: filters.desarrollo,
                asesor: filters.asesor
            });
            extraData.advisorPerformanceDetailed = advisorPerformance;
            extraData.walkIns = walkIns;
        } catch (error) {
            console.error("Error fetching ventas data:", error);
            extraData.advisorPerformanceDetailed = [];
            extraData.walkIns = [];
        }
    }

    // KPI #4: Métricas de remarketing (Vista Remarketing)
    if (filters.tab === "remarketing") {
        try {
            const remarketingMetrics = await getRemarketingMetrics({
                asesor: filters.asesor
            });
            extraData.remarketingMetrics = remarketingMetrics;
        } catch (error) {
            console.error("Error fetching remarketing metrics:", error);
            extraData.remarketingMetrics = [];
        }
    }

    // Presupuesto de campaña de muestra por desarrollo (datos simulados hasta integrar Meta API)
    const budgetByDesarrollo = {
        "Bosques de Cholul": 45000,
        "Cumbres de San Pedro": 38000,
        "Paraíso Caucel": 52000,
        "total": 135000
    };

    return {
        summary: {
            newLeads: totalLeads,
            totalAmount,
            appointmentsCount,
            visitedCount,
            walkInLeads,
            qualifiedLeads,
            nonQualifiedLeads,
            budgetByDesarrollo,
            trends,
            salesSummary
        },
        funnel,
        performance,
        marketing,
        remarketing: rmkt,
        sourcesData,
        sourcesDetailData,
        dailyLeadsData,
        rawData: current.data,
        ...extraData // Añadir datos específicos según el tab
    };
}

function applyFilters(query: any, filters: any, start: string, end: string) {
    // Filtrar por fecha de creación del lead
    query = query.gte("created_at", start).lte("created_at", end);

    // Nota: Portal San Pedro se excluye automáticamente porque su pipeline (12535228)
    // no está en MAIN_PIPELINES

    if (filters.tab === "remarketing") {
        query = query.ilike("pipeline_name", "%RMKT%");
    } else if (filters.tab === "ventas" || filters.tab === "direccion") {
        query = query.in("pipeline_id", MAIN_PIPELINES);
    }

    if (filters.desarrollo && filters.desarrollo !== "all") {
        const d = filters.desarrollo.replace(" V2", "");
        if (d.toLowerCase().includes("paraiso") || d.toLowerCase().includes("paraíso")) {
            query = query.or(`desarrollo.ilike.%Paraiso%,pipeline_name.ilike.%Paraiso%,desarrollo.ilike.%Paraíso%,pipeline_name.ilike.%Paraíso%`);
        } else {
            query = query.or(`desarrollo.ilike.%${d}%,pipeline_name.ilike.%${d}%`);
        }
    }

    if (filters.asesor && filters.asesor !== "all") {
        query = query.eq("responsible_user_name", filters.asesor);
    }

    return query;
}

export async function getFilterOptions() {
    // Obtener asesores desde la tabla users (sincronizada desde Kommo)
    // La tabla users contiene el campo 'desarrollo' que indica a qué equipo pertenece cada asesor
    // Intentamos con desarrollo primero, si no existe la columna, hacemos fallback
    let usersData: any[] = [];

    const { data, error: usersError } = await supabase
        .from("users")
        .select("name, email, desarrollo, is_active")
        .eq("is_active", true);

    if (usersError) {
        // Si la columna desarrollo no existe, hacer query sin ella
        if (usersError.code === '42703') {
            // Column doesn't exist, try fallback
            const { data: fallbackData, error: fallbackError } = await supabase
                .from("users")
                .select("name, email, is_active")
                .eq("is_active", true);

            if (fallbackError) {
                console.error("Error fetching users (fallback):", fallbackError);
            } else {
                usersData = fallbackData || [];
            }
        } else {
            console.error("Error fetching users:", usersError);
        }
    } else {
        usersData = data || [];
    }

    // Solo los 3 desarrollos activos (Portal San Pedro es futuro)
    const desarrollos = [
        "Bosques de Cholul",
        "Cumbres de San Pedro",
        "Paraíso Caucel"
    ];

    const admins = ['Israel Domínguez', 'EMILIO GUZMAN', 'Martha Quijano', 'Carlos Garrido', 'MARKETING'];

    // Crear mapeo de asesores por desarrollo desde la tabla users
    const asesoresPorDesarrollo: { [desarrollo: string]: Set<string> } = {
        "Bosques de Cholul": new Set<string>(),
        "Cumbres de San Pedro": new Set<string>(),
        "Paraíso Caucel": new Set<string>()
    };

    let asesoresSet = new Set<string>();

    // Procesar usuarios de la tabla users
    (usersData || []).forEach((user: any) => {
        if (user.name && !admins.includes(user.name)) {
            asesoresSet.add(user.name);

            // Usar el campo desarrollo directamente si existe
            if (user.desarrollo && asesoresPorDesarrollo[user.desarrollo]) {
                asesoresPorDesarrollo[user.desarrollo].add(user.name);
            }
        }
    });

    // Si no hay usuarios en la tabla o el campo desarrollo está vacío,
    // usar el mapeo por email como fallback
    const EMAIL_TO_DESARROLLO: { [email: string]: string } = {
        // Bosques de Cholul
        'a.lopez@grupoprovi.mx': 'Bosques de Cholul',
        'e.flota@grupoprovi.mx': 'Bosques de Cholul',
        'j.estrada@grupoprovi.mx': 'Bosques de Cholul',
        // Cumbres de San Pedro
        'm.vivas@grupoprovi.mx': 'Cumbres de San Pedro',
        'j.zapata@grupoprovi.mx': 'Cumbres de San Pedro',
        'r.cortes@grupoprovi.mx': 'Cumbres de San Pedro',
        // Paraíso Caucel
        'l.lopez@grupoprovi.mx': 'Paraíso Caucel',
        'g.varela@grupoprovi.mx': 'Paraíso Caucel',
        'z.martin@grupoprovi.mx': 'Paraíso Caucel',
    };

    // Aplicar fallback por email si no hay desarrollo asignado
    (usersData || []).forEach((user: any) => {
        if (user.name && !admins.includes(user.name) && user.email) {
            const email = user.email.toLowerCase();
            const desarrolloFromEmail = EMAIL_TO_DESARROLLO[email];

            if (desarrolloFromEmail && asesoresPorDesarrollo[desarrolloFromEmail]) {
                // Solo agregar si no está ya asignado por el campo desarrollo
                asesoresPorDesarrollo[desarrolloFromEmail].add(user.name);
            }
        }
    });

    let asesores = Array.from(asesoresSet).sort() as string[];

    // Ensure 'Por asignar' is in the list and at the top
    if (!asesores.includes('Por asignar')) {
        asesores = ['Por asignar', ...asesores];
    } else {
        asesores = ['Por asignar', ...asesores.filter(a => a !== 'Por asignar')];
    }

    // Convertir Sets a Arrays para el mapeo por desarrollo
    const asesoresByDesarrollo: { [desarrollo: string]: string[] } = {};
    for (const [dev, set] of Object.entries(asesoresPorDesarrollo)) {
        const sorted = Array.from(set).sort();
        // Añadir "Por asignar" a cada desarrollo
        asesoresByDesarrollo[dev] = ['Por asignar', ...sorted];
    }

    return {
        desarrollos,
        asesores,
        asesoresByDesarrollo,
    };
}

// ============================================================================
// FUNCIONES PARA LOS 10 KPIs ESPECÍFICOS
// ============================================================================

/**
 * KPI #1: Avance mensual vs meta de ventas
 * Retorna el progreso actual vs las metas configuradas
 */
export async function getAvanceVsMeta(filters: {
    mes?: number;
    anio?: number;
    desarrollo?: string;
}) {
    const mes = filters.mes || new Date().getMonth() + 1;
    const anio = filters.anio || new Date().getFullYear();

    let query = supabase
        .from("avance_vs_meta")
        .select("*")
        .eq("mes", mes)
        .eq("anio", anio);

    if (filters.desarrollo && filters.desarrollo !== "all") {
        const d = filters.desarrollo.replace(" V2", "");
        query = query.ilike("desarrollo", `%${d}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/**
 * KPI #2 y #5: Gasto por día/campaña/canal y leads por canal
 * Unifica Meta Ads + otros canales (Google, TikTok, etc.)
 */
export async function getMarketingSpend(filters: {
    dateRange?: { from: string; to: string };
    canal?: string;
}) {
    const fromDate = filters.dateRange?.from || startOfDay(subDays(new Date(), 30)).toISOString();
    const toDate = filters.dateRange?.to || endOfDay(new Date()).toISOString();

    let query = supabase
        .from("unified_marketing_data")
        .select("*")
        .gte("fecha", fromDate.split('T')[0])
        .lte("fecha", toDate.split('T')[0]);

    if (filters.canal && filters.canal !== "all") {
        query = query.eq("canal", filters.canal);
    }

    const { data, error } = await query.order("fecha", { ascending: false });
    if (error) throw error;

    // Calcular CPL (Costo por Lead)
    const dataWithCPL = (data || []).map((row: any) => ({
        ...row,
        cpl: row.leads_generados > 0 ? (row.gasto / row.leads_generados).toFixed(2) : "0.00"
    }));

    return dataWithCPL;
}

/**
 * KPI #3 y #5: Leads generados por canal de adquisición
 */
export async function getLeadsByChannel(filters: {
    dateRange?: { from: string; to: string };
    desarrollo?: string;
}) {
    const fromDate = filters.dateRange?.from || startOfDay(subDays(new Date(), 30)).toISOString();
    const toDate = filters.dateRange?.to || endOfDay(new Date()).toISOString();

    // 1. Obtener kommo_sources para mapear source_id a tipo
    const { data: kommoSources } = await supabase
        .from("kommo_sources")
        .select("source_id, source_name, source_type");

    const kommoSourcesMap: Record<number, { name: string | null; type: string | null }> = {};
    (kommoSources || []).forEach((s: any) => {
        kommoSourcesMap[s.source_id] = {
            name: s.source_name,
            type: s.source_type
        };
    });

    // 1b. Obtener usuarios para mapear created_by a nombre
    const { data: usersData } = await supabase
        .from("users")
        .select("id, name");

    const usersMap: Record<number, string> = {};
    (usersData || []).forEach((u: any) => {
        usersMap[u.id] = u.name;
    });

    // 2. Obtener leads con source_id y created_by
    let query = supabase
        .from("leads")
        .select("source_id, created_by, fuente, desarrollo, pipeline_name, id, is_cita_agendada, status_name, price")
        .gte("created_at", fromDate)
        .lte("created_at", toDate)
        .in("pipeline_id", MAIN_PIPELINES);

    // Filtrar por desarrollo usando pipeline_name cuando desarrollo está vacío
    if (filters.desarrollo && filters.desarrollo !== "all") {
        const d = filters.desarrollo.replace(" V2", "");
        query = query.or(`desarrollo.ilike.%${d}%,pipeline_name.ilike.%${d}%`);
    }

    const rawData = await fetchAll(query);
    const data = rawData.map(deriveDesarrollo);

    // 3. Agrupar por tipo y luego por canal
    const byTypeAndChannel: Record<string, Record<string, any>> = {};

    data.forEach(lead => {
        let tipo: string;
        let canal: string;

        if (lead.source_id && kommoSourcesMap[lead.source_id]) {
            const mapped = kommoSourcesMap[lead.source_id];
            tipo = mapped.type || "Sin tipo asignado";
            canal = mapped.name || `Fuente #${lead.source_id}`;
        } else if (lead.source_id) {
            // source_id existe pero no está en kommo_sources
            tipo = "Sin tipo asignado";
            canal = `Fuente #${lead.source_id}`;
        } else if (lead.fuente) {
            tipo = lead.fuente;
            canal = lead.fuente;
        } else if (lead.created_by && usersMap[lead.created_by]) {
            // Lead creado manualmente por un asesor
            tipo = "Creado por un Asesor";
            canal = usersMap[lead.created_by];
        } else {
            // Lead sin source_id, sin fuente y sin created_by conocido
            tipo = "Sin fuente identificada";
            canal = "Sin fuente identificada";
        }

        if (!byTypeAndChannel[tipo]) {
            byTypeAndChannel[tipo] = {};
        }

        if (!byTypeAndChannel[tipo][canal]) {
            byTypeAndChannel[tipo][canal] = {
                canal,
                total_leads: 0,
                citas: 0,
                apartados: 0,
                monto_proyectado: 0,  // Suma de todos los leads con precio
                monto_apartados: 0     // Solo apartados
            };
        }

        byTypeAndChannel[tipo][canal].total_leads++;
        byTypeAndChannel[tipo][canal].monto_proyectado += lead.price || 0;  // Sumar precio de todos
        if (lead.is_cita_agendada) byTypeAndChannel[tipo][canal].citas++;
        if (lead.status_name === "Apartado Realizado" || lead.status_name === "Apartado") {
            byTypeAndChannel[tipo][canal].apartados++;
            byTypeAndChannel[tipo][canal].monto_apartados += lead.price || 0;
        }
    });

    // 4. Convertir a estructura plana para compatibilidad + estructura agrupada
    const flatResult: any[] = [];
    const groupedResult: any[] = [];

    Object.entries(byTypeAndChannel).forEach(([tipo, canales]) => {
        const canalArray = Object.values(canales).sort((a: any, b: any) => b.total_leads - a.total_leads);

        // Calcular totales del tipo
        const tipoTotals = canalArray.reduce((acc: any, c: any) => ({
            total_leads: acc.total_leads + c.total_leads,
            citas: acc.citas + c.citas,
            apartados: acc.apartados + c.apartados,
            monto_proyectado: acc.monto_proyectado + c.monto_proyectado,
            monto_apartados: acc.monto_apartados + c.monto_apartados
        }), { total_leads: 0, citas: 0, apartados: 0, monto_proyectado: 0, monto_apartados: 0 });

        groupedResult.push({
            tipo,
            ...tipoTotals,
            canales: canalArray
        });

        // También agregar al resultado plano para compatibilidad
        canalArray.forEach((c: any) => {
            flatResult.push({ ...c, tipo });
        });
    });

    // Ordenar grupos por total de leads
    groupedResult.sort((a, b) => b.total_leads - a.total_leads);

    return {
        flat: flatResult.sort((a, b) => b.total_leads - a.total_leads),
        grouped: groupedResult
    };
}

/**
 * KPI #4: Métricas de remarketing
 */
export async function getRemarketingMetrics(filters: {
    asesor?: string;
}) {
    let query = supabase.from("looker_remarketing_stats").select("*");

    if (filters.asesor && filters.asesor !== "all") {
        query = query.eq("responsible_user_name", filters.asesor);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calcular tasa de recuperación
    const dataWithRates = (data || []).map((row: any) => ({
        ...row,
        tasa_recuperacion: row.leads_en_rmkt > 0
            ? ((row.citas_recuperadas / row.leads_en_rmkt) * 100).toFixed(2)
            : "0.00"
    }));

    return dataWithRates;
}

/**
 * KPI #6, #7, #8, #9: Rendimiento de asesores por ETAPAS del pipeline
 * Muestra NÚMEROS ACTUALES - inventario actual de leads por asesor y etapa
 * Agrupa por desarrollo basándose en la tabla users (equipo del asesor)
 * Usa status_id para identificar las etapas (ya que status_name puede estar como "Desconocido")
 */
export async function getAdvisorPerformance(filters: {
    dateRange?: { from: string; to: string };
    desarrollo?: string;
    asesor?: string;
}) {
    // Mapeo de emails a desarrollos (equipos de ventas)
    const EMAIL_TO_DESARROLLO: { [email: string]: string } = {
        // Bosques de Cholul
        'a.lopez@grupoprovi.mx': 'Bosques de Cholul',
        'e.flota@grupoprovi.mx': 'Bosques de Cholul',
        'j.estrada@grupoprovi.mx': 'Bosques de Cholul',
        // Cumbres de San Pedro
        'm.vivas@grupoprovi.mx': 'Cumbres de San Pedro',
        'j.zapata@grupoprovi.mx': 'Cumbres de San Pedro',
        'r.cortes@grupoprovi.mx': 'Cumbres de San Pedro',
        // Paraíso Caucel
        'l.lopez@grupoprovi.mx': 'Paraíso Caucel',
        'g.varela@grupoprovi.mx': 'Paraíso Caucel',
        'z.martin@grupoprovi.mx': 'Paraíso Caucel',
    };

    // IDs de las etapas por pipeline (obtenidos de pipeline_statuses)
    // PARAISO CAUCEL V2 (12290640), CUMBRES DE SAN PEDRO V2 (12535008), BOSQUES DE CHOLUL V2 (12535020)
    const ETAPA_IDS = {
        para_seguimiento_manual: [96360112, 96820676, 97024316],
        en_seguimiento_manual: [96579384, 96820680, 97024320],
        cita_agendada: [95364568, 96820684, 97024324],
        cancelacion_no_show: [95364572, 96820688, 97024328],
        negociacion_activa: [95364580, 96820692, 97024332],
        apartado_realizado: [95538088, 96820696, 97024336],
        cliente_futuro: [98428743, 98428719, 98428767],
    };

    // 1. Obtener usuarios con su desarrollo desde la tabla users
    const { data: usersData } = await supabase
        .from("users")
        .select("name, email, desarrollo, is_active")
        .eq("is_active", true);

    // Crear mapeo de nombre de asesor a desarrollo
    const asesorToDesarrollo: { [name: string]: string } = {};
    (usersData || []).forEach((user: any) => {
        if (user.name) {
            // Prioridad: campo desarrollo de BD, luego email
            const desarrolloFromDB = user.desarrollo;
            const desarrolloFromEmail = user.email ? EMAIL_TO_DESARROLLO[user.email.toLowerCase()] : null;
            const desarrollo = desarrolloFromDB || desarrolloFromEmail;
            if (desarrollo) {
                asesorToDesarrollo[user.name] = desarrollo;
            }
        }
    });

    // 2. Obtener todos los leads ACTIVOS de los pipelines principales
    let leadsQuery = supabase
        .from("leads")
        .select("id, responsible_user_name, pipeline_name, status_id")
        .in("pipeline_id", MAIN_PIPELINES)
        .is("closed_at", null); // Solo leads activos (no cerrados)

    if (filters.asesor && filters.asesor !== "all") {
        leadsQuery = leadsQuery.eq("responsible_user_name", filters.asesor);
    }

    const leadsData = await fetchAll(leadsQuery);

    // 2b. Obtener leads cerrados (ganados y perdidos) para el periodo si hay fechas
    let closedLeadsData: any[] = [];
    if (filters.dateRange?.from && filters.dateRange?.to) {
        let closedQuery = supabase
            .from("leads")
            .select("id, responsible_user_name, pipeline_name, status_name, closed_at, price")
            .in("pipeline_id", MAIN_PIPELINES)
            .not("closed_at", "is", null)
            .gte("closed_at", filters.dateRange.from)
            .lte("closed_at", filters.dateRange.to);

        if (filters.asesor && filters.asesor !== "all") {
            closedQuery = closedQuery.eq("responsible_user_name", filters.asesor);
        }

        closedLeadsData = await fetchAll(closedQuery);
    }

    // 3. Agrupar por asesor y contar por etapa
    const performanceMap: { [key: string]: any } = {};

    leadsData.forEach(lead => {
        const asesor = lead.responsible_user_name || "Sin asignar";
        // Usar el desarrollo del equipo del asesor (desde tabla users)
        const desarrollo = asesorToDesarrollo[asesor] || "Sin equipo";

        // Aplicar filtro de desarrollo si está activo
        if (filters.desarrollo && filters.desarrollo !== "all") {
            if (desarrollo !== filters.desarrollo) {
                return; // Saltar este lead si no coincide con el filtro
            }
        }

        const key = `${asesor}|${desarrollo}`;

        if (!performanceMap[key]) {
            performanceMap[key] = {
                asesor,
                desarrollo,
                total_leads: 0,
                para_seguimiento_manual: 0,
                en_seguimiento_manual: 0,
                cita_agendada: 0,
                cancelacion_no_show: 0,
                negociacion_activa: 0,
                apartado_realizado: 0,
                cliente_futuro: 0,
                leads_ganados: 0,
                leads_perdidos: 0,
                monto_ganado: 0
            };
        }

        performanceMap[key].total_leads++;

        // Contar por etapa usando status_id
        const statusId = lead.status_id;

        if (ETAPA_IDS.para_seguimiento_manual.includes(statusId)) {
            performanceMap[key].para_seguimiento_manual++;
        } else if (ETAPA_IDS.en_seguimiento_manual.includes(statusId)) {
            performanceMap[key].en_seguimiento_manual++;
        } else if (ETAPA_IDS.cita_agendada.includes(statusId)) {
            performanceMap[key].cita_agendada++;
        } else if (ETAPA_IDS.cancelacion_no_show.includes(statusId)) {
            performanceMap[key].cancelacion_no_show++;
        } else if (ETAPA_IDS.negociacion_activa.includes(statusId)) {
            performanceMap[key].negociacion_activa++;
        } else if (ETAPA_IDS.apartado_realizado.includes(statusId)) {
            performanceMap[key].apartado_realizado++;
        } else if (ETAPA_IDS.cliente_futuro.includes(statusId)) {
            performanceMap[key].cliente_futuro++;
        }
        // Nota: Las etapas no listadas (como "Incoming leads", "Primer contacto", etc.)
        // se cuentan en total_leads pero no en ninguna etapa específica
    });

    // 3b. Agregar leads cerrados (ganados/perdidos) al performanceMap
    closedLeadsData.forEach(lead => {
        const asesor = lead.responsible_user_name || "Sin asignar";
        const desarrollo = asesorToDesarrollo[asesor] || "Sin equipo";

        // Aplicar filtro de desarrollo si está activo
        if (filters.desarrollo && filters.desarrollo !== "all") {
            if (desarrollo !== filters.desarrollo) {
                return;
            }
        }

        const key = `${asesor}|${desarrollo}`;

        if (!performanceMap[key]) {
            performanceMap[key] = {
                asesor,
                desarrollo,
                total_leads: 0,
                para_seguimiento_manual: 0,
                en_seguimiento_manual: 0,
                cita_agendada: 0,
                cancelacion_no_show: 0,
                negociacion_activa: 0,
                apartado_realizado: 0,
                cliente_futuro: 0,
                leads_ganados: 0,
                leads_perdidos: 0,
                monto_ganado: 0
            };
        }

        const isLost = lead.status_id === 143;  // 143 = Ventas Perdidos/VENTA PERDIDA
        if (isLost) {
            performanceMap[key].leads_perdidos++;
        } else {
            performanceMap[key].leads_ganados++;
            performanceMap[key].monto_ganado += lead.price || 0;
        }
    });

    // 4. Convertir a array y ordenar
    const result = Object.values(performanceMap).sort((a: any, b: any) => {
        // Ordenar por desarrollo, luego por asesor
        if (a.desarrollo !== b.desarrollo) {
            return a.desarrollo.localeCompare(b.desarrollo);
        }
        return a.asesor.localeCompare(b.asesor);
    });

    return result;
}

/**
 * KPI #10: Walk-ins por desarrollo y vendedor
 */
export async function getWalkIns(filters: {
    desarrollo?: string;
    asesor?: string;
}) {
    let query = supabase.from("walk_ins_stats").select("*");

    if (filters.desarrollo && filters.desarrollo !== "all") {
        const d = filters.desarrollo.replace(" V2", "");
        query = query.ilike("desarrollo", `%${d}%`);
    }

    if (filters.asesor && filters.asesor !== "all") {
        query = query.eq("vendedor", filters.asesor);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
}

/**
 * Obtener todos los canales disponibles
 */
export async function getAvailableChannels() {
    const { data, error } = await supabase
        .from("unified_marketing_data")
        .select("canal")
        .order("canal");

    if (error) throw error;

    const uniqueChannels = [...new Set((data || []).map((d: any) => d.canal))];
    return uniqueChannels;
}
