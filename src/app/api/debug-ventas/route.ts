import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null as any;

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
        // 1. Ver todos los leads con closed_at en el rango
        const { data: leadsConClosedAt, error: err1 } = await supabase
            .from("leads")
            .select("id, name, desarrollo, pipeline_name, pipeline_id, status_id, status_name, closed_at, price")
            .in("pipeline_id", MAIN_PIPELINES)
            .not("closed_at", "is", null)
            .gte("closed_at", from)
            .lte("closed_at", to)
            .order("closed_at", { ascending: false });

        // 2. Ver todos los status_id distintos para leads cerrados
        const { data: statusDistintos } = await supabase
            .from("leads")
            .select("status_id, status_name")
            .in("pipeline_id", MAIN_PIPELINES)
            .not("closed_at", "is", null);

        const statusMap: Record<number, { name: string; count: number }> = {};
        (statusDistintos || []).forEach((l: any) => {
            if (!statusMap[l.status_id]) {
                statusMap[l.status_id] = { name: l.status_name, count: 0 };
            }
            statusMap[l.status_id].count++;
        });

        // 3. Contar leads con status_id = 142 (Ganado/Firmado)
        const { count: countGanados, data: leadsGanados } = await supabase
            .from("leads")
            .select("id, name, desarrollo, pipeline_name, pipeline_id, status_id, status_name, closed_at, price", { count: "exact" })
            .in("pipeline_id", MAIN_PIPELINES)
            .not("closed_at", "is", null)
            .gte("closed_at", from)
            .lte("closed_at", to)
            .eq("status_id", 142);

        // 4. Contar leads con status_id = 143 (Perdidos)
        const { count: countPerdidos, data: leadsPerdidos } = await supabase
            .from("leads")
            .select("id, name, desarrollo, pipeline_name, pipeline_id, status_id, status_name, closed_at, price", { count: "exact" })
            .in("pipeline_id", MAIN_PIPELINES)
            .not("closed_at", "is", null)
            .gte("closed_at", from)
            .lte("closed_at", to)
            .eq("status_id", 143);

        // 5. Ver qué status_name tiene los leads "ganados" en Paraíso Caucel específicamente
        const { data: paraisoCaucelLeads } = await supabase
            .from("leads")
            .select("id, name, status_id, status_name, closed_at, price, pipeline_name")
            .eq("pipeline_id", 12290640) // Paraíso Caucel V2
            .not("closed_at", "is", null)
            .gte("closed_at", from)
            .lte("closed_at", to);

        // 6. Ver TODOS los leads de Paraíso Caucel con status_id = 142 (sin filtro de fecha)
        const { data: todosGanadosParaiso, count: countTodosGanadosParaiso } = await supabase
            .from("leads")
            .select("id, name, status_id, status_name, closed_at, price, pipeline_name", { count: "exact" })
            .eq("pipeline_id", 12290640)
            .eq("status_id", 142);

        // 7. Ver status disponibles en pipeline Paraíso Caucel
        const { data: statusParaiso } = await supabase
            .from("pipeline_statuses")
            .select("*")
            .eq("pipeline_id", 12290640);

        return NextResponse.json({
            parametros: { from, to },
            mainPipelines: MAIN_PIPELINES,

            leadsConClosedAtEnRango: {
                total: leadsConClosedAt?.length || 0,
                detalle: leadsConClosedAt?.slice(0, 20) // Mostrar máximo 20
            },

            statusDistintosEnLeadsCerrados: statusMap,

            ventasGanadas: {
                total: countGanados,
                detalle: leadsGanados
            },

            ventasPerdidas: {
                total: countPerdidos,
                detalle: leadsPerdidos
            },

            paraisoCaucel: {
                leadsConClosedAtEnRango: paraisoCaucelLeads,
                todosLosGanados: {
                    total: countTodosGanadosParaiso,
                    detalle: todosGanadosParaiso
                },
                statusDisponibles: statusParaiso
            },

            nota: "status_id 142 = Ganado/Firmado, status_id 143 = Perdido"
        });
    } catch (error: any) {
        console.error("Debug ventas error:", error);
        return NextResponse.json(
            { error: process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor" },
            { status: 500 }
        );
    }
}
