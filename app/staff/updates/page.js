import { requireUser } from "../../../lib/auth";
import { formatDateTime, getAnnouncements } from "../../../lib/data";

export const metadata = {
  title: "Staff Updates",
};

export default async function StaffUpdatesPage() {
  const { supabase, profile } = await requireUser(["staff", "admin"]);
  const { data: announcements, error } = await getAnnouncements(supabase, profile.program_year, 60);

  return (
    <section className="card">
      <h2>Announcements</h2>
      <p className="muted">Includes staff-only messages.</p>
      {error ? (
        <p className="alert alert-error mt-md">
          {error.message}
        </p>
      ) : announcements.length === 0 ? (
        <p className="empty mt-md">
          No announcements yet.
        </p>
      ) : (
        <div className="stack mt-md">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="resource-item">
              <strong>{announcement.title}</strong>
              <p>{announcement.body}</p>
              <div className="announcement-meta">
                <span className="pill pill-staff">{announcement.audience}</span>
                {announcement.is_pinned ? <span className="pill pill-admin">Pinned</span> : null}
                {announcement.is_push ? <span className="pill pill-staff">Push</span> : null}
                {announcement.message_type ? <span className="pill pill-staff">{announcement.message_type}</span> : null}
                <span className="muted">{formatDateTime(announcement.created_at)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
