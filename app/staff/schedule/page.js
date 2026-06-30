import DayTabs from "../../../components/ui/DayTabs";
import ScheduleList from "../../../components/ui/ScheduleList";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import ScheduleViewTabs from "../../../components/ui/ScheduleViewTabs";
import { requireUser } from "../../../lib/auth";
import { getStaffScheduleByDay } from "../../../lib/data";
import {
  addMinutesToTime,
  dayLabel,
  expandScheduleSplitPairs,
  formatTimeLabel,
  programDaySortMinutes,
  resolveDayForTrack,
  STAFF_DAY_NUMBERS,
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
    const aStart = programDaySortMinutes(a.start_time) || 0;
    const bStart = programDaySortMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
  const displayItems = expandScheduleSplitPairs(sortedItems, day).sort((a, b) => {
    const aStart = programDaySortMinutes(a.start_time) || 0;
    const bStart = programDaySortMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    if (a.splitPairId && a.splitPairId === b.splitPairId) return (a.splitLane || 0) - (b.splitLane || 0);
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
  const firstItem = displayItems[0] || null;
  const lastItem = displayItems[displayItems.length - 1] || null;
  const endTime = lastItem ? addMinutesToTime(lastItem.start_time, lastItem.duration_minutes) : "";

  return (
    <section className="card">
      <h2>Staff Schedule</h2>
      <p className="muted">Shared run-of-show first, with staff-only context tucked into each item when needed.</p>
      <DayTabs basePath="/staff/schedule" selectedDay={day} days={STAFF_DAY_NUMBERS} />

      {error ? (
        <p className="alert alert-error mt-md">
          {error.message}
        </p>
      ) : displayItems.length === 0 ? (
        <p className="empty mt-md">
          No schedule items yet for {dayLabel(day)}.
        </p>
      ) : (
        <>
          <p className="muted mt-sm">
            {sortedItems.length} item{sortedItems.length === 1 ? "" : "s"} · starts at{" "}
            <strong>{formatTimeLabel(firstItem.start_time)}</strong> · ends at{" "}
            <strong>{formatTimeLabel(endTime)}</strong> · Eastern Time (ET)
          </p>
          <ScheduleViewTabs />
          <div className="schedule-view-tabs mt-md">
            <button className="schedule-view-tab" data-view="list" data-default="true">List</button>
            <button className="schedule-view-tab" data-view="timeline">Timeline</button>
          </div>

          <div className="schedule-view-panel mt-sm" data-view="list">
            <ScheduleList
              items={displayItems}
              track="staff"
              groupSplitPairs={true}
              showOperationalDetails={true}
            />
          </div>

          <div className="schedule-view-panel" data-view="timeline" hidden>
            <ScheduleTimeline
              items={displayItems}
              track="staff"
              showNowMarker={false}
              dayNumber={day}
              programYear={profile.program_year}
            />
          </div>
        </>
      )}
    </section>
  );
}
