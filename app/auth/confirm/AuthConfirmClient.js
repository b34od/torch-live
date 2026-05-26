"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function firstValue(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function hashParams(rawHash) {
  const normalized = String(rawHash || "")
    .replace(/^#/, "")
    .replace(/^\//, "");
  return new URLSearchParams(normalized);
}

function buildTargetFromWindow() {
  const currentUrl = new URL(window.location.href);
  const query = currentUrl.searchParams;
  const fragment = hashParams(currentUrl.hash);

  const callbackError = firstValue(
    query.get("error_description"),
    query.get("error"),
    fragment.get("error_description"),
    fragment.get("error"),
  );

  if (callbackError) {
    return `/login?error=${encodeURIComponent(callbackError)}`;
  }

  const code = firstValue(query.get("code"), fragment.get("code"));
  const tokenHash = firstValue(query.get("token_hash"), fragment.get("token_hash"));
  const type = firstValue(query.get("type"), fragment.get("type"), tokenHash ? "email" : "");
  const accessToken = firstValue(query.get("access_token"), fragment.get("access_token"));
  const refreshToken = firstValue(query.get("refresh_token"), fragment.get("refresh_token"));

  if (!code && !tokenHash && !(accessToken && refreshToken)) {
    return "/login?error=Invalid+sign-in+link.";
  }

  const callbackParams = new URLSearchParams();
  if (tokenHash) {
    callbackParams.set("token_hash", tokenHash);
    callbackParams.set("type", type || "email");
  }
  if (code) callbackParams.set("code", code);
  if (!tokenHash && type) callbackParams.set("type", type);
  if (accessToken && refreshToken) {
    callbackParams.set("access_token", accessToken);
    callbackParams.set("refresh_token", refreshToken);
  }

  return `/auth/callback?${callbackParams.toString()}`;
}

export default function AuthConfirmClient({ initialTargetUrl = "" }) {
  const [targetUrl, setTargetUrl] = useState(initialTargetUrl);

  useEffect(() => {
    const resolvedTarget = buildTargetFromWindow();
    if (resolvedTarget && resolvedTarget !== initialTargetUrl) {
      setTargetUrl(resolvedTarget);
    }
  }, [initialTargetUrl]);

  const isReady = Boolean(targetUrl);
  const isErrorTarget = targetUrl.startsWith("/login?error=");
  const isCallbackTarget = targetUrl.includes("/auth/callback");

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Confirm Sign-In</h1>
        <p className="muted">Tap continue to complete your secure TORCH Live sign-in.</p>
        <p className="muted">
          This extra tap helps prevent email preview browsers from consuming one-time sign-in links.
        </p>
        {isReady && isErrorTarget ? (
          <Link href={targetUrl} className="button button-secondary">
            Return to login
          </Link>
        ) : (
          <button
            type="button"
            className="button button-primary"
            disabled={!isReady}
            onClick={() => {
              if (!isReady) return;
              window.location.assign(targetUrl);
            }}
          >
            {isReady ? "Continue sign-in" : "Preparing secure link..."}
          </button>
        )}
        {isCallbackTarget ? (
          <p className="muted mt-sm">
            If you opened this from Gmail on iPhone, choose <strong>Open in Safari</strong> before continuing.
          </p>
        ) : null}
      </section>
    </main>
  );
}
