import DayTabs from "../../../components/ui/DayTabs";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import { requireUser } from "../../../lib/auth";
import { getStudentScheduleByDay } from "../../../lib/data";
import {
  addMinutesToTime,
  dayLabel,
  formatTimeLabel,
  formatTimeRange,
  resolveDayForTrack,
  STUDENT_DAY_NUMBERS,
  timeToMinutes,
} from "../../../lib/schedule";

export const metadata = {
  title: "Student Schedule",
};

export default async function StudentSchedulePage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = resolveDayForTrack(params?.day, "student");
  const { supabase, profile } = await requireUser(["student"]);
  const { data: items, error } = await getStudentScheduleByDay(supabase, profile.program_year, day);
  const sortedItems = [...(items || [])].sort((a, b) => {
    const aStart = timeToMinutes(a.start_time) || 0;
    const bStart = timeToMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
  const firstItem = sortedItems[0] || null;
  const lastItem = sortedItems[sortedItems.length - 1] || null;
  const endTime = lastItem ? addMinutesToTime(lastItem.start_time, lastItem.duration_minutes) : "";

  return (
    <section className="card">
      <h2>Student Schedule</h2>
      <p className="muted">Day-by-day schedule curated for students.</p>
      <DayTabs basePath="/student/schedule" selectedDay={day} days={STUDENT_DAY_NUMBERS} />

      {error ? (
        <p className="alert alert-error mt-md">
          {error.message}
        </p>
      ) : items.length === 0 ? (
        <p className="empty mt-md">
          No schedule items yet for {dayLabel(day)}.
        </p>
      ) : (
        <>
          <p className="muted mt-sm">
            {items.length} item{items.length === 1 ? "" : "s"} · starts at{" "}
            <strong>{formatTimeLabel(firstItem.start_time)}</strong> · ends at{" "}
            <strong>{formatTimeLabel(endTime)}</strong> · Eastern Time (ET)
          </p>
          <h3 id="student-timeline" className="section-anchor mt-md">Agenda Timeline</h3>
          <p className="muted">
            Calendar-style view so you can quickly see what happens next and how long each block runs.
          </p>
          <ScheduleTimeline
            items={sortedItems}
            track="student"
            showNowMarker={false}
            dayNumber={day}
            programYear={profile.program_year}
          />
          <div className="mobile-only">
            <h3 className="section-anchor mt-md">Agenda Details</h3>
            <p className="muted">Quick list view for readability on dense program days.</p>
            <div className="schedule-card-list schedule-card-list-student mt-md">
              {sortedItems.map((item) => (
                <article key={item.id} className="schedule-card">
                  <div className="schedule-card-header">
                    <span className="schedule-time">{formatTimeRange(item.start_time, item.duration_minutes)}</span>
                    <span className="schedule-duration">{item.duration_minutes}m</span>
                  </div>
                  <p className="schedule-activity">{item.activity_name}</p>
                  <p className="schedule-detail">
                    <span className="schedule-label">Location:</span> {item.location || "TBD"}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
