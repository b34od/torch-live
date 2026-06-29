import { formatTimeLabel, formatTimeRange } from "../../lib/schedule";

function locationColor(location) {
  const loc = String(location || "").toLowerCase();
  if (
    loc.includes("outside") ||
    loc.includes("quad") ||
    loc.includes("behind") ||
    loc.includes("grass") ||
    loc.includes("amphitheatre") ||
    loc.includes("field")
  ) {
    return { bg: "rgba(147,204,134,0.22)", border: "#33784c" };
  }
  if (loc.includes("classroom")) {
    return { bg: "rgba(238,183,95,0.24)", border: "#b87200" };
  }
  if (loc.includes("theatre") || loc.includes("theater")) {
    return { bg: "rgba(173,174,215,0.28)", border: "#5b5f92" };
  }
  if (loc.includes("dining") || loc.includes("d)")) {
    return { bg: "rgba(113,180,220,0.22)", border: "#2d6e9e" };
  }
  if (loc.includes("event room") || loc.includes("campus ctr") || loc.includes("campus center")) {
    return { bg: "rgba(237,103,103,0.18)", border: "#c44040" };
  }
  if (loc.includes("housing")) {
    return { bg: "rgba(255,180,195,0.22)", border: "#b04070" };
  }
  if (loc.includes("coffee") || loc.includes("coffeehouse")) {
    return { bg: "rgba(100,200,190,0.22)", border: "#2a8a80" };
  }
  if (loc.includes("trlc")) {
    return { bg: "rgba(237,103,103,0.18)", border: "#c44040" };
  }
  return { bg: "rgba(173,174,215,0.18)", border: "#8888aa" };
}

function cleanValue(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "n/a") return "";
  return text;
}

function hasOperationalDetails(item) {
  return Boolean(
    cleanValue(item.rain_location) ||
      cleanValue(item.secondary_person) ||
      cleanValue(item.notes) ||
      cleanValue(item.av_needs),
  );
}

function OperationalDetails({ item }) {
  const rainLocation = cleanValue(item.rain_location);
  const secondaryPerson = cleanValue(item.secondary_person);
  const notes = cleanValue(item.notes);
  const avNeeds = cleanValue(item.av_needs);

  if (!hasOperationalDetails(item)) return null;

  return (
    <details className="schedule-item-details">
      <summary>Ops details</summary>
      <div className="schedule-item-details-grid">
        {rainLocation ? (
          <p className="schedule-item-detail">
            <span className="schedule-label">Rain</span> {rainLocation}
          </p>
        ) : null}
        {secondaryPerson ? (
          <p className="schedule-item-detail">
            <span className="schedule-label">Backup</span> {secondaryPerson}
          </p>
        ) : null}
        {avNeeds ? (
          <p className="schedule-item-detail">
            <span className="schedule-label">AV</span> {avNeeds}
          </p>
        ) : null}
        {notes ? (
          <p className="schedule-item-detail">
            <span className="schedule-label">Notes</span> {notes}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function ScheduleCardContent({ item, track, showOperationalDetails }) {
  const lead = cleanValue(item.point_person);
  const color = locationColor(item.location);
  const isStaffTrack = track === "staff";
  const locationText = isStaffTrack ? item.location || "TBD" : item.location;

  return (
    <li
      key={item.id}
      className={`student-schedule-item ${isStaffTrack ? "schedule-list-item-staff" : ""}`}
      style={{ borderLeftColor: color.border, background: color.bg }}
    >
      <span className="student-schedule-time">{formatTimeLabel(item.start_time)}</span>
      <div className="schedule-list-body">
        <div className="schedule-list-heading">
          <span className="student-schedule-activity">{item.activity_name}</span>
          {isStaffTrack ? (
            <div className="schedule-item-badges">
              {item.visibility === "staff" ? (
                <span className="schedule-item-badge schedule-item-badge-staff">Staff only</span>
              ) : null}
              {lead ? <span className="schedule-item-badge schedule-item-badge-lead">Lead: {lead}</span> : null}
            </div>
          ) : null}
        </div>
        {locationText ? <span className="student-schedule-location">{locationText}</span> : null}
        {showOperationalDetails ? (
          <div className="schedule-item-meta">
            <span>{formatTimeRange(item.start_time, item.duration_minutes)}</span>
            <span>{item.duration_minutes}m</span>
            {cleanValue(item.rain_location) ? <span>Rain option noted</span> : null}
          </div>
        ) : null}
        {showOperationalDetails ? <OperationalDetails item={item} /> : null}
      </div>
    </li>
  );
}

function SplitBlock({ item }) {
  const color = locationColor(item.location);

  return (
    <div
      className="student-schedule-split-block"
      style={{ borderLeftColor: color.border, background: color.bg }}
    >
      {item.splitGroupLabel ? (
        <span className="student-schedule-group-label">{item.splitGroupLabel}</span>
      ) : null}
      <span className="student-schedule-activity">{item.activity_name}</span>
      {item.location ? <span className="student-schedule-location">{item.location}</span> : null}
    </div>
  );
}

export default function ScheduleList({
  items,
  track = "student",
  groupSplitPairs = false,
  showOperationalDetails = false,
}) {
  const elements = [];
  let index = 0;

  while (index < items.length) {
    const item = items[index];

    if (
      groupSplitPairs &&
      item.splitPairId &&
      index + 1 < items.length &&
      items[index + 1].splitPairId === item.splitPairId
    ) {
      const partner = items[index + 1];
      elements.push(
        <li key={item.splitPairId} className="student-schedule-split-row">
          <span className="student-schedule-time">{formatTimeLabel(item.start_time)}</span>
          <div className="student-schedule-split-pair">
            <SplitBlock item={item} />
            <SplitBlock item={partner} />
          </div>
        </li>,
      );
      index += 2;
      continue;
    }

    elements.push(
      <ScheduleCardContent
        key={item.id}
        item={item}
        track={track}
        showOperationalDetails={showOperationalDetails}
      />,
    );
    index += 1;
  }

  return (
    <ul className={`student-schedule-list ${track === "staff" ? "student-schedule-list-staff" : ""}`}>
      {elements}
    </ul>
  );
}
