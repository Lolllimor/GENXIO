import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Anon, cookie-less client for reading public (published) content on
// static/revalidated pages — avoids opting the route into per-request
// dynamic rendering the way the cookie-based SSR client would.
export function createPublicClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
