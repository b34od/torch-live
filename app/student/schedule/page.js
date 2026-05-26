import DayTabs from "../../../components/ui/DayTabs";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import { requireUser } from "../../../lib/auth";
import { getStudentScheduleByDay } from "../../../lib/data";
import {
  dayLabel,
  formatTimeRange,
  normalizeDayForTrack,
  STUDENT_DAY_NUMBERS,
} from "../../../lib/schedule";

export const metadata = {
  title: "Student Schedule",
};

export default async function StudentSchedulePage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = normalizeDayForTrack(params?.day, "student");
  const { supabase, profile } = await requireUser(["student"]);
  const { data: items, error } = await getStudentScheduleByDay(supabase, profile.program_year, day);

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
          <h3 className="mt-md">Agenda Timeline</h3>
          <p className="muted">
            Calendar-style view so you can quickly see what happens next and how long each block runs.
          </p>
          <ScheduleTimeline items={items} track="student" />

          <h3 className="mt-md">Agenda Details</h3>
          <div className="schedule-card-list mobile-only mt-md">
            {items.map((item) => (
              <article key={item.id} className="schedule-card">
                <div className="schedule-card-header">
                  <span className="schedule-time">{formatTimeRange(item.start_time, item.duration_minutes)}</span>
                  <span className="schedule-duration">{item.duration_minutes}m</span>
                </div>
                <p className="schedule-activity">
                  {item.activity_name}
                </p>
                <p className="schedule-detail">
                  <span className="schedule-label">Location:</span> {item.location || "TBD"}
                </p>
              </article>
            ))}
          </div>

          <div className="table-wrap mt-md desktop-only">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Time Range</th>
                  <th>Duration</th>
                  <th>Activity</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatTimeRange(item.start_time, item.duration_minutes)}</td>
                    <td>{item.duration_minutes}m</td>
                    <td>{item.activity_name}</td>
                    <td>{item.location || "TBD"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
