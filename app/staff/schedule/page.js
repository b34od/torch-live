import DayTabs from "../../../components/ui/DayTabs";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import { requireUser } from "../../../lib/auth";
import { getStaffScheduleByDay } from "../../../lib/data";
import {
  addMinutesToTime,
  dayLabel,
  formatTimeLabel,
  formatTimeRange,
  resolveDayForTrack,
  STAFF_DAY_NUMBERS,
  timeToMinutes,
} from "../../../lib/schedule";

export const metadata = {
  title: "Staff Schedule",
};

export default async function StaffSchedulePage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const day = resolveDayForTrack(params?.day, "staff");
  const { supabase, profile } = await requireUser(["staff", "admin"]);
  const { data: items, error } = await getStaffScheduleByDay(supabase, profile.program_year, day);
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
          <p className="muted mt-sm">
            {items.length} item{items.length === 1 ? "" : "s"} · starts at{" "}
            <strong>{formatTimeLabel(firstItem.start_time)}</strong> · ends at{" "}
            <strong>{formatTimeLabel(endTime)}</strong> · Eastern Time (ET)
          </p>
          <nav className="schedule-jump-nav mt-sm" aria-label="Staff schedule sections">
            <a href="#staff-timeline" className="schedule-jump-link">
              Timeline
            </a>
            <a href="#staff-details" className="schedule-jump-link">
              Details
            </a>
          </nav>

          <h3 id="staff-timeline" className="section-anchor mt-md">Ops Timeline</h3>
          <p className="muted">
            Calendar-style view for quick handoffs, location checks, and what is next.
          </p>
          <ScheduleTimeline
            items={sortedItems}
            track="staff"
            showNowMarker={false}
            dayNumber={day}
            programYear={profile.program_year}
          />

          <h3 id="staff-details" className="section-anchor mt-md">Ops Details</h3>
          <div className="schedule-card-list mobile-only mt-md">
            {sortedItems.map((item) => (
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
                  <span className="schedule-label">Point:</span> {item.point_person || "TBD"} ·{" "}
                  <span className="schedule-label">Rain:</span> {item.rain_location || "N/A"}
                  {item.secondary_person ? (
                    <>
                      {" "}· <span className="schedule-label">Secondary:</span>{" "}
                      {item.secondary_person}
                    </>
                  ) : null}
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
                {sortedItems.map((item) => (
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
