import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "../../../components/ui/ConfirmSubmitButton";
import { requireUser } from "../../../lib/auth";
import { formatDateTime, getAnnouncements } from "../../../lib/data";

function announcementsPageUrl(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `/admin/announcements?${query}` : "/admin/announcements";
}

function alertFromParams(params) {
  if (params?.sent === "1") {
    return { className: "alert alert-success", text: "Announcement published." };
  }
  if (params?.updated === "1") {
    return { className: "alert alert-success", text: "Announcement updated." };
  }
  if (params?.removed === "1") {
    return { className: "alert alert-success", text: "Announcement removed." };
  }
  if (params?.error) {
    return { className: "alert alert-error", text: params.error };
  }
  return null;
}

async function createAnnouncement(formData) {
  "use server";

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audience = String(formData.get("audience") || "all");
  const isPush = formData.get("is_push") === "on";
  const isPinned = formData.get("is_pinned") === "on";

  if (!title || !body) {
    redirect(announcementsPageUrl({ error: "Title and body are required." }));
  }

  if (!["all", "staff", "students"].includes(audience)) {
    redirect(announcementsPageUrl({ error: "Invalid audience." }));
  }

  const { supabase, profile, user } = await requireUser(["admin"]);
  const recentCutoff = new Date(Date.now() - 60 * 1000).toISOString();
  const { data: duplicateRows } = await supabase
    .from("announcements")
    .select("id")
    .eq("program_year", profile.program_year)
    .eq("title", title)
    .eq("body", body)
    .eq("audience", audience)
    .gte("created_at", recentCutoff)
    .limit(1);

  if (duplicateRows?.length) {
    redirect(announcementsPageUrl({ error: "Duplicate detected within 60 seconds." }));
  }

  const { error } = await supabase.from("announcements").insert({
    program_year: profile.program_year,
    title,
    body,
    audience,
    is_push: isPush,
    is_pinned: isPinned,
    created_by: user.id,
  });

  if (error) {
    redirect(announcementsPageUrl({ error: error.message }));
  }

  redirect(announcementsPageUrl({ sent: "1" }));
}

async function updateAnnouncement(formData) {
  "use server";

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audience = String(formData.get("audience") || "all");
  const isPush = formData.get("is_push") === "on";
  const isPinned = formData.get("is_pinned") === "on";

  if (!id) {
    redirect(announcementsPageUrl({ error: "Missing announcement id." }));
  }
  if (!title || !body) {
    redirect(announcementsPageUrl({ error: "Title and body are required.", edit: id }));
  }
  if (!["all", "staff", "students"].includes(audience)) {
    redirect(announcementsPageUrl({ error: "Invalid audience.", edit: id }));
  }

  const { supabase, profile } = await requireUser(["admin"]);
  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      body,
      audience,
      is_push: isPush,
      is_pinned: isPinned,
    })
    .eq("id", id)
    .eq("program_year", profile.program_year);

  if (error) {
    redirect(announcementsPageUrl({ error: error.message, edit: id }));
  }

  redirect(announcementsPageUrl({ updated: "1" }));
}

async function removeAnnouncement(formData) {
  "use server";

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect(announcementsPageUrl({ error: "Missing announcement id." }));
  }

  const { supabase, profile } = await requireUser(["admin"]);
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .eq("program_year", profile.program_year);

  if (error) {
    redirect(announcementsPageUrl({ error: error.message }));
  }

  redirect(announcementsPageUrl({ removed: "1" }));
}

export const metadata = {
  title: "Admin Announcements",
};

export default async function AdminAnnouncementsPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const alert = alertFromParams(params || {});
  const { supabase, profile } = await requireUser(["admin"]);
  const { data: announcements, error } = await getAnnouncements(supabase, profile.program_year, 30);
  const editingId = String(params?.edit || "").trim();
  const editingAnnouncement = announcements.find((entry) => entry.id === editingId) || null;

  return (
    <>
      <section className="card">
        <h2>{editingAnnouncement ? "Edit Announcement" : "Send Announcement"}</h2>
        <p className="muted">This is the primary communication channel during the program.</p>
        {alert ? <p className={alert.className}>{alert.text}</p> : null}
        <form action={editingAnnouncement ? updateAnnouncement : createAnnouncement} className="stack">
          {editingAnnouncement ? <input type="hidden" name="id" value={editingAnnouncement.id} /> : null}
          <div className="field">
            <label htmlFor="title" className="label">
              Title
            </label>
            <input
              id="title"
              name="title"
              className="input"
              defaultValue={editingAnnouncement?.title || ""}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="body" className="label">
              Body
            </label>
            <textarea
              id="body"
              name="body"
              className="textarea"
              defaultValue={editingAnnouncement?.body || ""}
              required
            />
          </div>
          <div className="grid-two">
            <div className="field">
              <label htmlFor="audience" className="label">
                Audience
              </label>
              <select
                id="audience"
                name="audience"
                className="select"
                defaultValue={editingAnnouncement?.audience || "all"}
              >
                <option value="all">All</option>
                <option value="staff">Staff only</option>
                <option value="students">Students only</option>
              </select>
            </div>
            <div className="stack-sm align-end">
              <label>
                <input type="checkbox" name="is_push" defaultChecked={Boolean(editingAnnouncement?.is_push)} />{" "}
                Mark as push-eligible
              </label>
              <label>
                <input
                  type="checkbox"
                  name="is_pinned"
                  defaultChecked={Boolean(editingAnnouncement?.is_pinned)}
                />{" "}
                Pin to top
              </label>
            </div>
          </div>
          <button type="submit" className="button button-primary">
            {editingAnnouncement ? "Save Announcement" : "Publish Announcement"}
          </button>
        </form>
        {editingAnnouncement ? (
          <p className="muted mt-sm">
            <Link href={announcementsPageUrl()}>Done editing</Link>
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2>Recent Announcements</h2>
        {error ? (
          <p className="alert alert-error">{error.message}</p>
        ) : announcements.length === 0 ? (
          <p className="empty">No announcements yet.</p>
        ) : (
          <div className="stack">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="resource-item">
                <strong>{announcement.title}</strong>
                <p>{announcement.body}</p>
                <div className="announcement-meta">
                  <span className="pill pill-staff">{announcement.audience}</span>
                  {announcement.is_pinned ? <span className="pill pill-admin">Pinned</span> : null}
                  {announcement.is_push ? <span className="pill pill-staff">Push</span> : null}
                  <span className="muted">{formatDateTime(announcement.created_at)}</span>
                </div>
                <div className="item-actions mt-sm">
                  <Link href={announcementsPageUrl({ edit: announcement.id })} className="day-tab">
                    Edit
                  </Link>
                  <form action={removeAnnouncement}>
                    <input type="hidden" name="id" value={announcement.id} />
                    <ConfirmSubmitButton
                      label="Remove"
                      className="button button-secondary"
                      confirmMessage="Remove this announcement?"
                    />
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
