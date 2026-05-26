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

function buildTargetUrl() {
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

  const callbackUrl = new URL("/auth/callback", currentUrl.origin);

  if (tokenHash) {
    callbackUrl.searchParams.set("token_hash", tokenHash);
    if (type) callbackUrl.searchParams.set("type", type);
  }

  if (code) {
    callbackUrl.searchParams.set("code", code);
  }

  if (!tokenHash && type) {
    callbackUrl.searchParams.set("type", type);
  }

  if (accessToken && refreshToken) {
    callbackUrl.searchParams.set("access_token", accessToken);
    callbackUrl.searchParams.set("refresh_token", refreshToken);
  }

  return callbackUrl.toString();
}

export default function AuthConfirmPage() {
  const [targetUrl, setTargetUrl] = useState("/login");

  useEffect(() => {
    const target = buildTargetUrl();
    setTargetUrl(target);
    window.location.replace(target);
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Finishing Sign-In</h1>
        <p className="muted">One moment while we securely complete your login.</p>
        <p className="muted">
          If this page does not continue automatically, use the button below.
        </p>
        <Link href={targetUrl} className="button button-primary">
          Continue
        </Link>
      </section>
    </main>
  );
}
