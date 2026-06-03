"use client";

import { useState, useTransition } from "react";

export default function GuildAssignBoard({ rows, guilds, counts, totalStudents }) {
  const [assignments, setAssignments] = useState(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.assigned_guild_id) map.set(r.id, r.assigned_guild_id);
    });
    return map;
  });
  const [saving, setSaving] = useState(null); // student id currently saving
  const [errors, setErrors] = useState(new Map());
  const [, startTransition] = useTransition();

  const target = totalStudents > 0 ? Math.ceil(totalStudents / guilds.length) : "—";

  const liveCounts = new Map(guilds.map((g) => [g.id, 0]));
  assignments.forEach((guildId) => {
    if (guildId) liveCounts.set(guildId, (liveCounts.get(guildId) || 0) + 1);
  });

  async function assign(studentId, guildId) {
    setSaving(studentId);
    setErrors((prev) => { const m = new Map(prev); m.delete(studentId); return m; });
    try {
      const res = await fetch("/api/guild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, guildId: guildId || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors((prev) => new Map(prev).set(studentId, data.error || "Error"));
      } else {
        startTransition(() => {
          setAssignments((prev) => {
            const m = new Map(prev);
            if (guildId) m.set(studentId, guildId);
            else m.delete(studentId);
            return m;
          });
        });
      }
    } catch {
      setErrors((prev) => new Map(prev).set(studentId, "Network error"));
    } finally {
      setSaving(null);
    }
  }

  const teamGroups = new Map();
  rows.forEach((r) => {
    const key = r.team_key || "—";
    if (!teamGroups.has(key)) teamGroups.set(key, []);
    teamGroups.get(key).push(r);
  });
  const sortedTeams = [...teamGroups.keys()].sort((a, b) => {
    if (a === "—") return 1;
    if (b === "—") return -1;
    return Number(a) - Number(b);
  });

  const assignedCount = [...assignments.values()].filter(Boolean).length;

  return (
    <div className="guild-board-wrap">
      {/* Balance sidebar */}
      <div className="guild-balance-bar">
        <p className="guild-balance-title">Guild Balance</p>
        <p className="muted" style={{ fontSize: "0.75rem", margin: "0 0 0.5rem" }}>
          {assignedCount} of {totalStudents} assigned · target ~{target} each
        </p>
        {guilds.map((g) => {
          const count = liveCounts.get(g.id) || 0;
          const over = target !== "—" && count > target;
          return (
            <div key={g.id} className="guild-balance-row">
              <span className="guild-balance-name">{g.name}</span>
              <span className={`guild-balance-count${over ? " guild-balance-over" : ""}`}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Assignment table */}
      <div className="guild-board-table-wrap">
        {rows.length === 0 ? (
          <p className="empty mt-md">No students yet — check back after roster import.</p>
        ) : (
          sortedTeams.map((teamKey) => (
            <div key={teamKey} className="guild-board-team-section">
              <h4 className="guild-board-team-header">Team {teamKey}</h4>
              <table className="schedule-table guild-board-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>1st</th>
                    <th>2nd</th>
                    <th>3rd</th>
                    <th>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {teamGroups.get(teamKey).map((student) => {
                    const isSaving = saving === student.id;
                    const err = errors.get(student.id);
                    const assignedId = assignments.get(student.id) || "";
                    return (
                      <tr key={student.id} className={isSaving ? "guild-board-row-saving" : ""}>
                        <td>{student.full_name}</td>
                        <td>{student.rank_1_name || <span className="muted">—</span>}</td>
                        <td>{student.rank_2_name || <span className="muted">—</span>}</td>
                        <td>{student.rank_3_name || <span className="muted">—</span>}</td>
                        <td>
                          <select
                            className="select select-sm"
                            value={assignedId}
                            disabled={isSaving}
                            onChange={(e) => assign(student.id, e.target.value)}
                          >
                            <option value="">— unassigned —</option>
                            {guilds.map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                          {err ? <p className="muted" style={{ color: "#c44", fontSize: "0.72rem", margin: "0.1rem 0 0" }}>{err}</p> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
