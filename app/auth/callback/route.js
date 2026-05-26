import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { ROLE_HOME } from "../../../lib/navigation";
import { getPublicSupabaseConfig } from "../../../lib/supabase/env";

function isPkceBrowserMismatch(normalizedMessage) {
  return (
    normalizedMessage.includes("pkce code verifier not found") ||
    normalizedMessage.includes("flow_state_not_found") ||
    normalizedMessage.includes("code challenge does not match previously saved code verifier") ||
    normalizedMessage.includes("bad_code_verifier")
  );
}

function normalizeAuthError(message) {
  const fallback = "Unable to complete sign-in. Please request a new magic link.";
  const raw = String(message || "").trim();
  if (!raw) return fallback;

  const normalized = raw.toLowerCase();

  if (isPkceBrowserMismatch(normalized)) {
    return "Sign-in link opened in a different browser/device. Go back to TORCH Live and use Sign in with code from your latest email.";
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

function shouldUseCodeFallback(message) {
  const normalized = String(message || "").toLowerCase();
  return isPkceBrowserMismatch(normalized);
}

function normalizeOtpType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  if (normalized === "magiclink" || normalized === "signup") {
    return "email";
  }
  const allowedTypes = new Set(["email", "invite", "recovery", "email_change"]);
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
  const callbackErrorCode = requestUrl.searchParams.get("error_code");
  const callbackErrorSignal = [callbackError, callbackErrorCode].filter(Boolean).join(" ").trim();
  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (callbackError || callbackErrorCode) {
    redirectUrl.searchParams.set(
      "error",
      normalizeAuthError(callbackErrorSignal || "Unable to complete sign-in."),
    );
    if (shouldUseCodeFallback(callbackErrorSignal)) {
      redirectUrl.searchParams.set("use_code", "1");
    }
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
    const errorSignal = [error.code, error.message].filter(Boolean).join(" ").trim();
    redirectUrl.searchParams.set("error", normalizeAuthError(errorSignal || error.message));
    if (shouldUseCodeFallback(errorSignal || error.message)) {
      redirectUrl.searchParams.set("use_code", "1");
    }
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
