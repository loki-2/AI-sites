// ===========================================
// Supabase Server Client
// ===========================================
// Used for server-side operations with the service role key

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  _supabase = createClient(supabaseUrl, supabaseServiceKey);
  return _supabase;
}

export const supabase = {
  get client() {
    return getSupabase();
  },
};
