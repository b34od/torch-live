"use client";

import { useState } from "react";

const ROLE_ORDER = { admin: 0, staff: 1, student: 2 };

function rolePillClass(role) {
  if (role === "admin") return "pill-admin";
  if (role === "staff") return "pill-staff";
  return "pill-student";
}

export default function DirectoryList({ profiles, showRoom }) {
  const [sortCol, setSortCol] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterGuild, setFilterGuild] = useState("all");
  const [search, setSearch] = useState("");

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
    return String(p[col] ?? "").toLowerCase();
  }

  const q = search.trim().toLowerCase();
  let rows = profiles.filter((p) => {
    const email = String(p.email || "").toLowerCase();
    if (filterRole !== "all" && p.role !== filterRole) return false;
    if (filterTeam !== "all" && p.team_key !== filterTeam) return false;
    if (filterGuild !== "all" && p.guild_name !== filterGuild) return false;
    if (q && !p.full_name.toLowerCase().includes(q) && !email.includes(q)) {
      return false;
    }
    return true;
  });

  rows = [...rows].sort((a, b) => {
    const av = getValue(a, sortCol);
    const bv = getValue(b, sortCol);
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function SortTh({ col, label }) {
    const active = sortCol === col;
    return (
      <th onClick={() => handleSort(col)} className="roster-th-sort">
        {label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  return (
    <div className="mt-md">
      <div className="roster-filters">
        <input
          type="search"
          className="input input-sm"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select select-sm" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="staff">Staff</option>
          <option value="admin">Admins</option>
        </select>
        <select className="select select-sm" value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
          <option value="all">All Teams</option>
          {teamOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="select select-sm" value={filterGuild} onChange={(e) => setFilterGuild(e.target.value)}>
          <option value="all">All Guilds</option>
          {guildOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="muted">
          {rows.length === profiles.length ? `${profiles.length}` : `${rows.length} of ${profiles.length}`}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only stack mt-md">
        {rows.map((p) => (
          <article key={p.id} className="surface surface-pad">
            <div className="user-card-header">
              <div>
                <p className="user-card-name">{p.full_name}</p>
                {p.email ? (
                  <a href={`mailto:${p.email}`} className="user-card-email text-link">{p.email}</a>
                ) : null}
                {p.phone_number ? <p className="muted">{p.phone_number}</p> : null}
                {p.social_handle ? <p className="muted">{p.social_handle}</p> : null}
              </div>
              <span className={`pill ${rolePillClass(p.role)}`}>{p.role}</span>
            </div>
            <p className="user-card-meta">
              {p.team_key ? <><span className="schedule-label">Team:</span> {p.team_key} &nbsp;</> : null}
              {p.guild_name ? <><span className="schedule-label">Guild:</span> {p.guild_name}</> : null}
            </p>
            {showRoom && p.room_number ? (
              <p className="user-card-meta">
                <span className="schedule-label">Room:</span> {p.room_number}
              </p>
            ) : null}
          </article>
        ))}
        {rows.length === 0 ? <p className="empty">No matches.</p> : null}
      </div>

      {/* Desktop table */}
      <div className="desktop-only table-wrap mt-md">
        <table className="schedule-table">
          <thead>
            <tr>
              <SortTh col="full_name" label="Name" />
              <SortTh col="email" label="Email" />
              <SortTh col="role" label="Role" />
              <SortTh col="team_key" label="Team" />
              <SortTh col="guild_name" label="Guild" />
              {showRoom ? <SortTh col="room_number" label="Room" /> : null}
              <th>Phone</th>
              <th>Social</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>
                  {p.email
                    ? <a href={`mailto:${p.email}`} className="text-link">{p.email}</a>
                    : <span className="muted">—</span>}
                </td>
                <td><span className={`pill ${rolePillClass(p.role)}`}>{p.role}</span></td>
                <td>{p.team_key || <span className="muted">—</span>}</td>
                <td>{p.guild_name || <span className="muted">—</span>}</td>
                {showRoom ? <td>{p.room_number || <span className="muted">—</span>}</td> : null}
                <td>{p.phone_number || <span className="muted">—</span>}</td>
                <td>{p.social_handle || <span className="muted">—</span>}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showRoom ? 8 : 7} className="empty">No matches.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
