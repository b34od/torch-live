import { requireUser } from "../../../lib/auth";
import { formatDateTime, getAnnouncements } from "../../../lib/data";

export const metadata = {
  title: "Student Updates",
};

export default async function StudentUpdatesPage() {
  const { supabase, profile } = await requireUser(["student"]);
  const { data: announcements, error } = await getAnnouncements(supabase, profile.program_year, 50);

  return (
    <section className="card">
      <h2>Announcements</h2>
      <p className="muted">Live updates from the TORCH admin team.</p>
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
                {announcement.is_pinned ? <span className="pill pill-admin">Pinned</span> : null}
                {announcement.is_push ? <span className="pill pill-staff">Push</span> : null}
                <span className="muted">{formatDateTime(announcement.created_at)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
