import { requireUser } from "../../../lib/auth";
import {
  formatDateTime,
  formatTimeRange,
  getAnnouncements,
  getCurrentAndNextItem,
  getStudentScheduleByDay,
} from "../../../lib/data";
import {
  dayLabel,
  formatTimeLabel,
  getProgramNowSnapshot,
  minutesToTime,
  resolveDayForTrack,
} from "../../../lib/schedule";

function eventLabel(item) {
  if (!item) return "No scheduled block";
  return `${formatTimeRange(item.start_time, item.duration_minutes)} - ${item.activity_name}`;
}

export const metadata = {
  title: "Student Now",
};

export default async function StudentNowPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = resolveDayForTrack(params?.day, "student");
  const programNow = getProgramNowSnapshot("student");
  const currentDayNumber = Number.isFinite(programNow.dayNumber) ? programNow.dayNumber : null;
  const currentDayLabel = currentDayNumber === null ? "Outside program days" : dayLabel(currentDayNumber);
  const currentTimeLabel = Number.isFinite(programNow.minutes)
    ? formatTimeLabel(minutesToTime(programNow.minutes))
    : "Unknown time";
  const showingCurrentProgramDay = currentDayNumber !== null && day === currentDayNumber;
  const { supabase, profile } = await requireUser(["student"]);
  const [
    { data: scheduleItems, error: scheduleError },
    { data: announcements, error: announcementError },
    { data: guildRow },
  ] = await Promise.all([
    getStudentScheduleByDay(supabase, profile.program_year, day, { simplify: true }),
    getAnnouncements(supabase, profile.program_year, 3),
    profile.guild_id
      ? supabase.from("guilds").select("name").eq("id", profile.guild_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const guildName = guildRow?.name ?? null;
  const { current, next } = getCurrentAndNextItem(scheduleItems, {
    track: "student",
    selectedDay: day,
  });

  const hasProfileContext = profile.team_key || guildName || profile.room_number;

  return (
    <>
      {hasProfileContext ? (
        <section className="card profile-context-strip">
          <div className="profile-context-items">
            {profile.team_key ? (
              <span className="profile-context-item">
                <span className="schedule-label">Team</span> {profile.team_key}
              </span>
            ) : null}
            {guildName ? (
              <span className="profile-context-item">
                <span className="schedule-label">Guild</span>{" "}
                <a href="/student/guilds" className="text-link">{guildName}</a>
              </span>
            ) : (
              <span className="profile-context-item">
                <a href="/student/guilds" className="text-link">Choose your guild →</a>
              </span>
            )}
            {profile.room_number ? (
              <span className="profile-context-item">
                <span className="schedule-label">Room</span> {profile.room_number}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>What&apos;s Happening Now</h2>
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
                  {announcement.message_type ? <span className="pill pill-staff">{announcement.message_type}</span> : null}
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
