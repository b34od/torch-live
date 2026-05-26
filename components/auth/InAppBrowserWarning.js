"use client";

import { useMemo } from "react";

const IAB_MARKERS = [
  { regex: /\bgsa\//i, label: "Gmail/Google in-app browser" },
  { regex: /\bfbav\b|\bfban\b/i, label: "Facebook in-app browser" },
  { regex: /\binstagram\b/i, label: "Instagram in-app browser" },
  { regex: /\bline\//i, label: "LINE in-app browser" },
  { regex: /\blinkedinapp\b/i, label: "LinkedIn in-app browser" },
  { regex: /\bmicromessenger\b/i, label: "WeChat in-app browser" },
];

function detectInAppBrowser() {
  if (typeof navigator === "undefined") return null;

  const ua = String(navigator.userAgent || "");
  const lower = ua.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(lower);
  const isAndroid = /android/.test(lower);

  if (!isIOS && !isAndroid) return null;

  const marker = IAB_MARKERS.find((entry) => entry.regex.test(ua));
  const isAndroidWebView = isAndroid && (/\bwv\b/i.test(ua) || /version\/\d+\.\d+/i.test(ua));
  const likelyInApp = Boolean(marker || isAndroidWebView);

  if (!likelyInApp) return null;

  return {
    label: marker?.label || "in-app browser",
    openSteps: isIOS
      ? "Use the share menu, choose Open in Safari, then request a fresh sign-in email."
      : "Open this page in your default browser, then request a fresh sign-in email.",
  };
}

export default function InAppBrowserWarning() {
  const warning = useMemo(detectInAppBrowser, []);

  if (!warning) return null;

  return (
    <p className="alert alert-warn mt-md" role="status" aria-live="polite">
      You are in a {warning.label}. Sign-in links can fail here. {warning.openSteps}
    </p>
  );
}
