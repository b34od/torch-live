import DayTabs from "../../../components/ui/DayTabs";
import ScheduleList from "../../../components/ui/ScheduleList";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import ScheduleViewTabs from "../../../components/ui/ScheduleViewTabs";
import { requireUser } from "../../../lib/auth";
import { getStudentScheduleByDay } from "../../../lib/data";
import {
  addMinutesToTime,
  dayLabel,
  programDaySortMinutes,
  resolveDayForTrack,
  STUDENT_DAY_NUMBERS,
} from "../../../lib/schedule";

const SPLIT_CONFIG = {
  "1@12:35": { type: "team", firstActivity: "lunch", swapGap: 5 },
  "1@17:30": { type: "guild", swapGap: 5 },
  "2@17:35": { type: "guild", swapGap: 5 },
  "3@12:00": { type: "team", firstActivity: "lunch", swapGap: 5 },
  "3@17:35": { type: "team", firstActivity: "dinner", swapGap: 5 },
  "4@12:30": { type: "guild", swapGap: 5 },
};

function expandSplitPairs(items, dayNumber, teamKey) {
  const teamNum = Number.parseInt(String(teamKey || "").replace(/\D/g, ""), 10);
  const hasTeam = Number.isFinite(teamNum) && teamNum >= 1 && teamNum <= 10;
  const inGroupA = hasTeam && teamNum <= 5;

  const byTime = new Map();
  for (const item of items) {
    const t = String(item.start_time).slice(0, 5);
    if (!byTime.has(t)) byTime.set(t, []);
    byTime.get(t).push(item);
  }

  const splitIds = new Set();
  const result = [];

  for (const [time, group] of byTime) {
    if (group.length < 2) continue;
    const cfg = SPLIT_CONFIG[`${dayNumber}@${time}`];
    if (!cfg) continue;
    const pair = group.slice(0, 2);
    for (const item of pair) splitIds.add(item.id);

    let itemA = pair[0];
    let itemB = pair[1];

    if (cfg.type === "team" && cfg.firstActivity) {
      const aIsFirst = itemA.activity_name.toLowerCase().includes(cfg.firstActivity);
      if (!aIsFirst) [itemA, itemB] = [itemB, itemA];
    } else {
      if ((itemA.sort_order || 0) > (itemB.sort_order || 0)) [itemA, itemB] = [itemB, itemA];
    }

    const labelA = cfg.type === "team" ? "Teams 1–5" : null;
    const labelB = cfg.type === "team" ? "Teams 6–10" : null;
    const pairId1 = `split-${dayNumber}-${time}`;
    const pairId2 = `split-${dayNumber}-${time}-swap`;
    const dur = itemA.duration_minutes;
    const swapTime = addMinutesToTime(time, dur + (cfg.swapGap || 0));

    if (hasTeam && cfg.type === "team") {
      const myFirst = inGroupA ? itemA : itemB;
      const otherFirst = inGroupA ? itemB : itemA;
      const myLabel = inGroupA ? labelA : labelB;
      const otherLabel = inGroupA ? labelB : labelA;

      result.push({ ...myFirst, splitPairId: pairId1, splitGroupLabel: myLabel, splitLane: 0 });
      result.push({ ...otherFirst, splitPairId: pairId1, splitGroupLabel: otherLabel, splitLane: 1 });
      result.push({ ...otherFirst, id: `synth-${otherFirst.id}`, start_time: swapTime, sort_order: (myFirst.sort_order || 0) + 1, splitPairId: pairId2, splitGroupLabel: myLabel, splitLane: 0, isSynthesized: true });
      result.push({ ...myFirst, id: `synth-${myFirst.id}`, start_time: swapTime, sort_order: (otherFirst.sort_order || 0) + 1, splitPairId: pairId2, splitGroupLabel: otherLabel, splitLane: 1, isSynthesized: true });
    } else {
      result.push({ ...itemA, splitPairId: pairId1, splitGroupLabel: labelA, splitLane: 0 });
      result.push({ ...itemB, splitPairId: pairId1, splitGroupLabel: labelB, splitLane: 1 });
      result.push({ ...itemB, id: `synth-${itemB.id}`, start_time: swapTime, sort_order: (itemA.sort_order || 0) + 1, splitPairId: pairId2, splitGroupLabel: labelA, splitLane: 0, isSynthesized: true });
      result.push({ ...itemA, id: `synth-${itemA.id}`, start_time: swapTime, sort_order: (itemB.sort_order || 0) + 1, splitPairId: pairId2, splitGroupLabel: labelB, splitLane: 1, isSynthesized: true });
    }
  }

  for (const item of items) {
    if (!splitIds.has(item.id)) result.push(item);
  }

  return result;
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
  const displayItems = expandSplitPairs(sortedItems, day, profile.team_key).sort((a, b) => {
    const aStart = programDaySortMinutes(a.start_time) || 0;
    const bStart = programDaySortMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    if (a.splitPairId && a.splitPairId === b.splitPairId) return (a.splitLane || 0) - (b.splitLane || 0);
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

          <div className="schedule-view-panel mt-sm" data-view="list">
            <ScheduleList items={displayItems} track="student" groupSplitPairs={true} />
          </div>

          <div className="schedule-view-panel" data-view="timeline" hidden>
            <ScheduleTimeline
              items={displayItems}
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
