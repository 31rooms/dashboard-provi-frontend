import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('Supabase no configurado: falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en variables de entorno');
        }

        _supabase = createClient(url, key);
    }
    return _supabase;
}

// Proxy para compatibilidad: supabase.from(...) funciona sin cambiar los importadores
// Se inicializa lazy en runtime, no en build time
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabaseClient() as any)[prop];
    }
});
