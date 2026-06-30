"use client";

import { useState, useTransition } from "react";

const SIMULATION_RUNS = 60;
const MAX_PER_GUILD = 2;

function teamSortValue(teamKey) {
  if (!teamKey || teamKey === "—") return Number.POSITIVE_INFINITY;
  const parsed = Number.parseInt(String(teamKey).replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function scoreForGuild(row, guildId) {
  if (row.rank_1_id === guildId) return 3;
  if (row.rank_2_id === guildId) return 2;
  if (row.rank_3_id === guildId) return 1;
  return 0;
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function sortedTeamsFromRows(rows) {
  return [...new Set(rows.map((row) => row.team_key || "—"))].sort((a, b) => {
    const aValue = teamSortValue(a);
    const bValue = teamSortValue(b);
    if (aValue !== bValue) return aValue - bValue;
    return String(a).localeCompare(String(b));
  });
}

function buildTeamGroups(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.team_key || "—";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return groups;
}

function chooseCandidateForGuild(candidates, guildId, counts, randomize = false) {
  const pool = randomize ? shuffle(candidates) : [...candidates];
  pool.sort((left, right) => {
    const scoreDelta = scoreForGuild(right, guildId) - scoreForGuild(left, guildId);
    if (scoreDelta !== 0) return scoreDelta;
    return left.full_name.localeCompare(right.full_name);
  });
  return pool[0] || null;
}

function bestGuildForStudent(row, guildIds, counts, allowOverflow = false, randomize = false) {
  const pool = randomize ? shuffle(guildIds) : [...guildIds];
  let best = null;

  pool.forEach((guildId) => {
    const currentCount = counts.get(guildId) || 0;
    if (!allowOverflow && currentCount >= MAX_PER_GUILD) return;
    const score = scoreForGuild(row, guildId);
    const underfilledBonus = currentCount === 0 ? 2 : currentCount === 1 ? 1 : 0;
    const value = score * 10 + underfilledBonus - currentCount;
    if (
      !best ||
      value > best.value ||
      (value === best.value && currentCount < best.currentCount)
    ) {
      best = { guildId, value, currentCount, score };
    }
  });

  return best;
}

function buildSuggestionPlan(rows, guilds, options = {}) {
  const randomize = Boolean(options.randomize);
  const teamGroups = buildTeamGroups(rows);
  const sortedTeams = sortedTeamsFromRows(rows);
  const guildIds = guilds.map((guild) => guild.id);
  const suggestions = new Map();
  const exceptions = [];
  const teamSummaries = [];

  sortedTeams.forEach((teamKey) => {
    const teamRows = randomize ? shuffle(teamGroups.get(teamKey) || []) : [...(teamGroups.get(teamKey) || [])];
    const counts = new Map(guildIds.map((guildId) => [guildId, 0]));
    const remaining = new Map(teamRows.map((row) => [row.id, row]));
    const requiredCoverage = Math.min(guildIds.length, teamRows.length);
    const preferenceScarcity = new Map(
      guildIds.map((guildId) => [
        guildId,
        teamRows.filter((row) => scoreForGuild(row, guildId) > 0).length,
      ]),
    );
    const orderedGuilds = [...guilds].sort((left, right) => {
      const scarcityDelta =
        (preferenceScarcity.get(left.id) || 0) - (preferenceScarcity.get(right.id) || 0);
      if (scarcityDelta !== 0) return scarcityDelta;
      return left.name.localeCompare(right.name);
    });

    let coverageAssigned = 0;
    orderedGuilds.forEach((guild) => {
      if (coverageAssigned >= requiredCoverage || remaining.size === 0) return;
      const candidate = chooseCandidateForGuild([...remaining.values()], guild.id, counts, randomize);
      if (!candidate) return;
      suggestions.set(candidate.id, guild.id);
      counts.set(guild.id, (counts.get(guild.id) || 0) + 1);
      remaining.delete(candidate.id);
      coverageAssigned += 1;
    });

    while (remaining.size > 0) {
      let bestAssignment = null;

      [...remaining.values()].forEach((row) => {
        const bestGuild = bestGuildForStudent(row, guildIds, counts, false, randomize);
        if (!bestGuild) return;
        if (
          !bestAssignment ||
          bestGuild.value > bestAssignment.value ||
          (bestGuild.value === bestAssignment.value &&
            row.full_name.localeCompare(bestAssignment.row.full_name) < 0)
        ) {
          bestAssignment = { row, ...bestGuild };
        }
      });

      if (!bestAssignment) break;
      suggestions.set(bestAssignment.row.id, bestAssignment.guildId);
      counts.set(bestAssignment.guildId, (counts.get(bestAssignment.guildId) || 0) + 1);
      remaining.delete(bestAssignment.row.id);
    }

    [...remaining.values()].forEach((row) => {
      const overflowGuild = bestGuildForStudent(row, guildIds, counts, true, randomize);
      if (!overflowGuild) return;
      suggestions.set(row.id, overflowGuild.guildId);
      counts.set(overflowGuild.guildId, (counts.get(overflowGuild.guildId) || 0) + 1);
      exceptions.push(
        `${teamKey === "—" ? "Unassigned team" : `Team ${teamKey}`}: ${row.full_name} exceeds the 2-per-guild cap on ${guilds.find((guild) => guild.id === overflowGuild.guildId)?.name || "a guild"}.`,
      );
      remaining.delete(row.id);
    });

    const assignedRows = teamRows
      .map((row) => ({ row, guildId: suggestions.get(row.id) || null }))
      .filter((entry) => entry.guildId);
    const topChoiceCount = assignedRows.filter(({ row, guildId }) => row.rank_1_id === guildId).length;
    const matchedPreferenceCount = assignedRows.filter(({ row, guildId }) => scoreForGuild(row, guildId) > 0).length;
    const zeroCountGuilds = guildIds.filter((guildId) => (counts.get(guildId) || 0) === 0).length;
    const overCapGuilds = guildIds.filter((guildId) => (counts.get(guildId) || 0) > MAX_PER_GUILD).length;

    teamSummaries.push({
      teamKey,
      topChoiceCount,
      matchedPreferenceCount,
      total: assignedRows.length,
      uncoveredGuilds: zeroCountGuilds,
      overCapGuilds,
    });
  });

  return {
    suggestions,
    teamSummaries,
    exceptions,
  };
}

function runSimulations(rows, guilds) {
  if (!rows.length || !guilds.length) return null;

  let cleanRuns = 0;
  let coverageRuns = 0;
  let topChoiceTotal = 0;

  for (let index = 0; index < SIMULATION_RUNS; index += 1) {
    const plan = buildSuggestionPlan(rows, guilds, { randomize: true });
    const hasOverCap = plan.teamSummaries.some((entry) => entry.overCapGuilds > 0);
    const hasCoverageGap = plan.teamSummaries.some((entry) => {
      const teamSize = rows.filter((row) => (row.team_key || "—") === entry.teamKey).length;
      return teamSize >= guilds.length && entry.uncoveredGuilds > 0;
    });
    const topChoiceCount = plan.teamSummaries.reduce((sum, entry) => sum + entry.topChoiceCount, 0);

    if (!hasOverCap) cleanRuns += 1;
    if (!hasCoverageGap) coverageRuns += 1;
    topChoiceTotal += topChoiceCount;
  }

  return {
    cleanRuns,
    coverageRuns,
    averageTopChoices: Math.round((topChoiceTotal / SIMULATION_RUNS) * 10) / 10,
  };
}

export default function GuildAssignBoard({ rows, guilds, counts, totalStudents }) {
  const [assignments, setAssignments] = useState(() => {
    const map = new Map();
    rows.forEach((row) => {
      if (row.assigned_guild_id) map.set(row.id, row.assigned_guild_id);
    });
    return map;
  });
  const [saving, setSaving] = useState(null);
  const [errors, setErrors] = useState(new Map());
  const [teamFilter, setTeamFilter] = useState("all");
  const [guildFilter, setGuildFilter] = useState("all");
  const [suggestionPlan, setSuggestionPlan] = useState(() => buildSuggestionPlan(rows, guilds));
  const [simulationSummary, setSimulationSummary] = useState(() => runSimulations(rows, guilds));
  const [applyingSuggestions, setApplyingSuggestions] = useState(false);
  const [, startTransition] = useTransition();

  const target = totalStudents > 0 ? Math.ceil(totalStudents / guilds.length) : "—";
  const liveCounts = new Map(guilds.map((guild) => [guild.id, 0]));
  assignments.forEach((guildId) => {
    if (guildId) liveCounts.set(guildId, (liveCounts.get(guildId) || 0) + 1);
  });

  const sortedTeams = sortedTeamsFromRows(rows);

  async function assign(studentId, guildId) {
    setSaving(studentId);
    setErrors((previous) => {
      const next = new Map(previous);
      next.delete(studentId);
      return next;
    });

    try {
      const response = await fetch("/api/guild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, guildId: guildId || null }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setErrors((previous) => new Map(previous).set(studentId, payload.error || "Error"));
        return false;
      }

      startTransition(() => {
        setAssignments((previous) => {
          const next = new Map(previous);
          if (guildId) next.set(studentId, guildId);
          else next.delete(studentId);
          return next;
        });
      });
      return true;
    } catch {
      setErrors((previous) => new Map(previous).set(studentId, "Network error"));
      return false;
    } finally {
      setSaving(null);
    }
  }

  function refreshSuggestions() {
    setSuggestionPlan(buildSuggestionPlan(rows, guilds));
    setSimulationSummary(runSimulations(rows, guilds));
  }

  async function applySuggestionsToUnassigned() {
    setApplyingSuggestions(true);
    const filteredRows = rows.filter((row) => {
      const teamMatches = teamFilter === "all" || (row.team_key || "—") === teamFilter;
      const assignedGuildId = assignments.get(row.id) || row.assigned_guild_id || "";
      const rankIds = [row.rank_1_id, row.rank_2_id, row.rank_3_id].filter(Boolean);
      const guildMatches =
        guildFilter === "all" ||
        assignedGuildId === guildFilter ||
        rankIds.includes(guildFilter) ||
        suggestionPlan.suggestions.get(row.id) === guildFilter;
      return teamMatches && guildMatches && !assignedGuildId;
    });

    for (const row of filteredRows) {
      const suggestedGuildId = suggestionPlan.suggestions.get(row.id);
      if (!suggestedGuildId) continue;
      await assign(row.id, suggestedGuildId);
    }
    setApplyingSuggestions(false);
  }

  const filteredRows = rows.filter((row) => {
    const teamMatches = teamFilter === "all" || (row.team_key || "—") === teamFilter;
    const assignedGuildId = assignments.get(row.id) || row.assigned_guild_id || "";
    const rankIds = [row.rank_1_id, row.rank_2_id, row.rank_3_id].filter(Boolean);
    const guildMatches =
      guildFilter === "all" ||
      assignedGuildId === guildFilter ||
      rankIds.includes(guildFilter) ||
      suggestionPlan.suggestions.get(row.id) === guildFilter;
    return teamMatches && guildMatches;
  });

  const filteredTeamGroups = buildTeamGroups(filteredRows);
  const filteredTeamKeys = sortedTeams.filter((teamKey) => filteredTeamGroups.has(teamKey));
  const suggestionExceptions = suggestionPlan.exceptions.slice(0, 4);

  return (
    <div className="guild-board-shell">
      <div className="guild-board-toolbar">
        <div className="guild-board-filters">
          <select className="select select-sm" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
            <option value="all">All Teams</option>
            {sortedTeams.map((teamKey) => (
              <option key={teamKey} value={teamKey}>
                {teamKey === "—" ? "Unassigned Team" : `Team ${teamKey}`}
              </option>
            ))}
          </select>
          <select className="select select-sm" value={guildFilter} onChange={(event) => setGuildFilter(event.target.value)}>
            <option value="all">All Guilds</option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name}
              </option>
            ))}
          </select>
        </div>
        <div className="guild-control-actions">
          <button type="button" className="button button-secondary" onClick={refreshSuggestions}>
            Refresh Suggestions
          </button>
          <button
            type="button"
            className="button button-ghost"
            disabled={applyingSuggestions}
            onClick={applySuggestionsToUnassigned}
          >
            {applyingSuggestions ? "Applying..." : "Apply Suggestions to Unassigned"}
          </button>
        </div>
      </div>

      <div className="guild-board-counts mt-md">
        <article className="surface surface-pad-sm guild-board-count-card">
          <strong>{filteredRows.length}</strong>
          <p>Visible students</p>
        </article>
        <article className="surface surface-pad-sm guild-board-count-card">
          <strong>{suggestionPlan.teamSummaries.reduce((sum, entry) => sum + entry.topChoiceCount, 0)}</strong>
          <p>Top-choice suggestions</p>
        </article>
        <article className="surface surface-pad-sm guild-board-count-card">
          <strong>{suggestionPlan.teamSummaries.reduce((sum, entry) => sum + entry.matchedPreferenceCount, 0)}</strong>
          <p>Preference-matched suggestions</p>
        </article>
        <article className="surface surface-pad-sm guild-board-count-card">
          <strong>{simulationSummary ? `${simulationSummary.coverageRuns}/${SIMULATION_RUNS}` : "—"}</strong>
          <p>Simulation coverage passes</p>
        </article>
      </div>

      {simulationSummary ? (
        <p className="muted mt-sm">
          Randomized simulation: {simulationSummary.cleanRuns}/{SIMULATION_RUNS} runs stayed under the 2-per-guild cap,
          {` `}{simulationSummary.coverageRuns}/{SIMULATION_RUNS} runs kept full guild coverage where team size made it feasible,
          average top-choice matches {simulationSummary.averageTopChoices}.
        </p>
      ) : null}

      {suggestionExceptions.length > 0 ? (
        <div className="alert alert-warn mt-sm">
          {suggestionExceptions.join(" ")}
          {suggestionPlan.exceptions.length > suggestionExceptions.length
            ? ` +${suggestionPlan.exceptions.length - suggestionExceptions.length} more.`
            : ""}
        </div>
      ) : null}

      <div className="guild-board-wrap">
        <div className="guild-balance-bar">
          <p className="guild-balance-title">Guild Balance</p>
          <p className="muted" style={{ fontSize: "0.75rem", margin: "0 0 0.5rem" }}>
            {[...assignments.values()].filter(Boolean).length} of {totalStudents} assigned · target ~{target} each
          </p>
          {guilds.map((guild) => {
            const count = liveCounts.get(guild.id) || 0;
            const over = target !== "—" && count > target;
            return (
              <div key={guild.id} className="guild-balance-row">
                <span className="guild-balance-name">{guild.name}</span>
                <span className={`guild-balance-count${over ? " guild-balance-over" : ""}`}>{count}</span>
              </div>
            );
          })}
        </div>

        <div className="guild-board-table-wrap">
          {filteredRows.length === 0 ? (
            <p className="empty mt-md">No students match the current team and guild filters.</p>
          ) : (
            filteredTeamKeys.map((teamKey) => (
              <div key={teamKey} className="guild-board-team-section">
                <h4 className="guild-board-team-header">{teamKey === "—" ? "Unassigned Team" : `Team ${teamKey}`}</h4>
                <table className="schedule-table guild-board-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>1st</th>
                      <th>2nd</th>
                      <th>3rd</th>
                      <th>Suggested</th>
                      <th>Assign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredTeamGroups.get(teamKey) || []).map((student) => {
                      const isSaving = saving === student.id;
                      const error = errors.get(student.id);
                      const assignedId = assignments.get(student.id) || "";
                      const suggestedGuildId = suggestionPlan.suggestions.get(student.id) || "";
                      const suggestedGuildName = guilds.find((guild) => guild.id === suggestedGuildId)?.name || "—";
                      return (
                        <tr key={student.id} className={isSaving ? "guild-board-row-saving" : ""}>
                          <td>{student.full_name}</td>
                          <td>{student.rank_1_name || <span className="muted">—</span>}</td>
                          <td>{student.rank_2_name || <span className="muted">—</span>}</td>
                          <td>{student.rank_3_name || <span className="muted">—</span>}</td>
                          <td>
                            <div className="guild-suggestion-cell">
                              <span>{suggestedGuildName}</span>
                              {suggestedGuildId && suggestedGuildId !== assignedId ? (
                                <button
                                  type="button"
                                  className="button button-ghost guild-suggestion-button"
                                  onClick={() => assign(student.id, suggestedGuildId)}
                                >
                                  Use
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <select
                              className="select select-sm"
                              value={assignedId}
                              disabled={isSaving}
                              onChange={(event) => assign(student.id, event.target.value)}
                            >
                              <option value="">— unassigned —</option>
                              {guilds.map((guild) => (
                                <option key={guild.id} value={guild.id}>
                                  {guild.name}
                                </option>
                              ))}
                            </select>
                            {error ? (
                              <p className="muted" style={{ color: "#c44", fontSize: "0.72rem", margin: "0.1rem 0 0" }}>
                                {error}
                              </p>
                            ) : null}
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
    </div>
  );
}
