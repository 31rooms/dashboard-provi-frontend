import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null as any; // Fallback para tiempo de build

// IDs de los pipelines principales (V2)
const MAIN_PIPELINES = [12290640, 12535008, 12535020];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
        return NextResponse.json({ error: "Se requieren parámetros 'from' y 'to'" }, { status: 400 });
    }

    try {
        // 1. Verificar si existen los campos cita_agendada_at y visitado_at
        const { data: sampleLead, error: schemaError } = await supabase
            .from("leads")
            .select("id, cita_agendada_at, visitado_at")
            .limit(1);

        const fieldsExist = !schemaError;

        // 2. Total de leads con is_cita_agendada = true (SIN filtro de fecha)
        const { count: totalCitasGlobal } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("is_cita_agendada", true);

        // 3. Total de leads con is_cita_agendada = true EN MAIN_PIPELINES (SIN filtro de fecha)
        const { count: totalCitasMainPipelines } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("is_cita_agendada", true)
            .in("pipeline_id", MAIN_PIPELINES);

        // 4. Total con updated_at en rango Y is_cita_agendada = true Y MAIN_PIPELINES
        const { count: citasUpdatedAtRango } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("is_cita_agendada", true)
            .in("pipeline_id", MAIN_PIPELINES)
            .gte("updated_at", from)
            .lte("updated_at", to);

        // 5. Si existe cita_agendada_at, contar con ese campo
        let citasCitaAgendadaAtRango = null;
        let citasConTimestamp = null;
        if (fieldsExist) {
            const { count: countTimestamp } = await supabase
                .from("leads")
                .select("id", { count: "exact", head: true })
                .eq("is_cita_agendada", true)
                .not("cita_agendada_at", "is", null);
            citasConTimestamp = countTimestamp;

            const { count: countRango } = await supabase
                .from("leads")
                .select("id", { count: "exact", head: true })
                .eq("is_cita_agendada", true)
                .in("pipeline_id", MAIN_PIPELINES)
                .not("cita_agendada_at", "is", null)
                .gte("cita_agendada_at", from)
                .lte("cita_agendada_at", to);
            citasCitaAgendadaAtRango = countRango;
        }

        // 6. Desglose por desarrollo (usando updated_at)
        const { data: porDesarrollo } = await supabase
            .from("leads")
            .select("pipeline_name, desarrollo")
            .eq("is_cita_agendada", true)
            .in("pipeline_id", MAIN_PIPELINES)
            .gte("updated_at", from)
            .lte("updated_at", to);

        const desglosePorDesarrollo: Record<string, number> = {};
        (porDesarrollo || []).forEach((lead: any) => {
            const dev = lead.desarrollo || lead.pipeline_name || "Sin desarrollo";
            desglosePorDesarrollo[dev] = (desglosePorDesarrollo[dev] || 0) + 1;
        });

        // 7. Lo mismo para visitados
        const { count: totalVisitadosGlobal } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("is_visitado", true);

        const { count: totalVisitadosMainPipelines } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("is_visitado", true)
            .in("pipeline_id", MAIN_PIPELINES);

        const { count: visitadosUpdatedAtRango } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("is_visitado", true)
            .in("pipeline_id", MAIN_PIPELINES)
            .gte("updated_at", from)
            .lte("updated_at", to);

        let visitadosVisitadoAtRango = null;
        let visitadosConTimestamp = null;
        if (fieldsExist) {
            const { count: countTimestamp } = await supabase
                .from("leads")
                .select("id", { count: "exact", head: true })
                .eq("is_visitado", true)
                .not("visitado_at", "is", null);
            visitadosConTimestamp = countTimestamp;

            const { count: countRango } = await supabase
                .from("leads")
                .select("id", { count: "exact", head: true })
                .eq("is_visitado", true)
                .in("pipeline_id", MAIN_PIPELINES)
                .not("visitado_at", "is", null)
                .gte("visitado_at", from)
                .lte("visitado_at", to);
            visitadosVisitadoAtRango = countRango;
        }

        const { data: visitadosPorDesarrollo } = await supabase
            .from("leads")
            .select("pipeline_name, desarrollo")
            .eq("is_visitado", true)
            .in("pipeline_id", MAIN_PIPELINES)
            .gte("updated_at", from)
            .lte("updated_at", to);

        const desgloseVisitadosPorDesarrollo: Record<string, number> = {};
        (visitadosPorDesarrollo || []).forEach((lead: any) => {
            const dev = lead.desarrollo || lead.pipeline_name || "Sin desarrollo";
            desgloseVisitadosPorDesarrollo[dev] = (desgloseVisitadosPorDesarrollo[dev] || 0) + 1;
        });

        return NextResponse.json({
            parametros: { from, to },
            camposTimestampExisten: fieldsExist,
            mainPipelines: MAIN_PIPELINES,
            citasAgendadas: {
                totalGlobal: totalCitasGlobal,
                totalEnMainPipelines: totalCitasMainPipelines,
                conUpdatedAtEnRango: citasUpdatedAtRango,
                leadsConCitaAgendadaAtPoblado: citasConTimestamp,
                conCitaAgendadaAtEnRango: citasCitaAgendadaAtRango,
                desglosePorDesarrollo
            },
            visitados: {
                totalGlobal: totalVisitadosGlobal,
                totalEnMainPipelines: totalVisitadosMainPipelines,
                conUpdatedAtEnRango: visitadosUpdatedAtRango,
                leadsConVisitadoAtPoblado: visitadosConTimestamp,
                conVisitadoAtEnRango: visitadosVisitadoAtRango,
                desglosePorDesarrollo: desgloseVisitadosPorDesarrollo
            },
            nota: "Si 'leadsConCitaAgendadaAtPoblado' es 0 o null, significa que el script SQL de migración no se ha ejecutado."
        });
    } catch (error: any) {
        console.error("Debug stats error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
