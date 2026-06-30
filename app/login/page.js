import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import EmailSignInForm, { FormSubmitButton } from "../../components/auth/EmailSignInForm";
import InAppBrowserWarning from "../../components/auth/InAppBrowserWarning";
import { recordUserActivity } from "../../lib/activity";
import { getHomeForRole, getSessionContext } from "../../lib/auth";
import { createAdminSupabaseClient } from "../../lib/supabase/admin";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { getSiteUrl } from "../../lib/supabase/env";

const LAST_LOGIN_EMAIL_COOKIE = "torch_last_login_email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_MIN_LENGTH = 6;
const OTP_MAX_LENGTH = 8;

function isPkceBrowserMismatch(normalizedMessage) {
  return (
    normalizedMessage.includes("pkce code verifier not found") ||
    normalizedMessage.includes("flow_state_not_found") ||
    normalizedMessage.includes("code challenge does not match previously saved code verifier") ||
    normalizedMessage.includes("bad_code_verifier")
  );
}

function normalizeAuthError(message) {
  const fallback = "Unable to send sign-in link right now. Please try again.";
  const raw = String(message || "").trim();
  if (!raw) return fallback;

  const normalized = raw.toLowerCase();

  if (isPkceBrowserMismatch(normalized)) {
    return "Sign-in link opened in a different browser/device. Return to login and use the sign-in code from your latest TORCH sign-in email.";
  }

  if (normalized.includes("use @supabase/ssr")) {
    return "That sign-in link could not finish in this browser. Use Sign in with code below, or request a fresh sign-in email.";
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

  if (
    normalized.includes("error sending magic link email") ||
    normalized.includes("error sending confirmation email") ||
    normalized.includes("smtp") ||
    normalized.includes("email provider")
  ) {
    return "TORCH Live could not send email right now. Wait a minute and try again, or contact TORCH staff if it keeps happening.";
  }

  if (normalized.includes("account is not active") || normalized.includes("profile")) {
    return "Your account is not active yet. Contact TORCH staff for access.";
  }

  return fallback;
}

function alertFromParams(params) {
  if (params?.sent === "1") {
    return {
      className: "alert alert-success",
      text: `Sign-in email sent to ${params.email || "your inbox"}. Use the newest email and enter the sign-in code if the link does not finish.`,
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

function normalizeOtpType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  if (normalized === "magiclink" || normalized === "signup") {
    return "email";
  }
  const allowed = new Set(["email", "invite", "recovery", "email_change"]);
  return allowed.has(normalized) ? normalized : "email";
}

function hashParams(rawHash) {
  const normalized = String(rawHash || "")
    .replace(/^#/, "")
    .replace(/^\//, "");
  return new URLSearchParams(normalized);
}

function parseAuthLinkPayload(rawLink) {
  const link = String(rawLink || "").trim();
  if (!link) {
    return { error: "Paste the full sign-in link from your email." };
  }

  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    return { error: "Paste the full sign-in link, including https://." };
  }

  const query = parsed.searchParams;
  const fragment = hashParams(parsed.hash);
  const value = (...keys) => {
    for (const key of keys) {
      const queryValue = String(query.get(key) || "").trim();
      if (queryValue) return queryValue;
      const fragmentValue = String(fragment.get(key) || "").trim();
      if (fragmentValue) return fragmentValue;
    }
    return "";
  };

  const callbackError = value("error_description", "error");
  if (callbackError) {
    return { error: normalizeAuthError(callbackError) };
  }

  const code = value("code");
  const tokenHash = value("token_hash");
  const type = value("type");

  if (!code && !tokenHash) {
    return {
      error:
        "Could not find a valid sign-in token in that link. Paste the complete URL from your newest email.",
    };
  }

  return {
    code,
    tokenHash,
    type,
  };
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

  const adminClient = createAdminSupabaseClient();
  const programYear = Number(process.env.TORCH_PROGRAM_YEAR || 2026);
  const { data: rosterProfile } = await adminClient
    .from("user_profiles")
    .select("id, is_active")
    .eq("email", email)
    .eq("program_year", programYear)
    .maybeSingle();

  if (!rosterProfile) {
    redirect("/login?error=That+email+is+not+on+the+TORCH+Live+roster+yet.+Ask+an+admin+to+add+or+update+your+account.");
  }

  if (!rosterProfile.is_active) {
    redirect("/login?error=Your+account+is+not+active+yet.+Contact+TORCH+staff+for+access.");
  }

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
    console.error("sendMagicLink failed", { email, message: error.message });
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

  if (token.length < OTP_MIN_LENGTH || token.length > OTP_MAX_LENGTH) {
    redirect("/login?error=Enter+the+code+from+your+email+(6-8+digits).");
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

  try {
    await recordUserActivity(supabase, "login");
  } catch {}

  redirect(getHomeForRole(profile.role));
}

async function verifyPastedLink(formData) {
  "use server";

  const link = String(formData.get("auth_link") || "").trim();
  const parsed = parseAuthLinkPayload(link);

  if (parsed.error) {
    redirect(`/login?error=${encodeURIComponent(parsed.error)}`);
  }

  const supabase = await createSupabaseServerClient();
  let error = null;

  if (parsed.tokenHash) {
    const verify = await supabase.auth.verifyOtp({
      token_hash: parsed.tokenHash,
      type: normalizeOtpType(parsed.type),
    });
    error = verify.error;
  } else if (parsed.code) {
    const exchange = await supabase.auth.exchangeCodeForSession(parsed.code);
    error = exchange.error;
  } else {
    error = { message: "Invalid sign-in link." };
  }

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

  try {
    await recordUserActivity(supabase, "login");
  } catch {}

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
  const useCodeFallback = params?.use_code === "1";
  const rawError = String(params?.error || "").toLowerCase();
  const preferCodeFirst = useCodeFallback || isPkceBrowserMismatch(rawError);
  const alert = alertFromParams(params || {});
  const session = await getSessionContext();

  if (session.profile?.role) {
    redirect(getHomeForRole(session.profile.role));
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup">
          <div className="theme-logo-stack">
            <Image
              src="/logos/torch-main.png"
              width={150}
              height={48}
              alt="TORCH Leadership Academy"
              className="theme-logo-light"
              priority
            />
            <Image
              src="/logos/torch-main-white.svg"
              width={150}
              height={48}
              alt="TORCH Leadership Academy"
              className="theme-logo-dark"
              priority
            />
          </div>
        </div>
        <p className="brand-kicker">
          Torch Leadership Academy live operations app. Sign in with your registered email.
        </p>
        <InAppBrowserWarning />
        {alert ? <p className={alert.className}>{alert.text}</p> : null}
        {useCodeFallback ? (
          <p className="alert alert-warn mt-sm">
            This browser could not complete the sign-in link. Use Sign in with code below from your
            newest TORCH email.
          </p>
        ) : null}
        {preferCodeFirst ? null : <EmailSignInForm action={sendMagicLink} defaultEmail={defaultEmail} />}
        <div
          id="code-sign-in"
          className={`surface surface-pad-sm mt-md${preferCodeFirst ? " code-focus" : ""}`}
        >
          <h3 className="card-subtitle">Use Email Code Instead</h3>
          <p className="muted">
            If the link does not open correctly, enter the code from your latest TORCH
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
                Sign-In Code (6-8 digits)
              </label>
              <input
                id="otp_token"
                type="text"
                name="otp_token"
                className="input"
                placeholder="123456 or 12345678"
                minLength={OTP_MIN_LENGTH}
                maxLength={24}
                pattern="[0-9\\s-]{6,24}"
                title="Enter the backup code from your newest TORCH sign-in email. Spaces or dashes are okay."
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus={preferCodeFirst}
              />
              <p className="muted mt-sm">
                Tip: If your email app copies code like <strong>123 456 78</strong>, paste it as-is.
              </p>
            </div>
            <FormSubmitButton
              className="button button-secondary"
              idleLabel="Sign in with code"
              pendingLabel="Signing in with code..."
            />
          </form>
        </div>
        <div className="surface surface-pad-sm mt-md">
          <h3 className="card-subtitle">Paste Sign-In Link Instead</h3>
          <p className="muted">
            If your email does not show a sign-in code, paste the full sign-in link from that
            email here.
          </p>
          <form action={verifyPastedLink} className="stack">
            <div className="field">
              <label className="label" htmlFor="auth_link">
                Full Sign-In Link
              </label>
              <input
                id="auth_link"
                type="url"
                name="auth_link"
                className="input"
                placeholder="https://..."
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            <FormSubmitButton
              className="button button-ghost"
              idleLabel="Sign in with pasted link"
              pendingLabel="Signing in..."
            />
          </form>
        </div>
        {preferCodeFirst ? (
          <div className="surface surface-pad-sm mt-md">
            <h3 className="card-subtitle">Need a New Sign-In Email?</h3>
            <p className="muted">
              Request a fresh sign-in email if the code or pasted link from your newest email does not work.
            </p>
            <EmailSignInForm action={sendMagicLink} defaultEmail={defaultEmail} />
          </div>
        ) : null}
        <p className="muted mt-md">
          Check spam/junk if you do not see the email. Use the same email used for program
          registration.
        </p>
        <ul className="auth-checklist">
          <li>Use the exact email your admin uploaded.</li>
          <li>Tap the newest magic link email if multiple were sent.</li>
          <li>Open the login link in the same browser where you requested it.</li>
          <li>If the sign-in code is missing, paste the full sign-in link into the field above.</li>
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
