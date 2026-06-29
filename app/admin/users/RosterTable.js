"use client";

import { useState } from "react";

const ROLE_ORDER = { admin: 0, staff: 1, student: 2 };
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function rolePillClass(role) {
  if (role === "admin") return "pill-admin";
  if (role === "staff") return "pill-staff";
  return "pill-student";
}

function buildEditUrl(year, id) {
  return `/admin/users?year=${year}&edit=${id}`;
}

function SortTh({ col, label, sortCol, sortDir, onSort }) {
  const active = sortCol === col;
  return (
    <th onClick={() => onSort(col)} className="roster-th-sort">
      {label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
}

function hasActivated(profile) {
  return Boolean(profile.first_activated_at || profile.last_sign_in_at);
}

function toTimestamp(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRecentWithinHours(value, hours) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return false;
  return Date.now() - timestamp <= hours * 60 * 60 * 1000;
}

function formatShortDate(value) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return "Never";
  return SHORT_DATE_FORMATTER.format(new Date(timestamp));
}

function formatRelative(value) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return "Never";

  const diffMinutes = Math.max(Math.round((Date.now() - timestamp) / 60000), 0);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatShortDate(value);
}

function matchesRecentFilter(entry, filterRecent) {
  if (filterRecent === "all") return true;
  if (filterRecent === "never") return !entry.last_app_visit_at;
  if (filterRecent === "24h") return isRecentWithinHours(entry.last_app_visit_at, 24);
  if (filterRecent === "7d") return isRecentWithinHours(entry.last_app_visit_at, 24 * 7);
  return true;
}

function activitySortValue(entry) {
  return (
    toTimestamp(entry.last_app_visit_at) ||
    toTimestamp(entry.last_sign_in_at) ||
    toTimestamp(entry.first_activated_at)
  );
}

function renderActivity(entry) {
  const activated = hasActivated(entry);
  const loginText = entry.last_sign_in_at ? formatShortDate(entry.last_sign_in_at) : "Never";
  const visitText = entry.last_app_visit_at ? formatRelative(entry.last_app_visit_at) : "Never";
  const visitCount = Number(entry.app_visit_count || 0);

  return (
    <div className="roster-activity" title={entry.last_path || ""}>
      <div className="roster-activity-head">
        <span className={`status-pill ${activated ? "status-pill-good" : "status-pill-note"}`}>
          {activated ? `Activated ${formatShortDate(entry.first_activated_at || entry.last_sign_in_at)}` : "Pending"}
        </span>
      </div>
      <div className="roster-activity-meta">
        Login {loginText} · Seen {visitText} · {visitCount} visit{visitCount === 1 ? "" : "s"}
      </div>
      {entry.last_path ? (
        <div className="roster-activity-path muted">
          Last path: <code>{entry.last_path}</code>
        </div>
      ) : null}
    </div>
  );
}

function renderDirectoryStatus(entry) {
  return (
    <span
      className={`status-pill ${entry.show_in_directory === false ? "status-pill-note" : "status-pill-good"}`}
    >
      {entry.show_in_directory === false ? "Hidden" : "Visible"}
    </span>
  );
}

export default function RosterTable({ profiles, selectedYear, onToggle, onToggleDirectory, onRemove }) {
  const [sortCol, setSortCol] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterGuild, setFilterGuild] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [filterActivation, setFilterActivation] = useState("all");
  const [filterRecent, setFilterRecent] = useState("all");

  const teamOptions = [...new Set(profiles.map((p) => p.team_key).filter(Boolean))].sort();
  const guildOptions = [...new Set(profiles.map((p) => p.guild_name).filter(Boolean))].sort();

  function handleSort(col) {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function getValue(p, col) {
    if (col === "role") return ROLE_ORDER[p.role] ?? 9;
    if (col === "is_active") return p.is_active ? 0 : 1;
    if (col === "show_in_directory") return p.show_in_directory === false ? 1 : 0;
    if (col === "activity") return activitySortValue(p);
    return String(p[col] ?? "").toLowerCase();
  }

  let rows = [...profiles];

  if (filterRole !== "all") rows = rows.filter((p) => p.role === filterRole);
  if (filterTeam !== "all") rows = rows.filter((p) => p.team_key === filterTeam);
  if (filterGuild !== "all") rows = rows.filter((p) => p.guild_name === filterGuild);
  if (filterActive !== "all") rows = rows.filter((p) => String(p.is_active) === filterActive);
  if (filterActivation !== "all") {
    rows = rows.filter((p) => (filterActivation === "activated" ? hasActivated(p) : !hasActivated(p)));
  }
  rows = rows.filter((p) => matchesRecentFilter(p, filterRecent));

  rows.sort((a, b) => {
    const av = getValue(a, sortCol);
    const bv = getValue(b, sortCol);
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const shProps = { sortCol, sortDir, onSort: handleSort };

  return (
    <div>
      <div className="roster-filters">
        <select className="select select-sm" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="staff">Staff</option>
          <option value="admin">Admins</option>
        </select>
        <select className="select select-sm" value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
          <option value="all">All Teams</option>
          {teamOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="select select-sm" value={filterGuild} onChange={(e) => setFilterGuild(e.target.value)}>
          <option value="all">All Guilds</option>
          {guildOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select className="select select-sm" value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select className="select select-sm" value={filterActivation} onChange={(e) => setFilterActivation(e.target.value)}>
          <option value="all">All Activation</option>
          <option value="activated">Activated</option>
          <option value="pending">Pending</option>
        </select>
        <select className="select select-sm" value={filterRecent} onChange={(e) => setFilterRecent(e.target.value)}>
          <option value="all">Any Recent Activity</option>
          <option value="24h">Seen in 24h</option>
          <option value="7d">Seen in 7d</option>
          <option value="never">No tracked visits</option>
        </select>
        <span className="muted">
          {rows.length === profiles.length
            ? `${profiles.length} users`
            : `${rows.length} of ${profiles.length}`}
        </span>
      </div>

      <div className="roster-card-list">
        {rows.map((entry) => (
          <article key={`card-${entry.id}`} className="surface surface-pad roster-card">
            <div className="roster-card-head">
              <div>
                <div className="roster-name">{entry.full_name}</div>
                <div className="roster-email">{entry.email}</div>
                {entry.room_number ? <div className="roster-subtle">Room: {entry.room_number}</div> : null}
              </div>
              <div className="roster-card-pill-stack">
                <span className={`pill ${rolePillClass(entry.role)}`}>{entry.role}</span>
                <span className={`status-pill ${entry.is_active ? "status-pill-good" : "status-pill-warn"}`}>
                  {entry.is_active ? "Active" : "Inactive"}
                </span>
                {renderDirectoryStatus(entry)}
              </div>
            </div>
            <div className="roster-card-meta">
              <span><span className="schedule-label">Team:</span> {entry.team_key || "—"}</span>
              <span><span className="schedule-label">Guild:</span> {entry.guild_name || "—"}</span>
            </div>
            <div className="mt-sm">{renderActivity(entry)}</div>
            <div className="roster-row-actions mt-sm">
              <a
                href={buildEditUrl(selectedYear, entry.id)}
                className="schedule-table-action schedule-table-action-edit"
              >
                Edit
              </a>
              <form action={onToggle}>
                <input type="hidden" name="id" value={entry.id} />
                <input type="hidden" name="year" value={selectedYear} />
                <input type="hidden" name="next_active" value={entry.is_active ? "0" : "1"} />
                <button type="submit" className="schedule-table-action">
                  {entry.is_active ? "Deactivate" : "Activate"}
                </button>
              </form>
              <form action={onToggleDirectory}>
                <input type="hidden" name="id" value={entry.id} />
                <input type="hidden" name="year" value={selectedYear} />
                <input
                  type="hidden"
                  name="next_visible"
                  value={entry.show_in_directory === false ? "1" : "0"}
                />
                <button type="submit" className="schedule-table-action">
                  {entry.show_in_directory === false ? "Show Dir" : "Hide Dir"}
                </button>
              </form>
              <form action={onRemove}>
                <input type="hidden" name="id" value={entry.id} />
                <input type="hidden" name="year" value={selectedYear} />
                <button type="submit" className="schedule-table-action schedule-table-action-remove">
                  Remove
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>

      <div className="table-wrap roster-table-wrap">
        <table className="schedule-table roster-table">
          <thead>
            <tr>
              <SortTh col="full_name" label="Name" {...shProps} />
              <SortTh col="email" label="Email" {...shProps} />
              <SortTh col="role" label="Role" {...shProps} />
              <SortTh col="is_active" label="Status" {...shProps} />
              <SortTh col="team_key" label="Team" {...shProps} />
              <SortTh col="guild_name" label="Guild" {...shProps} />
              <SortTh col="show_in_directory" label="Directory" {...shProps} />
              <SortTh col="activity" label="Activity" {...shProps} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id} className={entry.is_active ? "" : "roster-row-inactive"}>
                <td>
                  <div className="roster-name">{entry.full_name}</div>
                  {entry.room_number ? <div className="roster-subtle">Room: {entry.room_number}</div> : null}
                </td>
                <td className="roster-email">{entry.email}</td>
                <td><span className={`pill ${rolePillClass(entry.role)}`}>{entry.role}</span></td>
                <td>
                  <span className={`status-pill ${entry.is_active ? "status-pill-good" : "status-pill-warn"}`}>
                    {entry.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{entry.team_key || <span className="muted">—</span>}</td>
                <td>{entry.guild_name || <span className="muted">—</span>}</td>
                <td>{renderDirectoryStatus(entry)}</td>
                <td>{renderActivity(entry)}</td>
                <td>
                  <div className="roster-row-actions">
                    <a
                      href={buildEditUrl(selectedYear, entry.id)}
                      className="schedule-table-action schedule-table-action-edit"
                    >
                      Edit
                    </a>
                    <form action={onToggle}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="year" value={selectedYear} />
                      <input type="hidden" name="next_active" value={entry.is_active ? "0" : "1"} />
                      <button type="submit" className="schedule-table-action">
                        {entry.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={onToggleDirectory}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="year" value={selectedYear} />
                      <input
                        type="hidden"
                        name="next_visible"
                        value={entry.show_in_directory === false ? "1" : "0"}
                      />
                      <button type="submit" className="schedule-table-action">
                        {entry.show_in_directory === false ? "Show Dir" : "Hide Dir"}
                      </button>
                    </form>
                    <form action={onRemove}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="year" value={selectedYear} />
                      <button type="submit" className="schedule-table-action schedule-table-action-remove">
                        Remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
