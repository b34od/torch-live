import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "../../../lib/auth";
import { dayLabel, programDaySortMinutes } from "../../../lib/schedule";

const REQUIRED_STAFF_DAYS = [0, 1, 2, 3, 4];
const REQUIRED_STUDENT_DAYS = [1, 2, 3, 4];
const REQUIRED_ROLES = ["admin", "staff", "student"];

function configured(value) {
  return value ? "Configured" : "Missing";
}

function isConfigured(value) {
  return Boolean(value);
}

function overlapPairs(items) {
  const sorted = [...items].sort((a, b) => {
    const aStart = programDaySortMinutes(a.start_time) || 0;
    const bStart = programDaySortMinutes(b.start_time) || 0;
    return aStart - bStart;
  });

  const overlaps = [];
  const active = [];

  sorted.forEach((item) => {
    const start = programDaySortMinutes(item.start_time) || 0;
    const end = start + Number(item.duration_minutes || 0);

    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index].end <= start) {
        active.splice(index, 1);
      }
    }

    active.forEach((entry) => {
      overlaps.push({ first: entry.item, second: item });
    });

    active.push({ item, end });
  });

  return overlaps;
}

function conflictByDay(rows) {
  const byDay = new Map();
  (rows || []).forEach((row) => {
    const day = Number(row.day_number || 0);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(row);
  });

  const results = [];
  byDay.forEach((dayRows, dayNumber) => {
    const pairs = overlapPairs(dayRows);
    if (!pairs.length) return;
    results.push({ dayNumber, pairs });
  });

  return results.sort((a, b) => a.dayNumber - b.dayNumber);
}

function missingRequiredDays(rows, requiredDays) {
  const populated = new Set((rows || []).map((row) => Number(row.day_number)));
  return requiredDays.filter((dayNumber) => !populated.has(dayNumber));
}

function activeRoleCounts(rows) {
  const counts = {
    admin: 0,
    staff: 0,
    student: 0,
  };

  (rows || []).forEach((row) => {
    const role = String(row.role || "");
    if (!Object.prototype.hasOwnProperty.call(counts, role)) return;
    if (row.is_active) {
      counts[role] += 1;
    }
  });

  return counts;
}

function analyzeMagicLinkTemplate(content) {
  const normalized = String(content || "");
  return {
    containsOtpToken: normalized.includes("{{ .Token }}"),
    containsTokenHashRoute:
      normalized.includes("/auth/confirm?token_hash={{ .TokenHash }}") ||
      normalized.includes("token_hash={{ .TokenHash }}"),
    usesDirectConfirmationUrl: normalized.includes("{{ .ConfirmationURL }}"),
  };
}

function normalizeTemplateForCompare(content) {
  return String(content || "")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveSupabaseProjectRef() {
  const explicit =
    String(
      process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || "",
    ).trim();
  if (explicit) return explicit;

  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const match = supabaseUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\./i);
  return match?.[1] || "";
}

function toUrlList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  const text = String(value || "").trim();
  if (!text) return [];

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function auditAuthRedirectConfig(config, expectedSiteUrl) {
  const siteUrl = String(config?.site_url || "").trim();
  const allowList = toUrlList(config?.additional_redirect_urls);
  const allRedirects = [siteUrl, ...allowList].filter(Boolean);
  const hasConfirmRoute = allRedirects.some((url) => url.includes("/auth/confirm"));
  const hasCallbackRoute = allRedirects.some((url) => url.includes("/auth/callback"));
  const normalizedExpected = normalizeUrl(expectedSiteUrl);
  const siteUrlMatchesExpected =
    !normalizedExpected || normalizeUrl(siteUrl) === normalizedExpected;

  return {
    siteUrl,
    allowList,
    hasConfirmRoute,
    hasCallbackRoute,
    siteUrlMatchesExpected,
  };
}

async function auditMagicLinkTemplate() {
  const templatePath = path.join(process.cwd(), "supabase/templates/magic-link.html");

  try {
    const template = await readFile(templatePath, "utf8");
    const checks = analyzeMagicLinkTemplate(template);
    return {
      loaded: true,
      template,
      normalizedTemplate: normalizeTemplateForCompare(template),
      ...checks,
    };
  } catch (error) {
    return {
      loaded: false,
      errorMessage: String(error?.message || "Unable to read template file."),
      containsOtpToken: false,
      containsTokenHashRoute: false,
      usesDirectConfirmationUrl: false,
    };
  }
}

async function auditLiveMagicLinkTemplate() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {
      available: false,
      configured: false,
      reason: "Skipped during production build; live template checks run at request time in admin settings.",
    };
  }

  const accessToken = String(
    process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MANAGEMENT_ACCESS_TOKEN || "",
  ).trim();
  const projectRef = deriveSupabaseProjectRef();

  if (!accessToken) {
    return {
      available: false,
      configured: false,
      reason:
        "Set SUPABASE_ACCESS_TOKEN or SUPABASE_MANAGEMENT_ACCESS_TOKEN to verify the live dashboard template.",
    };
  }

  if (!projectRef) {
    return {
      available: false,
      configured: false,
      reason:
        "Set SUPABASE_PROJECT_REF (or NEXT_PUBLIC_SUPABASE_PROJECT_REF) to verify the live dashboard template.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = (await response.text()).slice(0, 160);
      return {
        available: true,
        configured: true,
        loaded: false,
        errorMessage: `Live config request failed (${response.status}). ${text || ""}`.trim(),
        projectRef,
      };
    }

    const config = await response.json();
    const template = String(config?.mailer_templates_magic_link_content || "");
    if (!template.trim()) {
      return {
        available: true,
        configured: true,
        loaded: false,
        errorMessage: "Live Magic Link template is empty in Supabase project config.",
        projectRef,
      };
    }

    const checks = analyzeMagicLinkTemplate(template);
    const redirectAudit = auditAuthRedirectConfig(config, process.env.NEXT_PUBLIC_SITE_URL);
    return {
      available: true,
      configured: true,
      loaded: true,
      template,
      normalizedTemplate: normalizeTemplateForCompare(template),
      projectRef,
      authConfig: config,
      redirectAudit,
      ...checks,
    };
  } catch (error) {
    return {
      available: true,
      configured: true,
      loaded: false,
      errorMessage: String(error?.message || "Unable to read live Supabase template config."),
      projectRef,
    };
  }
}

export const metadata = {
  title: "Admin Settings",
};

export default async function AdminSettingsPage() {
  const { profile, supabase } = await requireUser(["admin"]);
  const pushEnvConfigured = isConfigured(process.env.NEXT_PUBLIC_SITE_URL);
  const publicKeyConfigured = isConfigured(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const serviceKeyConfigured = isConfigured(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabaseUrlConfigured = isConfigured(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const [studentRowsResponse, staffRowsResponse, rosterResponse] = await Promise.all([
    supabase
      .from("schedule_items")
      .select("id, day_number, start_time, duration_minutes, activity_name, visibility")
      .eq("program_year", profile.program_year)
      .in("visibility", ["students", "both"]),
    supabase
      .from("schedule_items")
      .select("id, day_number, start_time, duration_minutes, activity_name, visibility")
      .eq("program_year", profile.program_year)
      .in("visibility", ["staff", "both"]),
    supabase
      .from("user_profiles")
      .select("id, role, is_active")
      .eq("program_year", profile.program_year),
  ]);
  const [templateAudit, liveTemplateAudit] = await Promise.all([
    auditMagicLinkTemplate(),
    auditLiveMagicLinkTemplate(),
  ]);
  const liveTemplateParity =
    templateAudit.loaded &&
    liveTemplateAudit.loaded &&
    templateAudit.normalizedTemplate === liveTemplateAudit.normalizedTemplate;
  const redirectAudit = liveTemplateAudit.redirectAudit || null;
  const liveRedirectRoutesReady = Boolean(
    liveTemplateAudit.loaded && redirectAudit?.hasConfirmRoute && redirectAudit?.hasCallbackRoute,
  );
  const liveSiteUrlAligned = Boolean(liveTemplateAudit.loaded && redirectAudit?.siteUrlMatchesExpected);

  const studentRows = studentRowsResponse.data || [];
  const staffRows = staffRowsResponse.data || [];
  const rosterRows = rosterResponse.data || [];

  const studentConflicts = conflictByDay(studentRows);
  const staffConflicts = conflictByDay(staffRows);
  const studentConflictCount = studentConflicts.reduce((sum, day) => sum + day.pairs.length, 0);
  const staffConflictCount = staffConflicts.reduce((sum, day) => sum + day.pairs.length, 0);
  const studentMissingDays = missingRequiredDays(studentRows, REQUIRED_STUDENT_DAYS);
  const staffMissingDays = missingRequiredDays(staffRows, REQUIRED_STAFF_DAYS);
  const roleCounts = activeRoleCounts(rosterRows);
  const missingRoles = REQUIRED_ROLES.filter((role) => roleCounts[role] === 0);

  const studentDayCoverageReady = !studentRowsResponse.error && studentMissingDays.length === 0;
  const staffDayCoverageReady = !staffRowsResponse.error && staffMissingDays.length === 0;
  const rosterCoverageReady = !rosterResponse.error && missingRoles.length === 0;

  const readinessItems = [
    {
      label: "Supabase URL",
      ready: supabaseUrlConfigured,
      detail: "Required for auth and database requests.",
    },
    {
      label: "Public Supabase Key",
      ready: publicKeyConfigured,
      detail: "Required for user login sessions.",
    },
    {
      label: "Service Role Key",
      ready: serviceKeyConfigured,
      detail: "Required for admin user-management actions.",
    },
    {
      label: "Site URL",
      ready: pushEnvConfigured,
      detail: "Required for magic-link redirects and legal links.",
    },
    {
      label: "Auth Confirm Route",
      ready: true,
      detail: "Enabled at /auth/confirm to reduce cross-browser mobile login failures.",
    },
    {
      label: "Magic-Link Template (Repo) Has OTP Code",
      ready: templateAudit.loaded && templateAudit.containsOtpToken,
      detail: !templateAudit.loaded
        ? `Unable to audit supabase/templates/magic-link.html: ${templateAudit.errorMessage}`
        : templateAudit.containsOtpToken
          ? "Template includes {{ .Token }} so users can sign in by code when links fail in mobile inbox browsers."
          : "Template is missing {{ .Token }}. Add backup code support before launch.",
    },
    {
      label: "Magic-Link Template (Repo) Uses Token-Hash Confirm Link",
      ready: templateAudit.loaded && templateAudit.containsTokenHashRoute,
      detail: !templateAudit.loaded
        ? "Template audit unavailable."
        : templateAudit.containsTokenHashRoute
          ? "Template routes sign-in through /auth/confirm with token_hash."
          : "Template should route through /auth/confirm?token_hash={{ .TokenHash }} for SSR-safe verification.",
    },
    {
      label: "Magic-Link Template (Repo) Avoids Direct ConfirmationURL",
      ready: templateAudit.loaded && !templateAudit.usesDirectConfirmationUrl,
      detail: !templateAudit.loaded
        ? "Template audit unavailable."
        : templateAudit.usesDirectConfirmationUrl
          ? "Template still uses {{ .ConfirmationURL }} directly; this is more fragile with email prefetch/scanners."
          : "Template avoids direct {{ .ConfirmationURL }} link usage.",
    },
    {
      label: "Live Magic-Link Template Access",
      ready: liveTemplateAudit.available && liveTemplateAudit.configured && liveTemplateAudit.loaded,
      required: false,
      detail: !liveTemplateAudit.available
        ? liveTemplateAudit.reason
        : !liveTemplateAudit.loaded
          ? liveTemplateAudit.errorMessage || "Live template audit unavailable."
          : `Live template loaded from project ${liveTemplateAudit.projectRef}.`,
    },
    {
      label: "Live Magic-Link Template Has OTP Code",
      ready: liveTemplateAudit.loaded && liveTemplateAudit.containsOtpToken,
      required: false,
      detail: !liveTemplateAudit.loaded
        ? "Live template audit unavailable."
        : liveTemplateAudit.containsOtpToken
          ? "Live template includes {{ .Token }} backup code."
          : "Live template is missing {{ .Token }} backup code.",
    },
    {
      label: "Live Magic-Link Template Uses Token-Hash Confirm Link",
      ready: liveTemplateAudit.loaded && liveTemplateAudit.containsTokenHashRoute,
      required: false,
      detail: !liveTemplateAudit.loaded
        ? "Live template audit unavailable."
        : liveTemplateAudit.containsTokenHashRoute
          ? "Live template routes through /auth/confirm?token_hash=..."
          : "Live template should route through /auth/confirm?token_hash={{ .TokenHash }}.",
    },
    {
      label: "Repo vs Live Magic-Link Template Parity",
      ready: liveTemplateParity,
      required: false,
      detail:
        !templateAudit.loaded || !liveTemplateAudit.loaded
          ? "Parity check unavailable until both repo and live templates can be read."
          : liveTemplateParity
            ? "Live dashboard template matches repo template baseline."
            : "Live dashboard template differs from repo baseline. Re-paste template before launch.",
    },
    {
      label: "Live Auth Redirect URLs Include Confirm + Callback",
      ready: liveRedirectRoutesReady,
      required: false,
      detail:
        !liveTemplateAudit.loaded
          ? "Live auth redirect audit unavailable."
          : liveRedirectRoutesReady
            ? "Live auth redirect configuration includes both /auth/confirm and /auth/callback."
            : "Add both /auth/confirm and /auth/callback to Supabase Auth URL configuration.",
    },
    {
      label: "Live Site URL Matches Deployment Site URL",
      ready: liveSiteUrlAligned,
      required: false,
      detail:
        !liveTemplateAudit.loaded
          ? "Live site URL audit unavailable."
          : liveSiteUrlAligned
            ? "Live auth Site URL matches NEXT_PUBLIC_SITE_URL."
            : `Live Site URL (${redirectAudit?.siteUrl || "missing"}) differs from NEXT_PUBLIC_SITE_URL.`,
    },
    {
      label: "Student Day Coverage",
      ready: studentDayCoverageReady,
      detail: studentRowsResponse.error
        ? `Unable to read student schedule: ${studentRowsResponse.error.message}`
        : studentMissingDays.length === 0
          ? "All required student days (Saturday-Tuesday) have schedule entries."
          : `Missing student schedule entries for: ${studentMissingDays.map(dayLabel).join(", ")}.`,
    },
    {
      label: "Staff Day Coverage",
      ready: staffDayCoverageReady,
      detail: staffRowsResponse.error
        ? `Unable to read staff schedule: ${staffRowsResponse.error.message}`
        : staffMissingDays.length === 0
          ? "All required staff days (Friday-Tuesday) have schedule entries."
          : `Missing staff schedule entries for: ${staffMissingDays.map(dayLabel).join(", ")}.`,
    },
    {
      label: "Active Roster Coverage",
      ready: rosterCoverageReady,
      detail: rosterResponse.error
        ? `Unable to read roster coverage: ${rosterResponse.error.message}`
        : missingRoles.length === 0
          ? "Active admin, staff, and student users are present for this year."
          : `No active ${missingRoles.join(", ")} users found for this year.`,
    },
    {
      label: "Student Schedule Overlaps",
      ready: studentConflictCount === 0,
      detail:
        studentConflictCount === 0
          ? "No overlap conflicts detected for the active year."
          : `${studentConflictCount} overlap conflict(s) found. Review /admin/schedule.`,
    },
    {
      label: "Staff Schedule Overlaps",
      ready: staffConflictCount === 0,
      detail:
        staffConflictCount === 0
          ? "No overlap conflicts detected for the active year."
          : `${staffConflictCount} overlap conflict(s) found. Review /admin/schedule.`,
    },
  ];
  const requiredItems = readinessItems.filter((item) => item.required !== false);
  const optionalItems = readinessItems.filter((item) => item.required === false);
  const requiredReadyCount = requiredItems.filter((item) => item.ready).length;
  const optionalReadyCount = optionalItems.filter((item) => item.ready).length;
  const allRequiredReady = requiredReadyCount === requiredItems.length;

  return (
    <>
      <section className="card">
        <h2>Launch Readiness Snapshot</h2>
        <p className="muted">
          {requiredReadyCount}/{requiredItems.length} required checks ready ·{" "}
          {optionalReadyCount}/{optionalItems.length} advisory checks ready
        </p>
        <div className="status-grid mt-md">
          {readinessItems.map((item) => (
            <article key={item.label} className="surface surface-pad-sm status-row">
              <div>
                <strong>{item.label}</strong>
                <p className="muted">{item.detail}</p>
              </div>
              <span
                className={`status-pill ${
                  item.ready ? "status-pill-good" : item.required === false ? "status-pill-note" : "status-pill-warn"
                }`}
              >
                {item.ready ? "Ready" : item.required === false ? "Advisory" : "Action Needed"}
              </span>
            </article>
          ))}
        </div>
        <div className="mt-md">
          {allRequiredReady ? (
            <p className="alert alert-success">Environment checks look launch-ready from app config.</p>
          ) : (
            <p className="alert alert-error">
              One or more required launch checks are missing. Resolve those before staff rollout.
            </p>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Program Settings</h2>
        <div className="grid-two">
          <article className="surface surface-pad">
            <strong>Program Year</strong>
            <p>{profile.program_year}</p>
          </article>
          <article className="surface surface-pad">
            <strong>Program Time Zone</strong>
            <p className="muted">All schedules and now snapshots are fixed to Eastern Time (ET).</p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Schedule Day Coverage Audit</h2>
        <p className="muted">
          Required launch baseline: staff has Friday-Tuesday items, and students have Saturday-Tuesday items.
        </p>
        <div className="stack mt-md">
          <article className="surface surface-pad-sm status-row">
            <div>
              <strong>Student Track Days</strong>
              <p className="muted">
                {studentRowsResponse.error
                  ? studentRowsResponse.error.message
                  : studentMissingDays.length === 0
                    ? "All required days are populated."
                    : `Missing: ${studentMissingDays.map(dayLabel).join(", ")}`}
              </p>
              <p className="muted">
                <Link href={`/admin/schedule?track=student&year=${profile.program_year}`} className="text-link">
                  Open student schedule planning
                </Link>
              </p>
            </div>
            <span className={`status-pill ${studentDayCoverageReady ? "status-pill-good" : "status-pill-warn"}`}>
              {studentDayCoverageReady ? "Ready" : "Action Needed"}
            </span>
          </article>
          <article className="surface surface-pad-sm status-row">
            <div>
              <strong>Staff Track Days</strong>
              <p className="muted">
                {staffRowsResponse.error
                  ? staffRowsResponse.error.message
                  : staffMissingDays.length === 0
                    ? "All required days are populated."
                    : `Missing: ${staffMissingDays.map(dayLabel).join(", ")}`}
              </p>
              <p className="muted">
                <Link href={`/admin/schedule?track=staff&year=${profile.program_year}`} className="text-link">
                  Open staff schedule planning
                </Link>
              </p>
            </div>
            <span className={`status-pill ${staffDayCoverageReady ? "status-pill-good" : "status-pill-warn"}`}>
              {staffDayCoverageReady ? "Ready" : "Action Needed"}
            </span>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Roster Coverage Audit</h2>
        <p className="muted">
          Launch readiness requires at least one active admin, staff, and student user in year {profile.program_year}.
        </p>
        {rosterResponse.error ? (
          <p className="alert alert-error mt-md">{rosterResponse.error.message}</p>
        ) : (
          <div className="status-grid mt-md">
            {REQUIRED_ROLES.map((role) => {
              const count = roleCounts[role];
              const roleReady = count > 0;
              return (
                <article key={role} className="surface surface-pad-sm status-row">
                  <div>
                    <strong>{role[0].toUpperCase() + role.slice(1)} Active Users</strong>
                    <p className="muted">{count} active account(s) in this program year.</p>
                    <p className="muted">
                      <Link href={`/admin/users?year=${profile.program_year}`} className="text-link">
                        Open user management
                      </Link>
                    </p>
                  </div>
                  <span className={`status-pill ${roleReady ? "status-pill-good" : "status-pill-warn"}`}>
                    {roleReady ? "Ready" : "Action Needed"}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Schedule Conflict Audit</h2>
        <p className="muted">
          Automatic overlap scan for program year {profile.program_year}. Resolve these before
          launch unless overlap is intentional.
        </p>
        {studentConflictCount === 0 && staffConflictCount === 0 ? (
          <p className="alert alert-success mt-md">No schedule overlaps detected.</p>
        ) : (
          <div className="stack mt-md">
            {studentConflicts.map((entry) => (
              <article className="surface surface-pad-sm" key={`student-${entry.dayNumber}`}>
                <strong>
                  Student · {dayLabel(entry.dayNumber)} · {entry.pairs.length} overlap(s)
                </strong>
                <p className="muted">
                  <Link
                    href={`/admin/schedule?track=student&year=${profile.program_year}&day=${entry.dayNumber}`}
                    className="text-link"
                  >
                    Open day in Schedule Management
                  </Link>
                </p>
              </article>
            ))}
            {staffConflicts.map((entry) => (
              <article className="surface surface-pad-sm" key={`staff-${entry.dayNumber}`}>
                <strong>
                  Staff · {dayLabel(entry.dayNumber)} · {entry.pairs.length} overlap(s)
                </strong>
                <p className="muted">
                  <Link
                    href={`/admin/schedule?track=staff&year=${profile.program_year}&day=${entry.dayNumber}`}
                    className="text-link"
                  >
                    Open day in Schedule Management
                  </Link>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Environment Readiness</h2>
        <div className="grid-two">
          <article className="surface surface-pad">
            <strong>NEXT_PUBLIC_SUPABASE_URL</strong>
            <p>{configured(supabaseUrlConfigured)}</p>
          </article>
          <article className="surface surface-pad">
            <strong>Public Supabase Key</strong>
            <p>{configured(publicKeyConfigured)}</p>
          </article>
          <article className="surface surface-pad">
            <strong>Service Role Key</strong>
            <p>{configured(serviceKeyConfigured)}</p>
          </article>
          <article className="surface surface-pad">
            <strong>NEXT_PUBLIC_SITE_URL</strong>
            <p>{configured(pushEnvConfigured)}</p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Launch Checklist</h2>
        <ol className="launch-checklist">
          <li>Confirm Supabase redirect URLs include `/auth/confirm` and `/auth/callback`.</li>
          <li>
            Confirm Supabase Magic Link template includes both `{"{{ .Token }}"}` and
            token-hash confirm route from `supabase/templates/magic-link.html`.
          </li>
          <li>Disable email-link tracking or Safe-Link rewriting in your email provider.</li>
          <li>Run one admin, one staff, and one student login test on real mobile devices.</li>
          <li>Verify schedule edits and announcements publish successfully from mobile.</li>
        </ol>
      </section>
    </>
  );
}
