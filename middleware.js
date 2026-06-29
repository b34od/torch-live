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
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";
const IS_DEV = process.env.NODE_ENV !== "production";
const NONCE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const SECURITY_HEADERS = new Map([
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", "camera=(), microphone=(), geolocation=()"],
  ["cross-origin-opener-policy", "same-origin"],
  ["cross-origin-resource-policy", "same-site"],
]);

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => NONCE_CHARS[byte % NONCE_CHARS.length]).join("");
}

function buildCspHeader(nonce) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST}${IS_DEV ? " ws: http:" : ""}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(IS_DEV ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function applySecurityHeaders(response, cspHeader) {
  SECURITY_HEADERS.forEach((value, key) => {
    response.headers.set(key, value);
  });
  response.headers.set("content-security-policy", cspHeader);
  return response;
}

function withCopiedCookies(from, to, cspHeader) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
  return applySecurityHeaders(to, cspHeader);
}

function redirectWithCookies(request, response, pathname, cspHeader, query = null) {
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

  return withCopiedCookies(response, NextResponse.redirect(url), cspHeader);
}

function homeForRole(role) {
  return ROLE_HOME[role] || "/login";
}

function isPublicPath(pathname) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/legal/");
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const cspHeader = buildCspHeader(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", cspHeader);
  requestHeaders.set("x-nonce", nonce);

  const { response, supabase, user } = await updateSession(request, requestHeaders);

  if (!user) {
    if (isPublicPath(pathname)) {
      return applySecurityHeaders(response, cspHeader);
    }

    return redirectWithCookies(request, response, "/login", cspHeader, {
      next: pathname,
    });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return redirectWithCookies(request, response, "/login", cspHeader, { error: "profile" });
  }

  if (pathname === "/" || pathname === "/login") {
    return redirectWithCookies(request, response, homeForRole(profile.role), cspHeader);
  }

  if (pathname.startsWith("/student") && profile.role !== "student") {
    return redirectWithCookies(request, response, homeForRole(profile.role), cspHeader);
  }

  if (pathname.startsWith("/staff") && !["staff", "admin"].includes(profile.role)) {
    return redirectWithCookies(request, response, homeForRole(profile.role), cspHeader);
  }

  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return redirectWithCookies(request, response, homeForRole(profile.role), cspHeader);
  }

  return applySecurityHeaders(response, cspHeader);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
