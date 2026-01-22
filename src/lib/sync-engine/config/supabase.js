import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn('⚠️ SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados correctamente en .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
