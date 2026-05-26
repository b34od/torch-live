import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getPublicSupabaseConfig } from "../../../lib/supabase/env";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const { url, key } = getPublicSupabaseConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
