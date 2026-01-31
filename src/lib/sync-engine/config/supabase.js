import { createClient } from '@supabase/supabase-js';

let _supabase = null;

export function getSupabase() {
    if (!_supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
            throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados en variables de entorno');
        }

        _supabase = createClient(supabaseUrl, supabaseKey);
    }
    return _supabase;
}
