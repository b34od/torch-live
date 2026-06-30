import { redirect } from "next/navigation";
import GuildAssignBoard from "../../_components/GuildAssignBoard";
import { requireUser } from "../../../lib/auth";
import { getGuildPreferenceBoardData, getProgramSetting } from "../../../lib/data";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

export const metadata = {
  title: "Admin Guilds",
};

async function toggleGuildSelection(formData) {
  "use server";
  const { profile } = await requireUser(["admin"]);
  const newValue = String(formData.get("open") || "") === "true" ? "true" : "false";
  const adminClient = createAdminSupabaseClient();
  await adminClient.from("program_settings").upsert(
    { program_year: profile.program_year, key: "guild_selection_open", value: newValue },
    { onConflict: "program_year,key" },
  );
  redirect("/admin/guilds?setting_saved=1");
}

async function assignAllToTopChoice() {
  "use server";
  const { profile } = await requireUser(["admin"]);
  const adminClient = createAdminSupabaseClient();

  // Get all unassigned students who have a rank_1 preference
  const { data: prefs } = await adminClient
    .from("guild_preferences")
    .select("student_id, rank_1")
    .eq("program_year", profile.program_year)
    .not("rank_1", "is", null);

  if (!prefs?.length) redirect("/admin/guilds?batch=0");

  const unassignedIds = [];
  for (const pref of prefs) {
    const { data: student } = await adminClient
      .from("user_profiles")
      .select("id, guild_id")
      .eq("id", pref.student_id)
      .maybeSingle();
    if (student && !student.guild_id) unassignedIds.push(pref);
  }

  let assigned = 0;
  for (const pref of unassignedIds) {
    const { error } = await adminClient
      .from("user_profiles")
      .update({ guild_id: pref.rank_1 })
      .eq("id", pref.student_id);
    if (!error) assigned += 1;
  }

  redirect(`/admin/guilds?batch=${assigned}`);
}

async function saveGuild(formData) {
  "use server";

  const { profile } = await requireUser(["admin"]);
  const id = String(formData.get("id") || "").trim() || null;
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const name = String(formData.get("name") || "").trim();
  const studentDescription = String(formData.get("student_description") || "").trim() || null;
  const staffDescription = String(formData.get("staff_description") || "").trim() || null;
  const sortOrder = Number.parseInt(String(formData.get("sort_order") || "0"), 10) || 0;
  const isActive = formData.get("is_active") === "on";
  const year = profile.program_year;

  if (!slug || !name) {
    redirect(`/admin/guilds?error=Slug and name are required.`);
  }

  const adminClient = createAdminSupabaseClient();

  if (id) {
    const { error } = await adminClient
      .from("guilds")
      .update({ slug, name, student_description: studentDescription, staff_description: staffDescription, sort_order: sortOrder, is_active: isActive })
      .eq("id", id);
    if (error) redirect(`/admin/guilds?error=${encodeURIComponent(error.message)}`);
  } else {
    const { error } = await adminClient
      .from("guilds")
      .insert({ program_year: year, slug, name, student_description: studentDescription, staff_description: staffDescription, sort_order: sortOrder, is_active: isActive });
    if (error) redirect(`/admin/guilds?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/guilds?saved=1`);
}

export default async function AdminGuildsPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const { supabase, profile } = await requireUser(["admin"]);

  const editingId = String(params?.edit || "").trim() || null;

  const [
    { data: guilds, error },
    boardResult,
    selectionOpenValue,
  ] = await Promise.all([
    supabase
      .from("guilds")
      .select("*")
      .eq("program_year", profile.program_year)
      .order("sort_order", { ascending: true }),
    getGuildPreferenceBoardData(supabase, profile.program_year),
    getProgramSetting(supabase, profile.program_year, "guild_selection_open"),
  ]);

  const boardData = boardResult.data;
  const boardError = boardResult.error;
  const selectionOpen = selectionOpenValue === "true";
  const submittedCount = (boardData?.rows || []).filter((r) => r.rank_1_name).length;
  const assignedCount = (boardData?.rows || []).filter((r) => r.assigned_guild_id).length;
  const totalStudents = boardData?.rows?.length || 0;

  const editingGuild = editingId ? (guilds || []).find((g) => g.id === editingId) : null;

  const batchCount = params?.batch !== undefined ? Number(params.batch) : null;
  const alert = params?.saved === "1"
    ? { className: "alert alert-success", text: "Guild saved." }
    : params?.setting_saved === "1"
    ? { className: "alert alert-success", text: `Guild selection is now ${selectionOpen ? "open" : "closed"}.` }
    : batchCount !== null
    ? { className: "alert alert-success", text: `Assigned ${batchCount} student${batchCount !== 1 ? "s" : ""} with the legacy top-choice fill.` }
    : params?.error
    ? { className: "alert alert-error", text: decodeURIComponent(params.error) }
    : null;

  return (
    <>
      {alert ? <p className={alert.className}>{alert.text}</p> : null}

      {/* Guild selection control panel */}
      <section className="card">
        <h2>Guild Selection Controls</h2>
        <div className="guild-control-row mt-sm">
          <div className="guild-control-stats">
            <span className={`status-pill ${selectionOpen ? "status-pill-good" : "status-pill-warn"}`}>
              Selection {selectionOpen ? "Open" : "Closed"}
            </span>
            <span className="muted" style={{ fontSize: "0.82rem" }}>
              {submittedCount} / {totalStudents} submitted · {assignedCount} / {totalStudents} assigned
            </span>
          </div>
          <div className="guild-control-actions">
            <form action={toggleGuildSelection} className="inline-form">
              <input type="hidden" name="open" value={selectionOpen ? "false" : "true"} />
              <button type="submit" className={`button ${selectionOpen ? "button-ghost" : "button-secondary"}`}>
                {selectionOpen ? "Close Selection" : "Open Selection"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {boardError ? (
        <p className="alert alert-error">{boardError.message}</p>
      ) : (
        <section className="card">
          <h2>Guild Assignment Board</h2>
          <p className="muted">
            Assign students to guilds with team and guild filters, suggestion support, and randomized balance simulation for quick operator review.
          </p>
          <GuildAssignBoard
            rows={boardData?.rows || []}
            guilds={(guilds || []).filter((g) => g.is_active).map((g) => ({ id: g.id, name: g.name }))}
            counts={boardData?.counts || []}
            totalStudents={totalStudents}
          />
        </section>
      )}

      <section className="card">
        <details className="admin-collapsible">
          <summary>
            <span className="admin-collapsible-title">Legacy Top-Choice Fill</span>
            <span className="admin-collapsible-meta">Keep this as a fallback only. Use board suggestions first so team/guild balance stays visible.</span>
          </summary>
          <form action={assignAllToTopChoice} className="inline-form mt-md">
            <button type="submit" className="button button-ghost">
              Assign All Unassigned → Top Choice
            </button>
          </form>
        </details>
      </section>

      <section className="card">
        <h2>Guilds — {profile.program_year}</h2>
        {error ? (
          <p className="alert alert-error">{error.message}</p>
        ) : !guilds?.length ? (
          <p className="empty">No guilds yet for {profile.program_year}.</p>
        ) : (
          <div className="table-wrap mt-md">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {guilds.map((g) => (
                  <tr key={g.id}>
                    <td className="muted">{g.sort_order}</td>
                    <td>{g.name}</td>
                    <td><code className="muted">{g.slug}</code></td>
                    <td>
                      <span className={`status-pill ${g.is_active ? "status-pill-good" : "status-pill-warn"}`}>
                        {g.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`/admin/guilds?edit=${g.id}`}
                        className="schedule-table-action schedule-table-action-edit"
                      >
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <details className="admin-collapsible" open={Boolean(editingGuild)}>
          <summary>
            <span className="admin-collapsible-title">{editingGuild ? `Edit Guild: ${editingGuild.name}` : "Add Guild"}</span>
            <span className="admin-collapsible-meta">Manage guild copy and visibility without crowding the assignment board.</span>
          </summary>
          <form action={saveGuild} className="stack mt-md">
            {editingGuild ? <input type="hidden" name="id" value={editingGuild.id} /> : null}
            <div className="grid-two">
              <div className="field">
                <label className="label" htmlFor="guild_name">Name</label>
                <input
                  id="guild_name"
                  name="name"
                  className="input"
                  defaultValue={editingGuild?.name || ""}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="guild_slug">Slug</label>
                <input
                  id="guild_slug"
                  name="slug"
                  className="input"
                  placeholder="servant-leadership"
                  defaultValue={editingGuild?.slug || ""}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="sort_order">Sort Order</label>
                <input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  className="input"
                  defaultValue={editingGuild?.sort_order ?? 0}
                />
              </div>
              <label className="inline-check muted" style={{ alignSelf: "end" }}>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editingGuild ? editingGuild.is_active : true}
                />
                Active (visible to users)
              </label>
            </div>
            <div className="field">
              <label className="label" htmlFor="student_description">Student Description</label>
              <textarea
                id="student_description"
                name="student_description"
                className="textarea"
                rows={4}
                defaultValue={editingGuild?.student_description || ""}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="staff_description">Staff / Counselor Description</label>
              <textarea
                id="staff_description"
                name="staff_description"
                className="textarea"
                rows={4}
                defaultValue={editingGuild?.staff_description || ""}
              />
            </div>
            <div className="stack-sm">
              <button type="submit" className="button button-primary">
                {editingGuild ? "Save Changes" : "Add Guild"}
              </button>
              {editingGuild ? (
                <a href="/admin/guilds" className="button button-ghost">Cancel</a>
              ) : null}
            </div>
          </form>
        </details>
      </section>
    </>
  );
}
