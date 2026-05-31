// api/_supabase.js — shared Supabase client (server-side, pakai service_role key)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // service_role key (rahasia, server only)

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_KEY harus diset di environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
