import DayTabs from "../../../components/ui/DayTabs";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import ScheduleViewTabs from "../../../components/ui/ScheduleViewTabs";
import { requireUser } from "../../../lib/auth";
import { getStudentScheduleByDay } from "../../../lib/data";
import {
  addMinutesToTime,
  dayLabel,
  formatTimeLabel,
  programDaySortMinutes,
  resolveDayForTrack,
  STUDENT_DAY_NUMBERS,
} from "../../../lib/schedule";

// Which activity name fragment teams 1–5 attend FIRST in each team-split slot.
// key: `${dayNumber}@HH:MM`, value: substring present in the first-group activity name.
const TEAM_SPLIT_FIRST = {
  "1@12:35": "lunch",        // Day 1: teams 1–5 eat Lunch first
  "3@12:00": "lunch",        // Day 3: teams 1–5 eat Lunch first
  "3@17:35": "dinner",       // Day 3: teams 1–5 eat Dinner first
};
const GUILD_SPLIT_KEYS = new Set(["1@17:30", "2@17:35", "4@12:30"]);

// For team splits: shift the second item's start_time sequentially so it renders
// after the first. Guild splits are left as-is (counselor assigns rotation on the spot).
function resequenceSplitPairs(items, splitHints) {
  const processed = new Set();
  const result = [];
  for (const item of items) {
    if (processed.has(item.id)) continue;
    const hint = splitHints[item.id];
    const isPersonalized =
      hint &&
      (hint.includes("Your group goes here first") ||
        hint.includes("Your group goes here after"));
    // Unknown team assignment — still resequence by sort_order rather than parallel lanes
    const isUnknownTeam = hint === "Your counselor will direct you";
    if (!isPersonalized && !isUnknownTeam) {
      result.push(item);
      continue;
    }
    const partner = items.find(
      (other) =>
        other.id !== item.id &&
        !processed.has(other.id) &&
        String(other.start_time).slice(0, 5) === String(item.start_time).slice(0, 5) &&
        (splitHints[other.id]?.includes("Your group goes here first") ||
          splitHints[other.id]?.includes("Your group goes here after") ||
          splitHints[other.id] === "Your counselor will direct you")
    );
    if (!partner) {
      result.push(item);
      continue;
    }
    processed.add(item.id);
    processed.add(partner.id);
    if (isPersonalized) {
      const youFirst = hint.includes("first");
      const first = youFirst ? item : partner;
      const second = youFirst ? partner : item;
      result.push({ ...first, splitHint: "Swap with your group after 45 min" });
      result.push({ ...second, start_time: addMinutesToTime(first.start_time, first.duration_minutes), splitHint: null });
    } else {
      // No team assigned — show in sort_order order with counselor note on first item only
      const first = (item.sort_order || 0) <= (partner.sort_order || 0) ? item : partner;
      const second = first === item ? partner : item;
      result.push({ ...first, splitHint: "Your counselor will direct you" });
      result.push({ ...second, start_time: addMinutesToTime(first.start_time, first.duration_minutes), splitHint: null });
    }
  }
  return result;
}

function buildSplitHints(items, dayNumber, teamKey) {
  const teamNum = Number.parseInt(String(teamKey || "").replace(/\D/g, ""), 10);
  const hasTeam = Number.isFinite(teamNum) && teamNum >= 1 && teamNum <= 10;
  const inGroupA = hasTeam && teamNum <= 5;

  const byTime = new Map();
  for (const item of items) {
    const t = String(item.start_time).slice(0, 5);
    if (!byTime.has(t)) byTime.set(t, []);
    byTime.get(t).push(item);
  }

  const hints = {};
  for (const [time, group] of byTime) {
    if (group.length < 2) continue;
    const splitKey = `${dayNumber}@${time}`;

    if (GUILD_SPLIT_KEYS.has(splitKey)) {
      for (const item of group) {
        hints[item.id] = "Your counselor will direct you to your rotation";
      }
    } else if (TEAM_SPLIT_FIRST[splitKey]) {
      const firstPattern = TEAM_SPLIT_FIRST[splitKey];
      for (const item of group) {
        if (!hasTeam) {
          hints[item.id] = "Your counselor will direct you";
        } else {
          const isGroupAFirst = item.activity_name.toLowerCase().includes(firstPattern);
          const youFirst = inGroupA ? isGroupAFirst : !isGroupAFirst;
          hints[item.id] = youFirst
            ? "Your group goes here first — swap after 45 min"
            : "Your group goes here after the swap";
        }
      }
    }
  }
  return hints;
}

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
  const splitHints = buildSplitHints(sortedItems, day, profile.team_key);
  const annotatedItems = sortedItems.map((item) => ({
    ...item,
    splitHint: splitHints[item.id] || null,
  }));
  const displayItems = resequenceSplitPairs(annotatedItems, splitHints).sort((a, b) => {
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
              {displayItems.map((item) => {
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
                    {item.splitHint ? (
                      <span className="student-schedule-split-hint">{item.splitHint}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
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
