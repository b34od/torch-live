"use client";

import { useState } from "react";

const ROLE_ORDER = { admin: 0, staff: 1, student: 2 };

function rolePillClass(role) {
  if (role === "admin") return "pill-admin";
  if (role === "staff") return "pill-staff";
  return "pill-student";
}

export default function DirectoryList({ profiles, showRoom, showSocial = true }) {
  const [sortCol, setSortCol] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterGuild, setFilterGuild] = useState("all");
  const [search, setSearch] = useState("");

  const teamOptions = [...new Set(profiles.map((p) => p.team_key).filter(Boolean))].sort();
  const guildOptions = [...new Set(profiles.map((p) => p.guild_name).filter(Boolean))].sort();
  const hasSpecialty = profiles.some((p) => p.specialty_tag);

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
    if (filterRole !== "all" && p.role !== filterRole) return false;
    if (filterTeam !== "all" && p.team_key !== filterTeam) return false;
    if (filterGuild !== "all" && p.guild_name !== filterGuild) return false;
    if (q && !p.full_name.toLowerCase().includes(q)) return false;
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

  function renderName(p) {
    const content = (
      <>
        {p.full_name}
        {p.pronouns ? <span className="user-card-pronouns"> ({p.pronouns})</span> : null}
      </>
    );

    if (!p.linkedin_url) {
      return content;
    }

    return (
      <a
        href={p.linkedin_url}
        target="_blank"
        rel="noreferrer noopener"
        className="user-card-name-link"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="mt-md">
      <div className="roster-filters">
        <input
          type="search"
          className="input input-sm"
          placeholder="Search name…"
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
                <p className="user-card-name">{renderName(p)}</p>
                {(p.cotl_color || p.superpower) ? (
                  <p className="user-card-badges">
                    {p.cotl_color ? <span className={`pill pill-cotl-${p.cotl_color}`}>{p.cotl_color}</span> : null}
                    {p.superpower ? <span className="pill pill-superpower">{p.superpower}</span> : null}
                  </p>
                ) : null}
                {showSocial && p.social_handle ? <p className="muted">{p.social_handle}</p> : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                <span className={`pill ${rolePillClass(p.role)}`}>{p.role}</span>
                {p.specialty_tag ? <span className="pill pill-specialty">{p.specialty_tag}</span> : null}
              </div>
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
              <SortTh col="role" label="Role" />
              {hasSpecialty ? <th>Specialty</th> : null}
              <SortTh col="team_key" label="Team" />
              <SortTh col="guild_name" label="Guild" />
              {showRoom ? <SortTh col="room_number" label="Room" /> : null}
              {showSocial ? <th>Social</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  {renderName(p)}
                  {(p.cotl_color || p.superpower) ? (
                    <span className="user-card-badges">
                      {p.cotl_color ? <span className={`pill pill-cotl-${p.cotl_color}`}>{p.cotl_color}</span> : null}
                      {p.superpower ? <span className="pill pill-superpower">{p.superpower}</span> : null}
                    </span>
                  ) : null}
                </td>
                <td><span className={`pill ${rolePillClass(p.role)}`}>{p.role}</span></td>
                {hasSpecialty ? <td>{p.specialty_tag ? <span className="pill pill-specialty">{p.specialty_tag}</span> : <span className="muted">—</span>}</td> : null}
                <td>{p.team_key || <span className="muted">—</span>}</td>
                <td>{p.guild_name || <span className="muted">—</span>}</td>
                {showRoom ? <td>{p.room_number || <span className="muted">—</span>}</td> : null}
                {showSocial ? <td>{p.social_handle || <span className="muted">—</span>}</td> : null}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3 + (hasSpecialty ? 1 : 0) + (showRoom ? 1 : 0) + (showSocial ? 1 : 0) + 1} className="empty">No matches.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
