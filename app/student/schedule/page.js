import DayTabs from "../../../components/ui/DayTabs";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import ScheduleViewTabs from "../../../components/ui/ScheduleViewTabs";
import { requireUser } from "../../../lib/auth";
import { getStudentScheduleByDay } from "../../../lib/data";
import {
  dayLabel,
  formatTimeLabel,
  resolveDayForTrack,
  STUDENT_DAY_NUMBERS,
  timeToMinutes,
} from "../../../lib/schedule";

const LOCATION_COLORS = [
  { bg: "rgba(237,103,103,0.13)", border: "#ed6767" },
  { bg: "rgba(238,183,95,0.18)",  border: "#d48d19" },
  { bg: "rgba(147,204,134,0.18)", border: "#33784c" },
  { bg: "rgba(113,60,151,0.12)",  border: "#713c97" },
  { bg: "rgba(173,174,215,0.18)", border: "#5b5f92" },
];

function locationColor(location) {
  const text = String(location || "");
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return LOCATION_COLORS[Math.abs(hash) % LOCATION_COLORS.length];
}

export const metadata = {
  title: "Schedule",
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

  return (
    <section className="card">
      <h2>Schedule</h2>
      <DayTabs basePath="/student/schedule" selectedDay={day} days={STUDENT_DAY_NUMBERS} />

      {error ? (
        <p className="alert alert-error mt-md">{error.message}</p>
      ) : sortedItems.length === 0 ? (
        <p className="empty mt-md">No schedule posted for {dayLabel(day)} yet.</p>
      ) : (
        <>
          <ScheduleViewTabs />
          <div className="schedule-view-tabs mt-md">
            <button className="schedule-view-tab" data-view="list" data-default="true">List</button>
            <button className="schedule-view-tab" data-view="timeline">Timeline</button>
          </div>

          <div className="schedule-view-panel" data-view="list">
            <ul className="student-schedule-list mt-sm">
              {sortedItems.map((item) => {
                const color = locationColor(item.location);
                return (
                  <li
                    key={item.id}
                    className="student-schedule-item"
                    style={{ borderLeftColor: color.border, background: color.bg }}
                  >
                    <span className="student-schedule-time">
                      {formatTimeLabel(item.start_time)}
                    </span>
                    <span className="student-schedule-activity">{item.activity_name}</span>
                    {item.location ? (
                      <span className="student-schedule-location">{item.location}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="schedule-view-panel" data-view="timeline" hidden>
            <ScheduleTimeline
              items={sortedItems}
              track="student"
              showNowMarker={true}
              dayNumber={day}
              programYear={profile.program_year}
            />
          </div>
        </>
      )}
    </section>
  );
}
