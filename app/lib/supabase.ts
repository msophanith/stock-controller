// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey)
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");

  console.error(
    `[Supabase] Initialization failed. Missing environment variables: ${missing.join(", ")}. ` +
      `Check your .env.local file and ensure you have restarted the dev server.`,
  );
}

// Client for frontend operations (respects RLS)
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
