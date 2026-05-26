import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getPublicSupabaseConfig } from "./env";

export async function updateSession(request) {
  let response = NextResponse.next({
    request,
  });

  const { url, key } = getPublicSupabaseConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
