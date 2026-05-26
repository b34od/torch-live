import { requireUser } from "../../../lib/auth";
import {
  formatDateTime,
  formatTimeRange,
  getAnnouncements,
  getCurrentAndNextItem,
  getStudentScheduleByDay,
} from "../../../lib/data";
import { normalizeDayForTrack } from "../../../lib/schedule";

function eventLabel(item) {
  if (!item) return "No scheduled block";
  return `${formatTimeRange(item.start_time, item.duration_minutes)} - ${item.activity_name}`;
}

export const metadata = {
  title: "Student Now",
};

export default async function StudentNowPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = normalizeDayForTrack(params?.day, "student");
  const { supabase, profile } = await requireUser(["student"]);
  const { data: scheduleItems, error: scheduleError } = await getStudentScheduleByDay(
    supabase,
    profile.program_year,
    day,
  );
  const { data: announcements, error: announcementError } = await getAnnouncements(
    supabase,
    profile.program_year,
    3,
  );
  const { current, next } = getCurrentAndNextItem(scheduleItems);

  return (
    <>
      <section className="card">
        <h2>What&apos;s Happening Now</h2>
        {scheduleError ? (
          <p className="alert alert-error">{scheduleError.message}</p>
        ) : (
          <div className="grid-two">
            <article className="surface surface-pad-md">
              <h3 className="card-subtitle">Current</h3>
              <p>{eventLabel(current)}</p>
              {current?.location ? <p className="muted">Location: {current.location}</p> : null}
            </article>
            <article className="surface surface-pad-md">
              <h3 className="card-subtitle">Next Up</h3>
              <p>{eventLabel(next)}</p>
              {next?.location ? <p className="muted">Location: {next.location}</p> : null}
            </article>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Latest Updates</h2>
        {announcementError ? (
          <p className="alert alert-error">{announcementError.message}</p>
        ) : announcements.length === 0 ? (
          <p className="empty">No announcements yet.</p>
        ) : (
          <div className="stack">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="surface surface-pad">
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
    </>
  );
}
