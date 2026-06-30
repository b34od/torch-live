import GuildAssignBoard from "../../_components/GuildAssignBoard";
import { requireUser } from "../../../lib/auth";
import { getGuildPreferenceBoardData } from "../../../lib/data";

export const metadata = {
  title: "Guilds",
};

export default async function StaffGuildsPage() {
  const { supabase, profile } = await requireUser(["staff", "admin"]);

  const [guildsResponse, profileResponse, boardResponse] = await Promise.all([
    supabase
      .from("guilds")
      .select("id, slug, name, staff_description, sort_order")
      .eq("program_year", profile.program_year)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_profiles")
      .select("guild_id")
      .eq("id", profile.id)
      .single(),
    getGuildPreferenceBoardData(supabase, profile.program_year),
  ]);

  const guilds = guildsResponse.data || [];
  const currentGuildId = profileResponse.data?.guild_id ?? null;
  const currentGuild = guilds.find((g) => g.id === currentGuildId) ?? null;

  return (
    <>
      {boardResponse.error ? (
        <p className="alert alert-error">{boardResponse.error.message}</p>
      ) : (
        <section className="card">
          <div className="guild-board-header">
            <div>
              <h2>Guild Assignment Board</h2>
              <p className="muted">
                Focus on live assignments first. Filter by team or guild, use suggestions for balance, then override anything manually.
              </p>
            </div>
            <span className={`status-pill ${boardResponse.data?.selectionOpen ? "status-pill-good" : "status-pill-warn"}`}>
              Selection {boardResponse.data?.selectionOpen ? "Open" : "Closed"}
            </span>
          </div>
          <GuildAssignBoard
            rows={boardResponse.data?.rows || []}
            guilds={guilds.map((g) => ({ id: g.id, name: g.name }))}
            counts={boardResponse.data?.counts || []}
            totalStudents={boardResponse.data?.rows?.length || 0}
          />
        </section>
      )}

      {currentGuild ? (
        <section className="card">
          <h2>Your Guild: {currentGuild.name}</h2>
          <p className="muted">Your assignment is shown here so you can cross-check the live board quickly.</p>
        </section>
      ) : (
        <section className="card">
          <h2>Your Guild</h2>
          <p className="muted">
            You haven&apos;t been assigned to a guild yet. An admin will assign your guild before
            the program starts.
          </p>
        </section>
      )}

      <section className="card">
        <details className="admin-collapsible">
          <summary>
            <span className="admin-collapsible-title">Guild Descriptions</span>
            <span className="admin-collapsible-meta">Reference copy only — keep the assignment board as the main workspace.</span>
          </summary>
          {guilds.length === 0 ? (
            <p className="empty mt-md">Guild information will be available soon.</p>
          ) : (
            <div className="stack mt-md">
              {guilds.map((g) => (
                <article
                  key={g.id}
                  className={`surface surface-pad${g.id === currentGuildId ? " guild-card-active" : ""}`}
                >
                  <h3>
                    {g.name}
                    {g.id === currentGuildId ? <span className="pill pill-staff ml-sm">Your Guild</span> : null}
                  </h3>
                  <p className="muted">{g.staff_description}</p>
                </article>
              ))}
            </div>
          )}
        </details>
      </section>
    </>
  );
}
