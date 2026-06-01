import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/auth";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

export const metadata = {
  title: "Guilds",
};

async function selectGuild(formData) {
  "use server";

  const { user } = await requireUser(["student"]);
  const guildId = String(formData.get("guild_id") || "").trim();

  if (!guildId) {
    redirect("/student/guilds?error=Please+select+a+guild.");
  }

  const adminClient = createAdminSupabaseClient();
  const { error } = await adminClient
    .from("user_profiles")
    .update({ guild_id: guildId })
    .eq("id", user.id);

  if (error) {
    redirect(`/student/guilds?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/student/guilds?joined=1");
}

export default async function StudentGuildsPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const { supabase, profile } = await requireUser(["student"]);

  const [guildsResponse, profileResponse] = await Promise.all([
    supabase
      .from("guilds")
      .select("id, slug, name, student_description, sort_order")
      .eq("program_year", profile.program_year)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_profiles")
      .select("guild_id")
      .eq("id", profile.id)
      .single(),
  ]);

  const guilds = guildsResponse.data || [];
  const currentGuildId = profileResponse.data?.guild_id ?? null;
  const currentGuild = guilds.find((g) => g.id === currentGuildId) ?? null;

  const alert = params?.joined === "1"
    ? { className: "alert alert-success", text: `You've joined ${currentGuild?.name ?? "your guild"}.` }
    : params?.error
    ? { className: "alert alert-error", text: decodeURIComponent(params.error) }
    : null;

  return (
    <>
      {alert ? <p className={alert.className}>{alert.text}</p> : null}

      {currentGuild ? (
        <section className="card">
          <h2>Your Guild: {currentGuild.name}</h2>
          <p className="muted">You&apos;re set! Here&apos;s what your guild is all about.</p>
          <div className="surface surface-pad mt-md">
            <p>{currentGuild.student_description}</p>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Choose Your Guild</h2>
          <p className="muted">
            Guilds are groups you&apos;ll spend time with throughout the program — for meetings,
            meals, and activities. Pick the one that calls to you.
          </p>
          {guilds.length > 0 ? (
            <form action={selectGuild} className="stack mt-md">
              {guilds.map((g) => (
                <label key={g.id} className="guild-option">
                  <input type="radio" name="guild_id" value={g.id} required />
                  <div className="guild-option-body">
                    <strong>{g.name}</strong>
                    <p className="muted">{g.student_description}</p>
                  </div>
                </label>
              ))}
              <button type="submit" className="button button-primary">
                Join This Guild
              </button>
            </form>
          ) : (
            <p className="empty mt-md">Guild information will be available soon.</p>
          )}
        </section>
      )}

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
