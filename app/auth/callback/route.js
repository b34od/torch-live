import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { ROLE_HOME } from "../../../lib/navigation";
import { getPublicSupabaseConfig } from "../../../lib/supabase/env";

function normalizeAuthError(message) {
  const fallback = "Unable to complete sign-in. Please request a new magic link.";
  const raw = String(message || "").trim();
  if (!raw) return fallback;

  const normalized = raw.toLowerCase();

  if (normalized.includes("pkce code verifier not found")) {
    return "Sign-in link opened in a different browser/device. Go back to TORCH Live, request a new link, then open that new link in the same browser.";
  }

  if (normalized.includes("token has expired") || normalized.includes("otp expired")) {
    return "That sign-in link expired. Request a new magic link and try again.";
  }

  if (normalized.includes("invalid")) {
    return "Invalid sign-in link. Request a new magic link and try again.";
  }

  if (
    normalized.includes("for security purposes") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Too many sign-in attempts. Please wait one minute, then try again.";
  }

  return raw;
}

function normalizeOtpType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  const allowedTypes = new Set(["email", "signup", "invite", "recovery", "email_change", "magiclink"]);
  return allowedTypes.has(normalized) ? normalized : "email";
}

function homeForRole(role) {
  return ROLE_HOME[role] || "/login";
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");
  const type = requestUrl.searchParams.get("type");
  const callbackError =
    requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");
  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (callbackError) {
    redirectUrl.searchParams.set("error", normalizeAuthError(callbackError));
    response.headers.set("Location", redirectUrl.toString());
    return response;
  }

  const hasSessionPair = Boolean(accessToken && refreshToken);

  if (!code && !tokenHash && !hasSessionPair) {
    redirectUrl.searchParams.set("error", "Invalid sign-in link.");
    response.headers.set("Location", redirectUrl.toString());
    return response;
  }

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

  let error = null;

  if (tokenHash) {
    const verify = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: normalizeOtpType(type),
    });
    error = verify.error;
  } else if (code) {
    const exchange = await supabase.auth.exchangeCodeForSession(code);
    error = exchange.error;
  } else if (hasSessionPair) {
    const restore = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    error = restore.error;
  } else {
    error = { message: "Invalid sign-in link." };
  }

  if (error) {
    redirectUrl.searchParams.set("error", normalizeAuthError(error.message));
    response.headers.set("Location", redirectUrl.toString());
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectUrl.searchParams.set("error", "Unable to complete sign-in.");
    response.headers.set("Location", redirectUrl.toString());
    return response;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    redirectUrl.searchParams.set("error", "Account is not active.");
    response.headers.set("Location", redirectUrl.toString());
    return response;
  }

  response.headers.set("Location", new URL(homeForRole(profile.role), request.url).toString());
  return response;
}
