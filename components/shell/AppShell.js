"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROLE_NAV } from "../../lib/navigation";

function rolePillClass(role) {
  if (role === "admin") return "pill pill-admin";
  if (role === "staff") return "pill pill-staff";
  return "pill pill-student";
}

export default function AppShell({ role, profile, children }) {
  const pathname = usePathname();
  const navItems = ROLE_NAV[role] || [];
  const installPromptRef = useRef(null);
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [installHint, setInstallHint] = useState("");
  const [showInstallHint, setShowInstallHint] = useState(false);

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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-row">
          <div className="topbar-brand">
            <Image
              src="/logos/torch-main.png"
              width={188}
              height={60}
              alt="Torch Leadership Academy"
              className="topbar-logo"
              priority
            />
            <div className="topbar-profile">
              <p className="topbar-title">TORCH Live</p>
              <p className="topbar-name">{profile.full_name}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className={rolePillClass(profile.role)}>{profile.role}</span>
            <span className="pill pill-meta">{profile.program_year} ET</span>
            <form action="/auth/signout" method="post" className="inline-form">
              <button type="submit" className="button button-ghost topbar-signout">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="nav-row" aria-label="Primary">
          {navItems.map((item) => {
            const active =
              pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
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
        {navItems.map((item) => {
          const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
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
