import Link from "next/link";
import { requireUser } from "../../../lib/auth";
import { dayLabel, timeToMinutes } from "../../../lib/schedule";

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
    const aStart = timeToMinutes(a.start_time) || 0;
    const bStart = timeToMinutes(b.start_time) || 0;
    return aStart - bStart;
  });

  const overlaps = [];
  const active = [];

  sorted.forEach((item) => {
    const start = timeToMinutes(item.start_time) || 0;
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
      .from("student_schedule_items")
      .select("id, day_number, start_time, duration_minutes, activity_name")
      .eq("program_year", profile.program_year),
    supabase
      .from("staff_schedule_items")
      .select("id, day_number, start_time, duration_minutes, activity_name")
      .eq("program_year", profile.program_year),
    supabase
      .from("user_profiles")
      .select("id, role, is_active")
      .eq("program_year", profile.program_year),
  ]);

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
  const readyCount = readinessItems.filter((item) => item.ready).length;
  const allReady = readyCount === readinessItems.length;

  return (
    <>
      <section className="card">
        <h2>Launch Readiness Snapshot</h2>
        <p className="muted">
          {readyCount}/{readinessItems.length} critical technical checks are ready.
        </p>
        <div className="status-grid mt-md">
          {readinessItems.map((item) => (
            <article key={item.label} className="surface surface-pad-sm status-row">
              <div>
                <strong>{item.label}</strong>
                <p className="muted">{item.detail}</p>
              </div>
              <span className={`status-pill ${item.ready ? "status-pill-good" : "status-pill-warn"}`}>
                {item.ready ? "Ready" : "Action Needed"}
              </span>
            </article>
          ))}
        </div>
        <div className="mt-md">
          {allReady ? (
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
            <strong>Rain Plan Toggle</strong>
            <p className="muted">Data model is ready; UI toggle wiring is next.</p>
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
          <li>Confirm Magic Link template uses token-hash confirm link from `supabase/templates/magic-link.html`.</li>
          <li>Run one admin, one staff, and one student login test on real mobile devices.</li>
          <li>Verify schedule edits and announcements publish successfully from mobile.</li>
        </ol>
      </section>
    </>
  );
}
