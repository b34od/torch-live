"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getRoleNav } from "../../lib/navigation";

function rolePillClass(role) {
  if (role === "admin") return "pill pill-admin";
  if (role === "staff") return "pill pill-staff";
  return "pill pill-student";
}

export default function AppShell({ role, profile, children }) {
  const pathname = usePathname();
  const navConfig = getRoleNav(role);
  const primaryNavItems = navConfig.primary || [];
  const secondaryNavItems = navConfig.secondary || [];
  const mobileNavItems = navConfig.mobile || primaryNavItems;
  const installPromptRef = useRef(null);
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [installHint, setInstallHint] = useState("");
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("torch-live-theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      const resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    }
  }, []);

  useEffect(() => {
    if (!pathname) return;

    fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pathname }),
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;

      fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pathname: window.location.pathname }),
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => {});
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("torch-live-install-hint-dismissed-v1") === "1";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (dismissed || isStandalone) {
      return undefined;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIos) {
      setInstallHint("On iPhone: tap Share, then Add to Home Screen.");
    } else if (isAndroid) {
      setInstallHint("On Android: open browser menu, then tap Install App.");
    } else {
      setInstallHint("Install TORCH Live from your browser menu for faster access.");
    }

    setShowInstallHint(true);

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      installPromptRef.current = event;
      setCanPromptInstall(true);
      setShowInstallHint(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function triggerInstall() {
    if (!installPromptRef.current) return;
    await installPromptRef.current.prompt();
    installPromptRef.current = null;
    setCanPromptInstall(false);
    setShowInstallHint(false);
    window.localStorage.setItem("torch-live-install-hint-dismissed-v1", "1");
  }

  function dismissInstallHint() {
    setShowInstallHint(false);
    window.localStorage.setItem("torch-live-install-hint-dismissed-v1", "1");
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("torch-live-theme", next);
  }

  function isActiveNavItem(item) {
    if (!item?.href) return false;
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const secondaryActive = secondaryNavItems.some((item) => isActiveNavItem(item));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-row">
          <div className="topbar-brand">
            <div className="theme-logo-stack">
              <Image
                src="/logos/torch-main.png"
                width={188}
                height={60}
                alt="Torch Leadership Academy"
                className="topbar-logo theme-logo-light"
                priority
              />
              <Image
                src="/logos/torch-main-white.svg"
                width={188}
                height={60}
                alt="Torch Leadership Academy"
                className="topbar-logo theme-logo-dark"
                priority
              />
            </div>
            <div className="topbar-profile">
              <p className="topbar-title">TORCH Live</p>
              <p className="topbar-name">{profile.full_name}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <span className={rolePillClass(profile.role)}>{profile.role}</span>
            <span className="pill pill-meta">{profile.program_year}</span>
            <form action="/auth/signout" method="post" className="inline-form">
              <button type="submit" className="button button-ghost topbar-signout">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="nav-row" aria-label="Primary">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActiveNavItem(item) ? "nav-link-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          {secondaryNavItems.length > 0 ? (
            <details className={`nav-more ${secondaryActive ? "nav-more-active" : ""}`}>
              <summary className={`nav-link nav-more-summary ${secondaryActive ? "nav-link-active" : ""}`}>
                More
              </summary>
              <div className="nav-more-menu">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-more-link ${isActiveNavItem(item) ? "nav-more-link-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
        </nav>
      </header>
      {showInstallHint ? (
        <section className="install-hint surface surface-pad-sm" aria-label="Install helper">
          <p className="install-hint-title">Install TORCH Live for faster access</p>
          <p className="muted">{installHint}</p>
          <div className="install-hint-actions">
            {canPromptInstall ? (
              <button type="button" className="button button-secondary" onClick={triggerInstall}>
                Install App
              </button>
            ) : null}
            <button type="button" className="button button-ghost" onClick={dismissInstallHint}>
              Dismiss
            </button>
          </div>
        </section>
      ) : null}
      <section className="content-area">{children}</section>
      <nav className={`bottom-nav bottom-nav-${role}`} aria-label="Primary mobile navigation">
        {mobileNavItems.map((item) => {
          const active = isActiveNavItem(item);
          const mobileLabel = item.mobileLabel || item.label;
          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={`bottom-nav-link ${active ? "bottom-nav-link-active" : ""}`}
            >
              {mobileLabel}
            </Link>
          );
        })}
      </nav>
      <footer className="app-footer">
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/safety">Safety</Link>
      </footer>
    </main>
  );
}
