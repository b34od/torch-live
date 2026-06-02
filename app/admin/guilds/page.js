import { redirect } from "next/navigation";
import GuildPreferenceBoard from "../../_components/GuildPreferenceBoard";
import { requireUser } from "../../../lib/auth";
import { getGuildPreferenceBoardData } from "../../../lib/data";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

export const metadata = {
  title: "Admin Guilds",
};

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
    { data: boardData, error: boardError },
  ] = await Promise.all([
    supabase
      .from("guilds")
      .select("*")
      .eq("program_year", profile.program_year)
      .order("sort_order", { ascending: true }),
    getGuildPreferenceBoardData(supabase, profile.program_year),
  ]);

  const editingGuild = editingId ? (guilds || []).find((g) => g.id === editingId) : null;

  const alert = params?.saved === "1"
    ? { className: "alert alert-success", text: "Guild saved." }
    : params?.error
    ? { className: "alert alert-error", text: decodeURIComponent(params.error) }
    : null;

  return (
    <>
      {alert ? <p className={alert.className}>{alert.text}</p> : null}

      <section className="card">
        <h2>{editingGuild ? `Edit Guild: ${editingGuild.name}` : "Add Guild"}</h2>
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

      {boardError ? (
        <p className="alert alert-error">{boardError.message}</p>
      ) : (
        <GuildPreferenceBoard
          rows={boardData?.rows || []}
          counts={boardData?.counts || []}
          selectionOpen={Boolean(boardData?.selectionOpen)}
          year={profile.program_year}
        />
      )}
    </>
  );
}
