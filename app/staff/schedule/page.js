import DayTabs from "../../../components/ui/DayTabs";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import { requireUser } from "../../../lib/auth";
import { getStaffScheduleByDay } from "../../../lib/data";
import {
  dayLabel,
  formatTimeRange,
  normalizeDayForTrack,
  STAFF_DAY_NUMBERS,
} from "../../../lib/schedule";

export const metadata = {
  title: "Staff Schedule",
};

export default async function StaffSchedulePage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = normalizeDayForTrack(params?.day, "staff");
  const { supabase, profile } = await requireUser(["staff", "admin"]);
  const { data: items, error } = await getStaffScheduleByDay(supabase, profile.program_year, day);

  return (
    <section className="card">
      <h2>Staff Schedule</h2>
      <p className="muted">Operational view including rain plans and point-person assignments.</p>
      <DayTabs basePath="/staff/schedule" selectedDay={day} days={STAFF_DAY_NUMBERS} />

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
          <h3 className="mt-md">Ops Timeline</h3>
          <p className="muted">
            Calendar-style view for quick handoffs, location checks, and what is next.
          </p>
          <ScheduleTimeline items={items} track="staff" showNowMarker />

          <h3 className="mt-md">Ops Details</h3>
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
                <p className="schedule-detail">
                  <span className="schedule-label">Rain:</span> {item.rain_location || "N/A"}
                </p>
                <p className="schedule-detail">
                  <span className="schedule-label">Point:</span> {item.point_person || "TBD"}
                </p>
                <p className="schedule-detail">
                  <span className="schedule-label">Secondary:</span> {item.secondary_person || "N/A"}
                </p>
                {item.notes ? (
                  <p className="schedule-detail">
                    <span className="schedule-label">Notes:</span> {item.notes}
                  </p>
                ) : null}
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
                  <th>Rain</th>
                  <th>Point</th>
                  <th>Secondary</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatTimeRange(item.start_time, item.duration_minutes)}</td>
                    <td>{item.duration_minutes}m</td>
                    <td>
                      <strong>{item.activity_name}</strong>
                      {item.notes ? <p className="muted">{item.notes}</p> : null}
                    </td>
                    <td>{item.location || "TBD"}</td>
                    <td>{item.rain_location || "N/A"}</td>
                    <td>{item.point_person || "TBD"}</td>
                    <td>{item.secondary_person || "N/A"}</td>
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
