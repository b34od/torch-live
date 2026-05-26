import { NextResponse } from "next/server";
import { ROLE_HOME } from "./lib/navigation";
import { updateSession } from "./lib/supabase/middleware";

const PUBLIC_PATHS = new Set([
  "/login",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
  "/legal/safety",
  "/auth/callback",
  "/auth/confirm",
  "/auth/error",
  "/api/health",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
]);

function withCopiedCookies(from, to) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
  return to;
}

function redirectWithCookies(request, response, pathname, query = null) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return withCopiedCookies(response, NextResponse.redirect(url));
}

function homeForRole(role) {
  return ROLE_HOME[role] || "/login";
}

function isPublicPath(pathname) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/legal/");
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const { response, supabase, user } = await updateSession(request);

  if (!user) {
    if (isPublicPath(pathname)) {
      return response;
    }

    return redirectWithCookies(request, response, "/login", {
      next: pathname,
    });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return redirectWithCookies(request, response, "/login", { error: "profile" });
  }

  if (pathname === "/" || pathname === "/login") {
    return redirectWithCookies(request, response, homeForRole(profile.role));
  }

  if (pathname.startsWith("/student") && profile.role !== "student") {
    return redirectWithCookies(request, response, homeForRole(profile.role));
  }

  if (pathname.startsWith("/staff") && !["staff", "admin"].includes(profile.role)) {
    return redirectWithCookies(request, response, homeForRole(profile.role));
  }

  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return redirectWithCookies(request, response, homeForRole(profile.role));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
