import { requireUser } from "../../../lib/auth";
import {
  formatDateTime,
  formatTimeRange,
  getAnnouncements,
  getCurrentAndNextItem,
  getStaffScheduleByDay,
} from "../../../lib/data";
import {
  dayLabel,
  formatTimeLabel,
  getProgramNowSnapshot,
  minutesToTime,
  resolveDayForTrack,
} from "../../../lib/schedule";

function detailedLabel(item) {
  if (!item) return "No scheduled block";
  const where = item.location ? ` • ${item.location}` : "";
  return `${formatTimeRange(item.start_time, item.duration_minutes)} - ${item.activity_name}${where}`;
}

export const metadata = {
  title: "Staff Now",
};

export default async function StaffNowPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = resolveDayForTrack(params?.day, "staff");
  const programNow = getProgramNowSnapshot("staff");
  const currentDayNumber = Number.isFinite(programNow.dayNumber) ? programNow.dayNumber : null;
  const currentDayLabel = currentDayNumber === null ? "Outside program days" : dayLabel(currentDayNumber);
  const currentTimeLabel = Number.isFinite(programNow.minutes)
    ? formatTimeLabel(minutesToTime(programNow.minutes))
    : "Unknown time";
  const showingCurrentProgramDay = currentDayNumber !== null && day === currentDayNumber;
  const { supabase, profile } = await requireUser(["staff", "admin"]);
  const { data: scheduleItems, error: scheduleError } = await getStaffScheduleByDay(
    supabase,
    profile.program_year,
    day,
  );
  const { data: announcements, error: announcementError } = await getAnnouncements(
    supabase,
    profile.program_year,
    4,
  );
  const { current, next } = getCurrentAndNextItem(scheduleItems, {
    track: "staff",
    selectedDay: day,
  });

  return (
    <>
      <section className="card">
        <h2>Staff Ops Snapshot</h2>
        <p className="muted">
          Program time: <strong>{currentDayLabel}</strong> · <strong>{currentTimeLabel} ET</strong>
        </p>
        {!showingCurrentProgramDay ? (
          <p className="alert alert-warn mt-sm">
            Viewing {dayLabel(day)} schedule while current program day is {currentDayLabel}.
          </p>
        ) : null}
        {scheduleError ? (
          <p className="alert alert-error">{scheduleError.message}</p>
        ) : (
          <div className="grid-two">
            <article className="surface surface-pad-md">
              <h3 className="card-subtitle">Current Assignment</h3>
              <p>{detailedLabel(current)}</p>
              <p className="muted">Point person: {current?.point_person || "TBD"}</p>
              <p className="muted">Rain location: {current?.rain_location || "N/A"}</p>
            </article>
            <article className="surface surface-pad-md">
              <h3 className="card-subtitle">Up Next</h3>
              <p>{detailedLabel(next)}</p>
              <p className="muted">Point person: {next?.point_person || "TBD"}</p>
              <p className="muted">Rain location: {next?.rain_location || "N/A"}</p>
            </article>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Latest Admin Updates</h2>
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
                  <span className="pill pill-staff">{announcement.audience}</span>
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
