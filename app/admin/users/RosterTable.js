"use client";

import { useState } from "react";

const ROLE_ORDER = { admin: 0, staff: 1, student: 2 };

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

export default function RosterTable({ profiles, selectedYear, onToggle, onRemove }) {
  const [sortCol, setSortCol] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterGuild, setFilterGuild] = useState("all");
  const [filterActive, setFilterActive] = useState("all");

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
    return String(p[col] ?? "").toLowerCase();
  }

  let rows = [...profiles];

  if (filterRole !== "all") rows = rows.filter((p) => p.role === filterRole);
  if (filterTeam !== "all") rows = rows.filter((p) => p.team_key === filterTeam);
  if (filterGuild !== "all") rows = rows.filter((p) => p.guild_name === filterGuild);
  if (filterActive !== "all") rows = rows.filter((p) => String(p.is_active) === filterActive);

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
        <span className="muted">
          {rows.length === profiles.length
            ? `${profiles.length} users`
            : `${rows.length} of ${profiles.length}`}
        </span>
      </div>

      <div className="table-wrap">
        <table className="schedule-table roster-table">
          <thead>
            <tr>
              <SortTh col="full_name" label="Name" {...shProps} />
              <SortTh col="email" label="Email" {...shProps} />
              <SortTh col="role" label="Role" {...shProps} />
              <SortTh col="is_active" label="Status" {...shProps} />
              <SortTh col="team_key" label="Team" {...shProps} />
              <SortTh col="guild_name" label="Guild" {...shProps} />
              <SortTh col="room_number" label="Room" {...shProps} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id} className={entry.is_active ? "" : "roster-row-inactive"}>
                <td className="roster-name">{entry.full_name}</td>
                <td className="roster-email">{entry.email}</td>
                <td><span className={`pill ${rolePillClass(entry.role)}`}>{entry.role}</span></td>
                <td>
                  <span className={`status-pill ${entry.is_active ? "status-pill-good" : "status-pill-warn"}`}>
                    {entry.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{entry.team_key || <span className="muted">—</span>}</td>
                <td>{entry.guild_name || <span className="muted">—</span>}</td>
                <td>{entry.room_number || <span className="muted">—</span>}</td>
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
