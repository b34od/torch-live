import { requireUser } from "../../../lib/auth";
import {
  formatDateTime,
  formatTimeRange,
  getAnnouncements,
  getCurrentAndNextItem,
  getResourceCategories,
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

function findSurveyResource(categories) {
  for (const category of categories || []) {
    for (const item of category.resource_items || []) {
      const haystack = `${item.title || ""} ${item.body || ""}`.toLowerCase();
      if (haystack.includes("survey") || haystack.includes("eval")) {
        return item;
      }
    }
  }
  return null;
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
    { data: resourceCategories },
  ] = await Promise.all([
    getStudentScheduleByDay(supabase, profile.program_year, day, { simplify: true }),
    getAnnouncements(supabase, profile.program_year, 3),
    profile.guild_id
      ? supabase.from("guilds").select("name").eq("id", profile.guild_id).single()
      : Promise.resolve({ data: null }),
    getResourceCategories(supabase, profile.program_year),
  ]);
  const guildName = guildRow?.name ?? null;
  const surveyResource = findSurveyResource(resourceCategories || []);
  const { current, next } = getCurrentAndNextItem(scheduleItems, {
    track: "student",
    selectedDay: day,
  });

  const hasProfileContext = profile.team_key || guildName || profile.room_number;

  return (
    <>
      <section className="now-hero">
        <div className="now-hero-header">
          <p className="now-hero-time">
            <strong>{currentDayLabel}</strong> · {currentTimeLabel} ET
          </p>
          {hasProfileContext ? (
            <div className="now-hero-context">
              {profile.team_key ? (
                <span className="now-context-chip">{profile.team_key}</span>
              ) : null}
              {guildName ? (
                <a href="/student/guilds" className="now-context-chip now-context-chip-link">{guildName}</a>
              ) : null}
              {profile.room_number ? (
                <span className="now-context-chip">Rm {profile.room_number}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        {!showingCurrentProgramDay ? (
          <p className="alert alert-warn mt-sm">
            Viewing {dayLabel(day)} schedule — current program day is {currentDayLabel}.
          </p>
        ) : null}
        {scheduleError ? (
          <p className="alert alert-error">{scheduleError.message}</p>
        ) : (
          <div className="now-schedule-cards">
            <article className={`now-schedule-card${current ? " now-schedule-card-active" : ""}`}>
              <span className="now-schedule-card-label">Now</span>
              {current ? (
                <>
                  <p className="now-schedule-card-activity">{current.activity_name}</p>
                  <p className="now-schedule-card-time">{formatTimeRange(current.start_time, current.duration_minutes)}</p>
                  {current.location ? <p className="now-schedule-card-location">{current.location}</p> : null}
                </>
              ) : (
                <p className="now-schedule-card-empty">No scheduled block</p>
              )}
            </article>
            <article className="now-schedule-card now-schedule-card-next">
              <span className="now-schedule-card-label">Next Up</span>
              {next ? (
                <>
                  <p className="now-schedule-card-activity">{next.activity_name}</p>
                  <p className="now-schedule-card-time">{formatTimeRange(next.start_time, next.duration_minutes)}</p>
                  {next.location ? <p className="now-schedule-card-location">{next.location}</p> : null}
                </>
              ) : (
                <p className="now-schedule-card-empty">Nothing else today</p>
              )}
            </article>
          </div>
        )}
        <a href="/student/schedule" className="now-full-schedule-link">
          View full schedule
        </a>
      </section>

      {surveyResource ? (
        <section className="card now-survey-card">
          <h2>Welcome to TORCH</h2>
          <p className="muted">
            Get familiar with the app before program week.
          </p>
          <a
            href={`/student/resources#resource-${surveyResource.id}`}
            className="button button-primary now-survey-button"
          >
            Take the Pre-Program Survey
          </a>
        </section>
      ) : null}

      <section className="card">
        <h2>Latest Updates</h2>
        {announcementError ? (
          <p className="alert alert-error">{announcementError.message}</p>
        ) : announcements.length === 0 ? (
          <p className="empty">No announcements yet.</p>
        ) : (
          <div className="stack">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="now-announcement">
                <div className="now-announcement-header">
                  <strong>{announcement.title}</strong>
                  {announcement.is_pinned ? <span className="pill pill-admin">Pinned</span> : null}
                </div>
                <p className="now-announcement-body">{announcement.body}</p>
                <div className="now-announcement-meta">
                  {announcement.message_type ? (
                    <span className="now-announcement-type">{announcement.message_type}</span>
                  ) : null}
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
