import { addMinutesToTime, formatTimeLabel, formatTimeRange, timeToMinutes } from "../../lib/schedule";

const COLOR_PALETTE = [
  { bg: "rgba(237, 103, 103, 0.22)", border: "rgba(237, 103, 103, 0.65)" },
  { bg: "rgba(238, 183, 95, 0.24)", border: "rgba(212, 141, 25, 0.62)" },
  { bg: "rgba(147, 204, 134, 0.24)", border: "rgba(51, 120, 76, 0.62)" },
  { bg: "rgba(113, 60, 151, 0.18)", border: "rgba(90, 48, 121, 0.62)" },
  { bg: "rgba(173, 174, 215, 0.24)", border: "rgba(91, 95, 146, 0.62)" },
];

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

function timeBounds(item) {
  const start = timeToMinutes(item.start_time) || 0;
  const duration = Number(item.duration_minutes || 0);
  return {
    start,
    end: start + duration,
  };
}

export default function ScheduleTimeline({
  items,
  track,
  showNowMarker = true,
  showConflicts = false,
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
  const pxPerMinute = 1.2;
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

  const nowDate = new Date();
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const showNow = showNowMarker && nowMinutes >= scaleStart && nowMinutes <= scaleEnd;
  const nowTop = (nowMinutes - scaleStart) * pxPerMinute;

  let currentId = null;
  let nextId = null;
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
            const height = Math.max(durationMinutes * pxPerMinute, 54);
            const color = colorForLocation(item.location);
            const end = addMinutesToTime(item.start_time, item.duration_minutes);
            const stateClass =
              item.id === currentId
                ? " timeline-block-current"
                : item.id === nextId
                  ? " timeline-block-next"
                  : "";

            return (
              <article
                key={item.id}
                className={`timeline-block${stateClass}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  background: color.bg,
                  borderColor: color.border,
                }}
              >
                <p className="timeline-block-title">{item.activity_name}</p>
                <p className="timeline-block-time">{formatTimeRange(item.start_time, item.duration_minutes)}</p>
                <p className="timeline-block-meta">
                  <span>{item.location || "TBD"}</span>
                  <span>
                    {formatTimeLabel(item.start_time)} to {formatTimeLabel(end)}
                  </span>
                </p>
                {track === "staff" ? (
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
