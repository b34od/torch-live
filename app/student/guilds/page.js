import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/auth";
import { getProgramSetting } from "../../../lib/data";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

export const metadata = {
  title: "Guilds",
};

function guildsPageUrl(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const suffix = query.toString();
  return suffix ? `/student/guilds?${suffix}` : "/student/guilds";
}

async function saveGuildPreferences(formData) {
  "use server";

  const { user, profile } = await requireUser(["student"]);
  const rank1 = String(formData.get("rank_1") || "").trim();
  const rank2 = String(formData.get("rank_2") || "").trim();
  const rank3 = String(formData.get("rank_3") || "").trim();
  const rankedGuildIds = [rank1, rank2, rank3];

  if (rankedGuildIds.some((guildId) => !guildId)) {
    redirect(guildsPageUrl({ error: "Choose a first, second, and third guild." }));
  }

  if (new Set(rankedGuildIds).size !== rankedGuildIds.length) {
    redirect(guildsPageUrl({ error: "Each ranked guild choice must be different." }));
  }

  const adminClient = createAdminSupabaseClient();
  const guildSelectionOpen = await getProgramSetting(adminClient, profile.program_year, "guild_selection_open");

  if (guildSelectionOpen !== "true") {
    redirect(guildsPageUrl({ error: "Guild selection is currently closed." }));
  }

  const { data: validGuilds, error: guildError } = await adminClient
    .from("guilds")
    .select("id")
    .eq("program_year", profile.program_year)
    .eq("is_active", true)
    .in("id", rankedGuildIds);

  if (guildError) {
    redirect(guildsPageUrl({ error: guildError.message }));
  }

  if ((validGuilds || []).length !== 3) {
    redirect(guildsPageUrl({ error: "Guild choices must be active options for your program year." }));
  }

  const submittedAt = new Date().toISOString();
  const { error } = await adminClient
    .from("guild_preferences")
    .upsert(
      {
        student_id: user.id,
        program_year: profile.program_year,
        rank_1: rank1,
        rank_2: rank2,
        rank_3: rank3,
        submitted_at: submittedAt,
      },
      { onConflict: "student_id,program_year" },
    );

  if (error) {
    redirect(guildsPageUrl({ error: error.message }));
  }

  redirect(guildsPageUrl({ saved: "1" }));
}

export default async function StudentGuildsPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const { supabase, profile } = await requireUser(["student"]);

  const [guildsResponse, preferencesResponse, guildSelectionOpenValue] = await Promise.all([
    supabase
      .from("guilds")
      .select("id, slug, name, student_description, sort_order")
      .eq("program_year", profile.program_year)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("guild_preferences")
      .select("rank_1, rank_2, rank_3, submitted_at")
      .eq("student_id", profile.id)
      .eq("program_year", profile.program_year)
      .maybeSingle(),
    getProgramSetting(supabase, profile.program_year, "guild_selection_open"),
  ]);

  const guilds = guildsResponse.data || [];
  const currentGuildId = profile.guild_id ?? null;
  const currentGuild = guilds.find((g) => g.id === currentGuildId) ?? null;
  const preferences = preferencesResponse.data || null;
  const selectionOpen = guildSelectionOpenValue === "true";
  const guildNameById = new Map(guilds.map((guild) => [guild.id, guild.name]));
  const pageError = guildsResponse.error || preferencesResponse.error || null;

  const alert = params?.saved === "1"
    ? { className: "alert alert-success", text: "Guild preferences saved." }
    : params?.error
    ? { className: "alert alert-error", text: decodeURIComponent(params.error) }
    : null;

  const rankedChoices = [
    { label: "1st Choice", value: preferences?.rank_1 || "", name: guildNameById.get(preferences?.rank_1) || null },
    { label: "2nd Choice", value: preferences?.rank_2 || "", name: guildNameById.get(preferences?.rank_2) || null },
    { label: "3rd Choice", value: preferences?.rank_3 || "", name: guildNameById.get(preferences?.rank_3) || null },
  ];

  return (
    <>
      {alert ? <p className={alert.className}>{alert.text}</p> : null}
      {pageError ? <p className="alert alert-error">{pageError.message}</p> : null}

      {currentGuild ? (
        <section className="card">
          <h2>Your Assigned Guild: {currentGuild.name}</h2>
          <div className="surface surface-pad mt-md">
            <p>{currentGuild.student_description}</p>
          </div>
        </section>
      ) : null}

      <section className="card">
        <div className="guild-board-header">
          <div>
            <h2>Guild Preferences</h2>
            <p className="muted">
              Rank the three guilds you would most like to join during the program.
            </p>
          </div>
          <span className={`status-pill ${selectionOpen ? "status-pill-good" : "status-pill-warn"}`}>
            Selection {selectionOpen ? "Open" : "Closed"}
          </span>
        </div>

        {selectionOpen ? (
          guilds.length > 0 ? (
            <form action={saveGuildPreferences} className="stack mt-md">
              <div className="grid-two">
                {rankedChoices.map((choice, index) => (
                  <div key={choice.label} className="field">
                    <label className="label" htmlFor={`rank_${index + 1}`}>{choice.label}</label>
                    <select
                      id={`rank_${index + 1}`}
                      name={`rank_${index + 1}`}
                      className="select"
                      defaultValue={choice.value}
                      required
                    >
                      <option value="">Select a guild</option>
                      {guilds.map((guild) => (
                        <option key={guild.id} value={guild.id}>
                          {guild.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button type="submit" className="button button-primary">
                {preferences ? "Update Preferences" : "Save Preferences"}
              </button>
            </form>
          ) : (
            <p className="empty mt-md">Guild information will be available soon.</p>
          )
        ) : (
          <p className="muted mt-md">
            Guild selection is currently closed. Staff will share final assignments here once they are ready.
          </p>
        )}

        {preferences ? (
          <div className="surface surface-pad mt-md">
            <h3>Your Submitted Choices</h3>
            <ul className="guild-preference-summary">
              {rankedChoices.map((choice) => (
                <li key={choice.label}>
                  <span className="schedule-label">{choice.label}</span> {choice.name || "—"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {!currentGuild ? (
        <section className="card">
          <h2>How Guilds Work</h2>
          <p className="muted">
            Guilds are groups you&apos;ll spend time with throughout the program for meetings,
            meals, and activities. Use your ranked choices to let staff know which communities
            you are most excited about.
          </p>
        </section>
      ) : null}

      {guilds.length > 0 ? (
        <section className="card">
          <h2>All Guilds</h2>
          <p className="muted">Learn about each guild before you choose — or explore them all.</p>
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
                <p className="muted">{g.student_description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
