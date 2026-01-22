import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { KommoService } from "@/lib/sync-engine/services/kommo.service";
import { SupabaseService } from "@/lib/sync-engine/services/supabase.service";
import { incrementalSync } from "@/lib/sync-engine/sync/incremental-sync";

// Force Node.js runtime because of fs/child_process if any
export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

// Valor esperado de autenticación (debe coincidir con middleware)
const AUTH_SESSION_VALUE = 'authenticated';

// Función para verificar autenticación (cookie o API key)
async function isAuthorized(request: Request): Promise<boolean> {
    // Opción 1: Verificar API key en header (para cron jobs externos)
    const apiKey = request.headers.get('x-api-key');
    const syncApiKey = process.env.SYNC_API_KEY;
    if (apiKey && syncApiKey && apiKey === syncApiKey) {
        return true;
    }

    // Opción 2: Verificar cookie de sesión (para llamadas desde el frontend)
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');
    if (authSession?.value === AUTH_SESSION_VALUE) {
        return true;
    }

    return false;
}

export async function POST(request: Request) {
    // Verificar autenticación
    if (!await isAuthorized(request)) {
        return NextResponse.json(
            { success: false, message: "No autorizado. Use x-api-key header o sesión válida." },
            { status: 401 }
        );
    }

    try {
        const kommoService = new KommoService();
        const supabaseService = new SupabaseService();

        const startTime = Date.now();
        await incrementalSync(kommoService, supabaseService);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        return NextResponse.json({
            success: true,
            message: "Sync completed",
            duration: `${duration}s`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

// Endpoint GET para verificar el estado del servicio de sync
export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "sync",
        timestamp: new Date().toISOString()
    });
}
