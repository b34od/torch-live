import { requireUser } from "../../../lib/auth";
import { getUserProfiles } from "../../../lib/data";

export const metadata = {
  title: "Admin Teams",
};

function rolePillClass(role) {
  if (role === "admin") return "pill-admin";
  if (role === "staff") return "pill-staff";
  return "pill-student";
}

export default async function AdminTeamsPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const { supabase, profile } = await requireUser(["admin"]);

  const year = Number.parseInt(String(params?.year || profile.program_year), 10);
  const { data: profiles, error } = await getUserProfiles(supabase, year);

  // Group active profiles by team_key; unassigned goes to a separate bucket.
  const teamMap = new Map();
  const unassigned = [];

  for (const p of profiles.filter((p) => p.is_active)) {
    if (!p.team_key) {
      unassigned.push(p);
    } else {
      if (!teamMap.has(p.team_key)) teamMap.set(p.team_key, []);
      teamMap.get(p.team_key).push(p);
    }
  }

  // Sort team keys numerically where possible, then alphabetically.
  const sortedKeys = [...teamMap.keys()].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const totalStudents = profiles.filter((p) => p.is_active && p.role === "student").length;
  const totalStaff = profiles.filter((p) => p.is_active && p.role !== "student").length;

  return (
    <section className="card">
      <h2>Teams — {year}</h2>
      <p className="muted">
        Read-only roster grouped by team. Assign team numbers in{" "}
        <a href="/admin/users" className="text-link">Users</a>.{" "}
        {sortedKeys.length} team{sortedKeys.length !== 1 ? "s" : ""} · {totalStudents} students · {totalStaff} staff
      </p>

      {error ? (
        <p className="alert alert-error mt-md">{error.message}</p>
      ) : sortedKeys.length === 0 && unassigned.length === 0 ? (
        <p className="empty mt-md">No active profiles for {year}.</p>
      ) : (
        <div className="team-roster-grid mt-md">
          {sortedKeys.map((key) => {
            const members = teamMap.get(key);
            const staff = members.filter((m) => m.role !== "student");
            const students = members.filter((m) => m.role === "student");
            return (
              <article key={key} className="team-roster-card">
                <h3 className="team-roster-title">Team {key}</h3>
                <p className="team-roster-counts muted">
                  {staff.length} staff · {students.length} student{students.length !== 1 ? "s" : ""}
                </p>
                {staff.length > 0 && (
                  <div className="team-roster-section">
                    <p className="team-roster-role-label">Staff</p>
                    <ul className="team-roster-list">
                      {staff.map((m) => (
                        <li key={m.id} className="team-roster-member">
                          <span className={`pill ${rolePillClass(m.role)}`}>{m.role}</span>
                          {m.full_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {students.length > 0 && (
                  <div className="team-roster-section">
                    <p className="team-roster-role-label">Students</p>
                    <ul className="team-roster-list">
                      {students.map((m) => (
                        <li key={m.id} className="team-roster-member">
                          <span className={`pill ${rolePillClass(m.role)}`}>{m.role}</span>
                          {m.full_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}

          {unassigned.length > 0 && (
            <article className="team-roster-card team-roster-card-unassigned">
              <h3 className="team-roster-title">Unassigned</h3>
              <p className="team-roster-counts muted">{unassigned.length} profile{unassigned.length !== 1 ? "s" : ""}</p>
              <ul className="team-roster-list mt-sm">
                {unassigned.map((m) => (
                  <li key={m.id} className="team-roster-member">
                    <span className={`pill ${rolePillClass(m.role)}`}>{m.role}</span>
                    {m.full_name}
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      )}
    </section>
  );
}
