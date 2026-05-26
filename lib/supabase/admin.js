import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "./env";

export function createAdminSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
