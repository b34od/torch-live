import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import EmailSignInForm from "../../components/auth/EmailSignInForm";
import { getHomeForRole, getSessionContext } from "../../lib/auth";
import { createAdminSupabaseClient } from "../../lib/supabase/admin";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { getSiteUrl } from "../../lib/supabase/env";

const LAST_LOGIN_EMAIL_COOKIE = "torch_last_login_email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeAuthError(message) {
  const fallback = "Unable to send sign-in link right now. Please try again.";
  const raw = String(message || "").trim();
  if (!raw) return fallback;

  const normalized = raw.toLowerCase();

  if (normalized.includes("pkce code verifier not found")) {
    return "Sign-in link opened in a different browser/device. Request a new magic link, then open the new link in the same browser. On iPhone Gmail, use Open in Safari first.";
  }

  if (
    normalized.includes("signups not allowed for otp") ||
    normalized.includes("user not found")
  ) {
    return "That email is not on the TORCH Live roster yet. Ask an admin to add or update your account.";
  }

  if (
    normalized.includes("for security purposes") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Too many sign-in attempts. Please wait one minute, then try again.";
  }

  if (
    normalized.includes("invalid sign-in link") ||
    normalized.includes("token has expired") ||
    normalized.includes("otp expired")
  ) {
    return "That sign-in link expired. Request a new magic link and try again.";
  }

  if (normalized.includes("account is not active") || normalized.includes("profile")) {
    return "Your account is not active yet. Contact TORCH staff for access.";
  }

  return raw;
}

function alertFromParams(params) {
  if (params?.sent === "1") {
    return {
      className: "alert alert-success",
      text: `Magic link sent to ${params.email || "your inbox"}.`,
    };
  }

  if (params?.error === "profile") {
    return {
      className: "alert alert-error",
      text: "Your account is missing a role profile. Contact TORCH staff.",
    };
  }

  if (params?.error) {
    return {
      className: "alert alert-error",
      text: normalizeAuthError(params.error),
    };
  }

  return null;
}

function normalizeOtpToken(value) {
  return String(value || "")
    .trim()
    .replace(/\D/g, "");
}

function setLastLoginEmailCookie(cookieStore, email) {
  cookieStore.set(LAST_LOGIN_EMAIL_COOKIE, email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: false,
  });
}

async function sendMagicLink(formData) {
  "use server";

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect("/login?error=Please+enter+an+email+address.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    redirect("/login?error=Please+enter+a+valid+email+address.");
  }

  const cookieStore = await cookies();
  setLastLoginEmailCookie(cookieStore, email);

  const supabase = await createSupabaseServerClient();
  const headerList = await headers();
  const originHeader = headerList.get("origin");
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host");
  const inferredOrigin =
    forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const origin = originHeader || inferredOrigin || getSiteUrl();
  const emailRedirectTo = new URL("/auth/confirm", origin).toString();

  let { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  });

  const bootstrapEmail = (process.env.TORCH_BOOTSTRAP_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const shouldBootstrap =
    error?.message === "Signups not allowed for otp" && bootstrapEmail && email === bootstrapEmail;

  if (shouldBootstrap) {
    const adminClient = createAdminSupabaseClient();
    const programYear = Number(process.env.TORCH_PROGRAM_YEAR || 2026);
    const fullName = process.env.TORCH_BOOTSTRAP_ADMIN_NAME || "TORCH Admin";

    const { data: newUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError) {
      redirect(`/login?error=${encodeURIComponent(normalizeAuthError(createUserError.message))}`);
    }

    if (newUserData?.user?.id) {
      const { error: profileError } = await adminClient.from("user_profiles").upsert(
        {
          id: newUserData.user.id,
          email,
          full_name: fullName,
          role: "admin",
          program_year: programYear,
          is_active: true,
        },
        { onConflict: "id" },
      );

      if (profileError) {
        redirect(`/login?error=${encodeURIComponent(normalizeAuthError(profileError.message))}`);
      }
    }

    const retry = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo,
      },
    });
    error = retry.error;
  }

  if (error) {
    redirect(`/login?error=${encodeURIComponent(normalizeAuthError(error.message))}`);
  }

  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}

async function verifyEmailCode(formData) {
  "use server";

  const email = String(formData.get("otp_email") || "")
    .trim()
    .toLowerCase();
  const token = normalizeOtpToken(formData.get("otp_token"));

  if (!email || !token) {
    redirect("/login?error=Enter+your+email+and+code+to+finish+sign-in.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    redirect("/login?error=Please+enter+a+valid+email+address.");
  }

  if (token.length !== 6) {
    redirect("/login?error=Enter+the+6-digit+code+from+your+email.");
  }

  const cookieStore = await cookies();
  setLastLoginEmailCookie(cookieStore, email);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(normalizeAuthError(error.message))}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Unable+to+complete+sign-in.");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    redirect("/login?error=Account+is+not+active.");
  }

  redirect(getHomeForRole(profile.role));
}

export const metadata = {
  title: "Sign In",
};

export default async function LoginPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const cookieStore = await cookies();
  const lastEmail = cookieStore.get(LAST_LOGIN_EMAIL_COOKIE)?.value || "";
  const defaultEmail = params?.email || lastEmail;
  const alert = alertFromParams(params || {});
  const session = await getSessionContext();

  if (session.profile?.role) {
    redirect(getHomeForRole(session.profile.role));
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup">
          <Image
            src="/logos/torch-main.png"
            width={150}
            height={48}
            alt="TORCH Leadership Academy"
            priority
          />
        </div>
        <p className="brand-kicker">
          Torch Leadership Academy live operations app. Sign in with your registered email.
        </p>
        {alert ? <p className={alert.className}>{alert.text}</p> : null}
        <EmailSignInForm action={sendMagicLink} defaultEmail={defaultEmail} />
        <div className="surface surface-pad-sm mt-md">
          <h3 className="card-subtitle">Use Email Code Instead</h3>
          <p className="muted">
            If the link does not open correctly, enter the 6-digit code from your latest TORCH
            email.
          </p>
          <form action={verifyEmailCode} className="stack">
            <div className="field">
              <label className="label" htmlFor="otp_email">
                Email
              </label>
              <input
                id="otp_email"
                type="email"
                name="otp_email"
                className="input"
                defaultValue={defaultEmail}
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                spellCheck="false"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="otp_token">
                6-Digit Code
              </label>
              <input
                id="otp_token"
                type="text"
                name="otp_token"
                className="input"
                placeholder="123456"
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
            <button type="submit" className="button button-secondary">
              Sign in with code
            </button>
          </form>
        </div>
        <p className="muted mt-md">
          Check spam/junk if you do not see the email. Use the same email used for program
          registration.
        </p>
        <ul className="auth-checklist">
          <li>Use the exact email your admin uploaded.</li>
          <li>Tap the newest magic link email if multiple were sent.</li>
          <li>Open the login link in the same browser where you requested it.</li>
          <li>If using Gmail on iPhone, choose Open in Safari before tapping a fresh link.</li>
          <li>After sign-in, add TORCH Live to your home screen.</li>
        </ul>
        <p className="auth-legal-links">
          <Link href="/legal/privacy">Privacy</Link>
          <span>•</span>
          <Link href="/legal/terms">Terms</Link>
          <span>•</span>
          <Link href="/legal/safety">Safety</Link>
        </p>
      </section>
    </main>
  );
}
