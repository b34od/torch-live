import DayTabs from "../../../components/ui/DayTabs";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import ScheduleViewTabs from "../../../components/ui/ScheduleViewTabs";
import { requireUser } from "../../../lib/auth";
import { getStudentScheduleByDay } from "../../../lib/data";
import {
  dayLabel,
  formatTimeLabel,
  programDaySortMinutes,
  resolveDayForTrack,
  STUDENT_DAY_NUMBERS,
} from "../../../lib/schedule";

// Explicit keyword-based color map — avoids hash collisions between
// visually similar location types (e.g. Outside vs Classrooms).
function locationColor(location) {
  const loc = String(location || "").toLowerCase();
  if (loc.includes("outside") || loc.includes("quad") || loc.includes("behind") ||
      loc.includes("grass") || loc.includes("amphitheatre") || loc.includes("field")) {
    return { bg: "rgba(147,204,134,0.22)", border: "#33784c" };      // green — outdoors
  }
  if (loc.includes("classroom")) {
    return { bg: "rgba(238,183,95,0.24)", border: "#b87200" };       // amber — classrooms
  }
  if (loc.includes("theatre") || loc.includes("theater")) {
    return { bg: "rgba(173,174,215,0.28)", border: "#5b5f92" };      // lavender — theatre
  }
  if (loc.includes("dining") || loc.includes("d)")) {
    return { bg: "rgba(113,180,220,0.22)", border: "#2d6e9e" };      // blue — dining hall
  }
  if (loc.includes("event room") || loc.includes("campus ctr") || loc.includes("campus center")) {
    return { bg: "rgba(237,103,103,0.18)", border: "#c44040" };      // coral — event room / campus ctr
  }
  if (loc.includes("housing")) {
    return { bg: "rgba(255,180,195,0.22)", border: "#b04070" };      // rose — housing
  }
  if (loc.includes("coffee") || loc.includes("coffeehouse")) {
    return { bg: "rgba(100,200,190,0.22)", border: "#2a8a80" };      // teal — coffeehouse
  }
  if (loc.includes("trlc")) {
    return { bg: "rgba(237,103,103,0.18)", border: "#c44040" };      // coral — TRLC
  }
  return { bg: "rgba(173,174,215,0.18)", border: "#8888aa" };        // fallback lavender
}

export const metadata = {
  title: "Schedule",
};

export default async function StudentSchedulePage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = resolveDayForTrack(params?.day, "student");
  const { supabase, profile } = await requireUser(["student"]);
  const { data: items, error } = await getStudentScheduleByDay(supabase, profile.program_year, day, {
    simplify: true,
  });
  const sortedItems = [...(items || [])].sort((a, b) => {
    const aStart = programDaySortMinutes(a.start_time) || 0;
    const bStart = programDaySortMinutes(b.start_time) || 0;
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
