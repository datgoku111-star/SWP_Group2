import { createClient } from "@supabase/supabase-js";

// Provide a fallback for build-time static evaluation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

/** Browser/client-side Supabase client — uses anon key with RLS */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

/** Server-side Supabase client — uses service role key, bypasses RLS */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);
