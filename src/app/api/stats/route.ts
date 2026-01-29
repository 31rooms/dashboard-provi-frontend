import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/data";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const desarrollo = searchParams.get("desarrollo") || undefined;
    const asesor = searchParams.get("asesor") || undefined;
    const tab = searchParams.get("tab") || undefined;

    try {
        const stats = await getDashboardStats({
            dateRange: from && to ? { from, to } : undefined,
            desarrollo,
            asesor,
            tab
        });
        return NextResponse.json(stats);
    } catch (error: any) {
        console.error("API Stats error:", error);
        return NextResponse.json(
            { error: process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor" },
            { status: 500 }
        );
    }
}
