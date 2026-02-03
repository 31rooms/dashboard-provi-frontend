import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Listar todas las fuentes de Kommo
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const withCount = searchParams.get("with_count") === "true";

        // 1. Obtener todos los source_id únicos de la tabla leads
        const { data: leadSourceIds, error: leadError } = await supabase
            .from("leads")
            .select("source_id")
            .not("source_id", "is", null);

        if (leadError) throw leadError;

        // Crear set de source_ids únicos con conteo
        const sourceIdCounts: Record<number, number> = {};
        (leadSourceIds || []).forEach((lead: any) => {
            if (lead.source_id) {
                sourceIdCounts[lead.source_id] = (sourceIdCounts[lead.source_id] || 0) + 1;
            }
        });
        const uniqueSourceIds = Object.keys(sourceIdCounts).map(Number);

        // 2. Obtener fuentes existentes en kommo_sources
        const { data: existingSources, error: sourcesError } = await supabase
            .from("kommo_sources")
            .select("*")
            .order("created_at", { ascending: false });

        if (sourcesError) throw sourcesError;

        const existingSourceIds = new Set((existingSources || []).map((s: any) => s.source_id));

        // 3. Detectar source_ids faltantes e insertarlos
        const missingSourceIds = uniqueSourceIds.filter(id => !existingSourceIds.has(id));

        if (missingSourceIds.length > 0) {
            const newSources = missingSourceIds.map(sourceId => ({
                source_id: sourceId,
                source_name: null,
                source_type: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from("kommo_sources")
                .insert(newSources);

            if (insertError) {
                console.error("Error inserting missing sources:", insertError);
                // Continuar aunque falle la inserción
            }
        }

        // 4. Obtener lista actualizada de fuentes
        const { data: allSources, error: finalError } = await supabase
            .from("kommo_sources")
            .select("*")
            .order("created_at", { ascending: false });

        if (finalError) throw finalError;

        // 5. Si se solicita el conteo de leads, agregarlo
        if (withCount) {
            const sourcesWithCount = (allSources || []).map((source: any) => ({
                ...source,
                lead_count: sourceIdCounts[source.source_id] || 0
            }));

            // Ordenar por cantidad de leads (descendente), mostrando todos
            const sortedSources = sourcesWithCount.sort((a: any, b: any) => b.lead_count - a.lead_count);

            return NextResponse.json({ success: true, data: sortedSources });
        }

        return NextResponse.json({ success: true, data: allSources });
    } catch (error: any) {
        console.error("Error fetching kommo sources:", error);
        return NextResponse.json(
            { success: false, error: process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// PUT: Actualizar el nombre de una fuente
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, source_name } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID es requerido" },
                { status: 400 }
            );
        }

        const { source_type } = body;

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        // Solo actualizar campos que fueron enviados
        if (source_name !== undefined) {
            updateData.source_name = source_name || null;
        }
        if (source_type !== undefined) {
            updateData.source_type = source_type || null;
        }

        const { data, error } = await supabase
            .from("kommo_sources")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error updating kommo source:", error);
        return NextResponse.json(
            { success: false, error: process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor" },
            { status: 500 }
        );
    }
}
