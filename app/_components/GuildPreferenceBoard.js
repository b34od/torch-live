import { formatDateTime } from "../../lib/data";

export default function GuildPreferenceBoard({
  rows,
  counts,
  selectionOpen,
  year,
}) {
  const submittedCount = rows.filter((row) => row.submitted_at).length;

  return (
    <section className="card">
      <div className="guild-board-header">
        <div>
          <h2>Guild Preferences — {year}</h2>
          <p className="muted">
            {submittedCount} of {rows.length} active students have submitted ranked choices.
          </p>
        </div>
        <span className={`status-pill ${selectionOpen ? "status-pill-good" : "status-pill-warn"}`}>
          Selection {selectionOpen ? "Open" : "Closed"}
        </span>
      </div>

      {counts.length > 0 ? (
        <div className="guild-board-counts mt-md">
          {counts.map((count) => (
            <article key={count.id} className="surface surface-pad-sm guild-board-count-card">
              <strong>{count.name}</strong>
              <p className="muted">{count.assigned_count} assigned</p>
            </article>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="empty mt-md">No active students found for {year}.</p>
      ) : (
        <div className="table-wrap mt-md">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Team</th>
                <th>1st Choice</th>
                <th>2nd Choice</th>
                <th>3rd Choice</th>
                <th>Submitted</th>
                <th>Assigned Guild</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td>{row.team_key || <span className="muted">—</span>}</td>
                  <td>{row.rank_1_name || <span className="muted">—</span>}</td>
                  <td>{row.rank_2_name || <span className="muted">—</span>}</td>
                  <td>{row.rank_3_name || <span className="muted">—</span>}</td>
                  <td>{row.submitted_at ? formatDateTime(row.submitted_at) : <span className="muted">Not submitted</span>}</td>
                  <td>{row.assigned_guild_name || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
