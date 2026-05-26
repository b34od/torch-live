import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "./env";

let browserClient;

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, key } = getPublicSupabaseConfig();
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
