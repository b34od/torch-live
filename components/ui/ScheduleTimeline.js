"use client";

import {
  addMinutesToTime,
  formatTimeLabel,
  formatTimeRange,
  getProgramNowSnapshot,
  timeToMinutes,
} from "../../lib/schedule";

const COLOR_PALETTE = [
  { bg: "rgba(237, 103, 103, 0.22)", border: "rgba(237, 103, 103, 0.65)" },
  { bg: "rgba(238, 183, 95, 0.24)", border: "rgba(212, 141, 25, 0.62)" },
  { bg: "rgba(147, 204, 134, 0.24)", border: "rgba(51, 120, 76, 0.62)" },
  { bg: "rgba(113, 60, 151, 0.18)", border: "rgba(90, 48, 121, 0.62)" },
  { bg: "rgba(173, 174, 215, 0.24)", border: "rgba(91, 95, 146, 0.62)" },
];
const MIN_BLOCK_HEIGHT_PX = 24;

function colorForLocation(location) {
  const text = String(location || "TBD");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  const color = COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
  return color;
}

function floorToHour(minutes) {
  return Math.floor(minutes / 60) * 60;
}

function ceilToHour(minutes) {
  return Math.ceil(minutes / 60) * 60;
}

function compactTimeLabel(time) {
  if (!time) return "";
  const [hourRaw = "0", minuteRaw = "0"] = String(time).split(":");
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  const suffix = hour >= 12 ? "p" : "a";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")}${suffix}`;
}

function formatCompactTimeRange(startTime, durationMinutes) {
  const endTime = addMinutesToTime(startTime, durationMinutes);
  if (!startTime || !endTime) return "";
  return `${compactTimeLabel(startTime)}-${compactTimeLabel(endTime)}`;
}

function timeBounds(item) {
  const start = timeToMinutes(item.start_time) || 0;
  const duration = Number(item.duration_minutes || 0);
  return {
    start,
    end: start + duration,
  };
}

function buildLayout(items) {
  const entries = items.map((item) => {
    const bounds = timeBounds(item);
    return {
      item,
      start: bounds.start,
      end: bounds.end,
      lane: 0,
      laneCount: 1,
      hasOverlap: false,
    };
  });

  const active = [];
  let cluster = [];
  let clusterLaneCount = 1;

  function finalizeCluster() {
    for (const entry of cluster) {
      entry.laneCount = Math.max(clusterLaneCount, 1);
    }
    cluster = [];
    clusterLaneCount = 1;
  }

  for (const entry of entries) {
    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index].end <= entry.start) {
        active.splice(index, 1);
      }
    }

    if (active.length === 0 && cluster.length > 0) {
      finalizeCluster();
    }

    for (const activeEntry of active) {
      activeEntry.hasOverlap = true;
      entry.hasOverlap = true;
    }

    const usedLanes = new Set(active.map((value) => value.lane));
    let lane = 0;
    while (usedLanes.has(lane)) lane += 1;
    entry.lane = lane;

    active.push(entry);
    cluster.push(entry);

    let highestLane = 0;
    for (const activeEntry of active) {
      if (activeEntry.lane > highestLane) highestLane = activeEntry.lane;
    }
    clusterLaneCount = Math.max(clusterLaneCount, highestLane + 1);
  }

  if (cluster.length > 0) finalizeCluster();

  return new Map(entries.map((entry) => [entry.item.id, entry]));
}

export default function ScheduleTimeline({
  items,
  track,
  showNowMarker = true,
  showConflicts = false,
  dayNumber = null,
  programYear = null,
}) {
  if (!items?.length) {
    return <p className="empty mt-md">No schedule items to preview on timeline.</p>;
  }

  const sorted = [...items].sort((a, b) => {
    const aStart = timeToMinutes(a.start_time) || 0;
    const bStart = timeToMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });

  const starts = sorted.map((item) => timeToMinutes(item.start_time) || 0);
  const ends = sorted.map((item) => (timeToMinutes(item.start_time) || 0) + Number(item.duration_minutes || 0));
  const scaleStart = floorToHour(Math.min(...starts, 7 * 60));
  const scaleEnd = ceilToHour(Math.max(...ends, 20 * 60));
  const pxPerMinute = 1.6;
  const timelineHeight = Math.max((scaleEnd - scaleStart) * pxPerMinute, 420);

  const hourlyTicks = [];
  for (let minute = scaleStart; minute <= scaleEnd; minute += 60) {
    hourlyTicks.push(minute);
  }

  const legendByLocation = new Map();
  sorted.forEach((item) => {
    const location = item.location || "TBD";
    if (!legendByLocation.has(location)) {
      legendByLocation.set(location, colorForLocation(location));
    }
  });
  const legendItems = [...legendByLocation.entries()];
  const hasMultipleLocations = legendItems.length > 1;
  const singleLocationLabel = hasMultipleLocations ? "" : legendItems[0]?.[0] || "TBD";
  const layoutById = buildLayout(sorted);

  const programNow = getProgramNowSnapshot(track);
  const nowMinutes = Number.isFinite(programNow.minutes) ? programNow.minutes : 0;
  const currentDay = programNow.dayNumber;
  const normalizedYear = Number(programYear);
  const normalizedDay = Number(dayNumber);
  const hasProgramYear = Number.isFinite(normalizedYear);
  const hasSelectedDay = Number.isFinite(normalizedDay);
  const isProgramYearMatch = hasProgramYear && normalizedYear === programNow.year;
  const isSelectedDayCurrent = hasSelectedDay && normalizedDay === currentDay;
  const shouldRenderNowMarker =
    showNowMarker &&
    Number.isFinite(currentDay) &&
    hasProgramYear &&
    hasSelectedDay &&
    isProgramYearMatch &&
    isSelectedDayCurrent;
  const showNow = shouldRenderNowMarker && nowMinutes >= scaleStart && nowMinutes <= scaleEnd;
  const nowTop = (nowMinutes - scaleStart) * pxPerMinute;

  let currentId = null;
  let nextId = null;
  if (shouldRenderNowMarker) {
    for (let index = 0; index < sorted.length; index += 1) {
      const item = sorted[index];
      const { start, end } = timeBounds(item);
      if (nowMinutes >= start && nowMinutes < end) {
        currentId = item.id;
        nextId = sorted[index + 1]?.id || null;
        break;
      }
      if (nowMinutes < start) {
        nextId = item.id;
        break;
      }
    }
  }

  const conflicts = [];
  const active = [];
  sorted.forEach((item) => {
    const { start, end } = timeBounds(item);
    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index].end <= start) {
        active.splice(index, 1);
      }
    }
    active.forEach((entry) => {
      conflicts.push({ first: entry.item, second: item });
    });
    active.push({ item, end });
  });

  return (
    <div className="timeline-shell mt-md">
      {showConflicts && conflicts.length > 0 ? (
        <div className="timeline-conflicts" role="status" aria-live="polite">
          <strong>Schedule conflicts:</strong>{" "}
          {conflicts
            .slice(0, 4)
            .map(
              ({ first, second }) =>
                `${first.activity_name} (${formatTimeRange(first.start_time, first.duration_minutes)}) overlaps ${second.activity_name} (${formatTimeRange(second.start_time, second.duration_minutes)})`,
            )
            .join(" | ")}
          {conflicts.length > 4 ? ` | +${conflicts.length - 4} more overlap(s)` : ""}
        </div>
      ) : null}
      {hasMultipleLocations ? (
        <div className="timeline-legend" aria-label="Location color legend">
          {legendItems.map(([location, color]) => (
            <span className="timeline-legend-chip" key={location}>
              <span
                className="timeline-legend-swatch"
                style={{ background: color.bg, borderColor: color.border }}
                aria-hidden="true"
              />
              {location}
            </span>
          ))}
        </div>
      ) : (
        <p className="timeline-single-location" aria-label="Single location for this day">
          Location: <strong>{singleLocationLabel}</strong>
        </p>
      )}
      <p className="timeline-timezone">All schedule times are shown in Eastern Time (ET).</p>
      <div className="timeline-grid" style={{ height: `${timelineHeight}px` }}>
        <div className="timeline-lane">
          {showNow ? (
            <div className="timeline-now-line" style={{ top: `${nowTop}px` }}>
              <span>Now</span>
            </div>
          ) : null}
          {sorted.map((item) => {
            const startMinutes = timeToMinutes(item.start_time) || scaleStart;
            const durationMinutes = Number(item.duration_minutes || 0);
            const top = (startMinutes - scaleStart) * pxPerMinute;
            const height = Math.max(durationMinutes * pxPerMinute, MIN_BLOCK_HEIGHT_PX);
            const locationLabel = item.location || "TBD";
            const color = colorForLocation(locationLabel);
            const layout = layoutById.get(item.id);
            const lane = layout?.lane || 0;
            const laneCount = Math.max(layout?.laneCount || 1, 1);
            const laneGapPx = 6;
            const laneWidthPercent = 100 / laneCount;
            const width = `calc(${laneWidthPercent}% - ${((laneCount + 1) * laneGapPx) / laneCount}px)`;
            const left = `calc(${laneWidthPercent * lane}% + ${(lane + 1) * laneGapPx}px)`;
            const hasOverlap = Boolean(layout?.hasOverlap);
            const isTiny = height < 42;
            const isCompact = height < 66;
            const laneIsCrowded = laneCount > 2;
            const showTime = height >= 48 && !laneIsCrowded;
            const showStaffMeta = track === "staff" && height >= 168 && laneCount === 1;
            const densityClass = isTiny ? " timeline-block-tiny" : isCompact ? " timeline-block-compact" : "";
            const timeClass = showTime ? "" : " timeline-block-no-time";
            const stateClass =
              item.id === currentId
                ? " timeline-block-current"
                : item.id === nextId
                  ? " timeline-block-next"
                  : "";
            const blockTitle = String(item.activity_name || "").trim() || "Untitled";
            const blockTimeFull = formatTimeRange(item.start_time, item.duration_minutes);
            const blockTimeCompact = formatCompactTimeRange(item.start_time, item.duration_minutes);
            const visibleTime = showTime ? blockTimeFull : blockTimeCompact || blockTimeFull;
            const visibleTitle = showTime ? blockTitle : `${visibleTime} · ${blockTitle}`;
            const blockDescription = [blockTitle, blockTimeFull, locationLabel].filter(Boolean).join(" · ");

            return (
              <article
                key={item.id}
                className={`timeline-block${hasOverlap ? " timeline-block-overlap" : ""}${densityClass}${timeClass}${stateClass}`}
                title={blockDescription}
                aria-label={blockDescription}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left,
                  width,
                  background: color.bg,
                  borderColor: color.border,
                }}
              >
                <p className="timeline-block-title">{visibleTitle}</p>
                {showTime ? (
                  <p className="timeline-block-time">{blockTimeFull}</p>
                ) : null}
                {showStaffMeta ? (
                  <p className="timeline-block-meta">
                    <span>Point: {item.point_person || "TBD"}</span>
                    <span>Rain: {item.rain_location || "N/A"}</span>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="timeline-scale">
          {hourlyTicks.map((minute) => {
            const top = (minute - scaleStart) * pxPerMinute;
            return (
              <div key={minute} className="timeline-scale-tick" style={{ top: `${top}px` }}>
                <span>{formatTimeLabel(addMinutesToTime("00:00", minute))}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
