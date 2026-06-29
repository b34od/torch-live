import Link from "next/link";
import { requireUser } from "../../lib/auth";
import { dayLabel } from "../../lib/schedule";
import { createAdminSupabaseClient } from "../../lib/supabase/admin";

const REQUIRED_STAFF_DAYS = [0, 1, 2, 3, 4];
const REQUIRED_STUDENT_DAYS = [1, 2, 3, 4];

async function listAllAuthUsers(adminClient) {
  const users = [];
  const perPage = 1000;

  for (let page = 1; page <= 25; page += 1) {
    const listed = await adminClient.auth.admin.listUsers({ page, perPage });
    if (listed.error) {
      throw new Error(listed.error.message);
    }

    const pageUsers = listed.data?.users || [];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }
  }

  return users;
}

function countDistinctDays(rows) {
  return new Set((rows || []).map((row) => Number(row.day_number))).size;
}

function missingRequiredDays(rows, requiredDays) {
  const populated = new Set((rows || []).map((row) => Number(row.day_number)));
  return requiredDays.filter((dayNumber) => !populated.has(dayNumber));
}

function isRecentActivity(timestamp, hours = 24) {
  if (!timestamp) return false;
  const value = new Date(timestamp).getTime();
  if (!Number.isFinite(value)) return false;
  return Date.now() - value <= hours * 60 * 60 * 1000;
}

export const metadata = {
  title: "Admin Overview",
};

export default async function AdminOverviewPage() {
  const { supabase, profile } = await requireUser(["admin"]);

  const [profilesResponse, activityResponse, studentDaysResponse, staffDaysResponse, guildSettingResponse, announcementsResponse] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, role, is_active")
      .eq("program_year", profile.program_year),
    supabase
      .from("user_activity_summary")
      .select("user_id, first_activated_at, last_app_visit_at, app_visit_count, last_path")
      .eq("program_year", profile.program_year),
    supabase
      .from("schedule_items")
      .select("day_number")
      .eq("program_year", profile.program_year)
      .in("visibility", ["students", "both"]),
    supabase
      .from("schedule_items")
      .select("day_number")
      .eq("program_year", profile.program_year)
      .in("visibility", ["staff", "both"]),
    supabase
      .from("program_settings")
      .select("value")
      .eq("program_year", profile.program_year)
      .eq("key", "guild_selection_open")
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("program_year", profile.program_year),
  ]);

  const profiles = (profilesResponse.data || []).filter((entry) => entry.is_active);
  const activityError = activityResponse.error;
  const activityRows = activityResponse.data || [];
  const activityByUserId = new Map(activityRows.map((entry) => [entry.user_id, entry]));
  let authUsersById = new Map();
  let authUsersError = null;

  try {
    const authUsers = await listAllAuthUsers(createAdminSupabaseClient());
    authUsersById = new Map(authUsers.map((entry) => [entry.id, entry]));
  } catch (error) {
    authUsersError = error?.message || "Unable to load auth sign-in metadata.";
  }

  const activatedCount = profiles.filter(
    (entry) =>
      activityByUserId.get(entry.id)?.first_activated_at || authUsersById.get(entry.id)?.last_sign_in_at,
  ).length;
  const pendingCount = Math.max(profiles.length - activatedCount, 0);
  const recentlyActiveCount = profiles.filter((entry) =>
    isRecentActivity(activityByUserId.get(entry.id)?.last_app_visit_at),
  ).length;
  const totalVisits = activityRows.reduce((sum, entry) => sum + Number(entry.app_visit_count || 0), 0);

  const studentRows = studentDaysResponse.data || [];
  const staffRows = staffDaysResponse.data || [];
  const studentMissingDays = missingRequiredDays(studentRows, REQUIRED_STUDENT_DAYS);
  const staffMissingDays = missingRequiredDays(staffRows, REQUIRED_STAFF_DAYS);
  const studentCoverageReady = studentMissingDays.length === 0;
  const staffCoverageReady = staffMissingDays.length === 0;
  const guildSelectionOpen = guildSettingResponse.data?.value === "true";
  const announcementCount = announcementsResponse.count || 0;

  const quickActions = [
    {
      href: `/admin/schedule?track=student&year=${profile.program_year}&day=1`,
      label: "Schedule",
      detail: `${countDistinctDays(studentRows)} student days · ${countDistinctDays(staffRows)} staff days loaded`,
    },
    {
      href: "/admin/announcements",
      label: "Announcements",
      detail: `${announcementCount} announcement${announcementCount === 1 ? "" : "s"} published this year`,
    },
    {
      href: `/admin/users?year=${profile.program_year}`,
      label: "Users",
      detail: `${profiles.length} active account${profiles.length === 1 ? "" : "s"} in ${profile.program_year}`,
    },
    {
      href: "/admin/guilds",
      label: "Guilds",
      detail: guildSelectionOpen ? "Selection window currently open" : "Selection window currently closed",
    },
  ];

  const supportingTools = [
    {
      href: "/admin/resources",
      label: "Resources",
      detail: "Manage handbooks, links, and staff/student resource content.",
    },
    {
      href: `/admin/teams?year=${profile.program_year}`,
      label: "Teams",
      detail: "Check team assignments and unassigned roster gaps.",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      detail: "Review launch readiness, audits, and system-level controls.",
    },
  ];

  const attentionItems = [];
  if (pendingCount > 0) {
    attentionItems.push(`${pendingCount} active account${pendingCount === 1 ? "" : "s"} still have not activated sign-in.`);
  }
  if (!studentCoverageReady) {
    attentionItems.push(`Student schedule missing: ${studentMissingDays.map(dayLabel).join(", ")}.`);
  }
  if (!staffCoverageReady) {
    attentionItems.push(`Staff schedule missing: ${staffMissingDays.map(dayLabel).join(", ")}.`);
  }

  return (
    <>
      <section className="card">
        <h2>Admin Overview</h2>
        <p className="muted">
          Production-week workspace for fast admin actions, cleaner navigation, and adoption visibility for {profile.program_year}.
        </p>
        <div className="admin-quick-grid mt-md">
          {quickActions.map((item) => (
            <Link key={item.href} href={item.href} className="admin-quick-card surface surface-pad">
              <strong>{item.label}</strong>
              <p className="muted">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Engagement Snapshot</h2>
        <p className="muted">
          Activation marks the first successful authenticated sign-in. Visits count once per user after login or after 15 minutes away.
        </p>
        {authUsersError ? <p className="alert alert-warn mt-md">{authUsersError}</p> : null}
        {activityError ? (
          <p className="alert alert-warn mt-md">
            Activity tracking data will populate after the new usage-tracking migration is applied.
          </p>
        ) : null}
        <div className="admin-stat-grid mt-md">
          <article className="surface surface-pad">
            <strong>{activatedCount}</strong>
            <p>Activated</p>
          </article>
          <article className="surface surface-pad">
            <strong>{pendingCount}</strong>
            <p>Pending activation</p>
          </article>
          <article className="surface surface-pad">
            <strong>{recentlyActiveCount}</strong>
            <p>Active in last 24h</p>
          </article>
          <article className="surface surface-pad">
            <strong>{totalVisits}</strong>
            <p>Total tracked visits</p>
          </article>
        </div>
        <p className="muted mt-md">
          Need the per-person breakdown?{" "}
          <Link href={`/admin/users?year=${profile.program_year}`} className="text-link">
            Open Users
          </Link>
          .
        </p>
      </section>

      <section className="card">
        <h2>Readiness Counters</h2>
        <div className="status-grid mt-md">
          <article className="surface surface-pad-sm status-row">
            <div>
              <strong>Student Schedule Coverage</strong>
              <p className="muted">
                {studentCoverageReady
                  ? "Saturday through Tuesday are loaded."
                  : `Missing: ${studentMissingDays.map(dayLabel).join(", ")}`}
              </p>
            </div>
            <span className={`status-pill ${studentCoverageReady ? "status-pill-good" : "status-pill-warn"}`}>
              {studentCoverageReady ? "Ready" : "Action Needed"}
            </span>
          </article>
          <article className="surface surface-pad-sm status-row">
            <div>
              <strong>Staff Schedule Coverage</strong>
              <p className="muted">
                {staffCoverageReady
                  ? "Friday through Tuesday are loaded."
                  : `Missing: ${staffMissingDays.map(dayLabel).join(", ")}`}
              </p>
            </div>
            <span className={`status-pill ${staffCoverageReady ? "status-pill-good" : "status-pill-warn"}`}>
              {staffCoverageReady ? "Ready" : "Action Needed"}
            </span>
          </article>
          <article className="surface surface-pad-sm status-row">
            <div>
              <strong>Guild Selection</strong>
              <p className="muted">
                {guildSelectionOpen
                  ? "Students can currently submit or update preferences."
                  : "Students can view guild info, but submissions are closed."}
              </p>
            </div>
            <span className={`status-pill ${guildSelectionOpen ? "status-pill-good" : "status-pill-note"}`}>
              {guildSelectionOpen ? "Open" : "Closed"}
            </span>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Supporting Tools</h2>
        <div className="admin-support-grid mt-md">
          {supportingTools.map((item) => (
            <Link key={item.href} href={item.href} className="admin-support-card surface surface-pad-sm">
              <strong>{item.label}</strong>
              <p className="muted">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Attention</h2>
        {attentionItems.length === 0 ? (
          <p className="alert alert-success mt-md">No immediate readiness blockers surfaced from the overview snapshot.</p>
        ) : (
          <div className="stack mt-md">
            {attentionItems.map((item) => (
              <p key={item} className="alert alert-warn">{item}</p>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
