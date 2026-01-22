import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Función helper para actualizar automáticamente la meta "Todos"
async function updateTodosTarget(mes: number, anio: number) {
    try {
        // Obtener todas las metas individuales (excepto "Todos")
        const { data: individualTargets, error: fetchError } = await supabase
            .from("sales_targets")
            .select("*")
            .eq("mes", mes)
            .eq("anio", anio)
            .neq("desarrollo", "Todos");

        if (fetchError) throw fetchError;

        if (!individualTargets || individualTargets.length === 0) {
            // Si no hay metas individuales, eliminar la meta "Todos" si existe
            await supabase
                .from("sales_targets")
                .delete()
                .eq("mes", mes)
                .eq("anio", anio)
                .eq("desarrollo", "Todos");
            return;
        }

        // Calcular las sumas
        const totals = individualTargets.reduce(
            (acc, target) => ({
                meta_leads: acc.meta_leads + (target.meta_leads || 0),
                meta_citas: acc.meta_citas + (target.meta_citas || 0),
                meta_apartados: acc.meta_apartados + (target.meta_apartados || 0),
                meta_ventas: acc.meta_ventas + (target.meta_ventas || 0),
                meta_monto: acc.meta_monto + (target.meta_monto || 0)
            }),
            { meta_leads: 0, meta_citas: 0, meta_apartados: 0, meta_ventas: 0, meta_monto: 0 }
        );

        // Verificar si ya existe la meta "Todos"
        const { data: existingTodos } = await supabase
            .from("sales_targets")
            .select("id")
            .eq("mes", mes)
            .eq("anio", anio)
            .eq("desarrollo", "Todos")
            .single();

        if (existingTodos) {
            // Actualizar la meta "Todos" existente
            await supabase
                .from("sales_targets")
                .update({
                    ...totals,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existingTodos.id);
        } else {
            // Crear nueva meta "Todos"
            await supabase
                .from("sales_targets")
                .insert([{
                    mes,
                    anio,
                    desarrollo: "Todos",
                    ...totals
                }]);
        }
    } catch (error) {
        console.error("Error updating Todos target:", error);
        // No lanzar el error para no interrumpir el flujo principal
    }
}

// GET: Obtener todas las metas de ventas
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const anio = searchParams.get("anio");
    const desarrollo = searchParams.get("desarrollo");

    try {
        let query = supabase
            .from("sales_targets")
            .select("*")
            .order("anio", { ascending: false })
            .order("mes", { ascending: false });

        if (mes) query = query.eq("mes", parseInt(mes));
        if (anio) query = query.eq("anio", parseInt(anio));
        if (desarrollo) query = query.eq("desarrollo", desarrollo);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error fetching sales targets:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST: Crear una nueva meta de ventas
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mes, anio, desarrollo, meta_leads, meta_citas, meta_apartados, meta_ventas, meta_monto } = body;

        // Validaciones
        if (!mes || !anio || !desarrollo) {
            return NextResponse.json(
                { success: false, error: "Faltan campos requeridos: mes, anio, desarrollo" },
                { status: 400 }
            );
        }

        if (mes < 1 || mes > 12) {
            return NextResponse.json(
                { success: false, error: "Mes debe estar entre 1 y 12" },
                { status: 400 }
            );
        }

        // Si el desarrollo es "Todos", no permitir creación manual
        if (desarrollo === "Todos") {
            return NextResponse.json(
                { success: false, error: "La meta 'Todos' se calcula automáticamente. Configure las metas individuales." },
                { status: 400 }
            );
        }

        // Verificar si ya existe una meta para ese mes/año/desarrollo
        const { data: existing } = await supabase
            .from("sales_targets")
            .select("id")
            .eq("mes", mes)
            .eq("anio", anio)
            .eq("desarrollo", desarrollo)
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, error: "Ya existe una meta para este mes, año y desarrollo" },
                { status: 409 }
            );
        }

        // Insertar nueva meta
        const { data, error } = await supabase
            .from("sales_targets")
            .insert([{
                mes,
                anio,
                desarrollo,
                meta_leads: meta_leads || 0,
                meta_citas: meta_citas || 0,
                meta_apartados: meta_apartados || 0,
                meta_ventas: meta_ventas || 0,
                meta_monto: meta_monto || 0
            }])
            .select()
            .single();

        if (error) throw error;

        // Actualizar automáticamente la meta "Todos"
        await updateTodosTarget(mes, anio);

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating sales target:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT: Actualizar una meta existente
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, mes, anio, desarrollo, meta_leads, meta_citas, meta_apartados, meta_ventas, meta_monto } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID es requerido" },
                { status: 400 }
            );
        }

        // Obtener la meta actual para verificar mes/anio
        const { data: currentTarget } = await supabase
            .from("sales_targets")
            .select("mes, anio, desarrollo")
            .eq("id", id)
            .single();

        if (!currentTarget) {
            return NextResponse.json(
                { success: false, error: "Meta no encontrada" },
                { status: 404 }
            );
        }

        // Si el desarrollo actual o nuevo es "Todos", no permitir edición manual
        if (currentTarget.desarrollo === "Todos" || desarrollo === "Todos") {
            return NextResponse.json(
                { success: false, error: "La meta 'Todos' se calcula automáticamente. Edite las metas individuales." },
                { status: 400 }
            );
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (mes !== undefined) updateData.mes = mes;
        if (anio !== undefined) updateData.anio = anio;
        if (desarrollo !== undefined) updateData.desarrollo = desarrollo;
        if (meta_leads !== undefined) updateData.meta_leads = meta_leads;
        if (meta_citas !== undefined) updateData.meta_citas = meta_citas;
        if (meta_apartados !== undefined) updateData.meta_apartados = meta_apartados;
        if (meta_ventas !== undefined) updateData.meta_ventas = meta_ventas;
        if (meta_monto !== undefined) updateData.meta_monto = meta_monto;

        const { data, error } = await supabase
            .from("sales_targets")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Actualizar "Todos" tanto para el mes/año original como para el nuevo (si cambió)
        await updateTodosTarget(currentTarget.mes, currentTarget.anio);
        if (mes && anio && (mes !== currentTarget.mes || anio !== currentTarget.anio)) {
            await updateTodosTarget(mes, anio);
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Error updating sales target:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE: Eliminar una meta
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { success: false, error: "ID es requerido" },
            { status: 400 }
        );
    }

    try {
        // Obtener la meta antes de eliminarla para actualizar "Todos"
        const { data: targetToDelete } = await supabase
            .from("sales_targets")
            .select("mes, anio, desarrollo")
            .eq("id", id)
            .single();

        if (!targetToDelete) {
            return NextResponse.json(
                { success: false, error: "Meta no encontrada" },
                { status: 404 }
            );
        }

        // Si es la meta "Todos", no permitir eliminación manual
        if (targetToDelete.desarrollo === "Todos") {
            return NextResponse.json(
                { success: false, error: "La meta 'Todos' se calcula automáticamente. Elimine las metas individuales si lo desea." },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("sales_targets")
            .delete()
            .eq("id", id);

        if (error) throw error;

        // Actualizar "Todos" después de eliminar
        await updateTodosTarget(targetToDelete.mes, targetToDelete.anio);

        return NextResponse.json({ success: true, message: "Meta eliminada correctamente" });
    } catch (error: any) {
        console.error("Error deleting sales target:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
