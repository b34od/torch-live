export const DAY_LABELS = {
  0: "Friday",
  1: "Saturday",
  2: "Sunday",
  3: "Monday",
  4: "Tuesday",
};

export const STUDENT_DAY_NUMBERS = [1, 2, 3, 4];
export const STAFF_DAY_NUMBERS = [0, 1, 2, 3, 4];
export const PROGRAM_TIME_ZONE = "America/New_York";

const WEEKDAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const WEEKDAY_INDEX_TO_PROGRAM_DAY = {
  5: 0, // Friday
  6: 1, // Saturday
  0: 2, // Sunday
  1: 3, // Monday
  2: 4, // Tuesday
};

// Dates when the weekday→program-day mapping is active (ET calendar date).
// Outside this window defaultDayForTrack is used so off-season visitors don't
// get a confusing "Saturday" default just because it happens to be Saturday.
const PROGRAM_WINDOWS = {
  2026: { startMonth: 7, startDay: 18, endMonth: 7, endDay: 21 },
};
const PROGRAM_DAY_ROLLOVER_CUTOFF_MINUTES = 4 * 60;

export const SCHEDULE_LOCATIONS = [
  "TBD",
  "Campus Center Theatre",
  "Campus Center Lobby",
  "Dining Hall",
  "Classrooms",
  "Event Room A",
  "Outside",
  "Housing 2",
  "Housing 2 & Outside",
  "Coffee House",
  "Coffeehouse",
  "Outdoor Amphitheatre",
  "J/K Wing Amphitheatre",
  "TRLC",
  "Outside – Behind N-Wing",
  "Outside – Quad",
  "Outside – Behind Arts & Sciences",
  "Transit / Walking Buffer",
  "Staff Lounge",
  "Meeting Room 5",
  "C/D Atrium",
  "Front of Campus",
  "Front of Campus Center",
];

export const RAIN_LOCATIONS = [
  "N/A",
  "Campus Center Theatre",
  "Event Room A",
  "Dining Hall",
  "Classrooms",
  "C/D Atrium",
  "Staff Lounge",
  "Underneath Overhang",
];

export function dayLabel(dayNumber) {
  return DAY_LABELS[Number(dayNumber)] || `Day ${dayNumber}`;
}

export function dayNumbersForTrack(track) {
  return track === "staff" ? STAFF_DAY_NUMBERS : STUDENT_DAY_NUMBERS;
}

export function defaultDayForTrack(track) {
  return track === "staff" ? 0 : 1;
}

export function normalizeDayForTrack(value, track) {
  const parsed = Number.parseInt(String(value || ""), 10);
  const allowed = new Set(dayNumbersForTrack(track));
  if (!Number.isFinite(parsed) || !allowed.has(parsed)) {
    return defaultDayForTrack(track);
  }
  return parsed;
}

export function resolveDayForTrack(value, track, referenceDate = new Date()) {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  if (raw) {
    return normalizeDayForTrack(raw, track);
  }

  const snapshot = getProgramNowSnapshot(track, referenceDate);
  if (typeof snapshot.dayNumber === "number") {
    return snapshot.dayNumber;
  }

  return defaultDayForTrack(track);
}

export function programDayNumberFromWeekdayIndex(weekdayIndex, track = null) {
  const dayNumber = WEEKDAY_INDEX_TO_PROGRAM_DAY[weekdayIndex];
  if (typeof dayNumber !== "number") return null;
  if (track === "student" && dayNumber === 0) return null;
  return dayNumber;
}

export function getProgramNowSnapshot(track = null, referenceDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PROGRAM_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(referenceDate);

  const readPart = (type) => parts.find((part) => part.type === type)?.value || "";
  const weekdayName = readPart("weekday");
  const weekdayIndex = WEEKDAY_NAME_TO_INDEX[weekdayName];
  const hour = Number.parseInt(readPart("hour"), 10);
  const minute = Number.parseInt(readPart("minute"), 10);
  const year = Number.parseInt(readPart("year"), 10);
  const month = Number.parseInt(readPart("month"), 10);
  const calDay = Number.parseInt(readPart("day"), 10);

  // Only map weekday → program day if we're inside the program window for this year.
  const window = PROGRAM_WINDOWS[year];
  const inWindow =
    window !== undefined &&
    Number.isFinite(month) &&
    Number.isFinite(calDay) &&
    (month > window.startMonth ||
      (month === window.startMonth && calDay >= window.startDay)) &&
    (month < window.endMonth ||
      (month === window.endMonth && calDay <= window.endDay));

  const dayNumber = inWindow ? programDayNumberFromWeekdayIndex(weekdayIndex, track) : null;

  return {
    dayNumber,
    minutes: Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null,
    year: Number.isFinite(year) ? year : null,
    weekdayIndex: Number.isFinite(weekdayIndex) ? weekdayIndex : null,
  };
}

export function timeToMinutes(value) {
  if (!value) return null;
  const [hourRaw = "0", minuteRaw = "0"] = String(value).split(":");
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function programDaySortMinutes(value, rolloverCutoffMinutes = PROGRAM_DAY_ROLLOVER_CUTOFF_MINUTES) {
  const minutes = timeToMinutes(value);
  if (!Number.isFinite(minutes)) return null;
  return minutes < rolloverCutoffMinutes ? minutes + 24 * 60 : minutes;
}

export function programDayNowMinutes(value, hasOvernightItems, rolloverCutoffMinutes = PROGRAM_DAY_ROLLOVER_CUTOFF_MINUTES) {
  if (!Number.isFinite(value)) return null;
  if (hasOvernightItems && value < rolloverCutoffMinutes) {
    return value + 24 * 60;
  }
  return value;
}

export function minutesToTime(value) {
  const dayMinutes = 24 * 60;
  const normalized = ((Math.round(Number(value) || 0) % dayMinutes) + dayMinutes) % dayMinutes;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function addMinutesToTime(startTime, durationMinutes) {
  const start = timeToMinutes(startTime);
  const duration = Number.parseInt(String(durationMinutes || ""), 10);
  if (start === null || !Number.isFinite(duration)) return "";
  return minutesToTime(start + duration);
}

export function formatTimeLabel(time) {
  if (!time) return "";
  const [hourRaw = "0", minuteRaw = "0"] = String(time).split(":");
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(startTime, durationMinutes) {
  const endTime = addMinutesToTime(startTime, durationMinutes);
  if (!startTime || !endTime) return "";
  return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

function normalizeScheduleText(value) {
  return String(value || "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function simplifyStudentActivityName(value) {
  const source = normalizeScheduleText(value);
  if (!source) return "";

  const lower = source.toLowerCase();
  if (lower.includes("power of leadership")) return "The Power of Leadership";
  if (lower.startsWith("what is a leader?") && lower.includes("cont")) return "What Is a Leader?";
  if (lower.startsWith("team meeting")) {
    const match = source.match(/^Team Meeting\s+(\d+)/i);
    return match ? `Team Meeting ${match[1]}` : "Team Meeting";
  }
  if (lower.startsWith("guild meeting")) {
    const match = source.match(/^Guild Meeting\s+(\d+)/i);
    return match ? `Guild Meeting ${match[1]}` : "Guild Meeting";
  }
  if (lower.startsWith("connection")) {
    const match = source.match(/^Connection\s+(\d+)/i);
    return match ? `Connection ${match[1]}` : "Connection";
  }
  if (lower.includes("group challenge") && lower.includes("debrief")) return "Debrief";
  if (lower.startsWith("escape to disorientation")) return "Team Meeting 7";
  if (lower === "disorientation") return "Disorientation";
  if (lower.includes("group challenge")) return "Senior Counselor Challenge";
  if (lower.includes("catered lunch")) return "Lunch w/ Team";
  if (lower.includes("team meeting 5")) return "Team Meeting 5";
  if (lower.startsWith("trust exercises")) return "Trust 2";
  if (lower.startsWith("trust: part i") || lower.startsWith("trust part i")) return "Trust 1";
  if (lower === "trust") return "Trust 3";
  if (lower.startsWith("presence")) return "Presence";
  if (lower.includes("gratitude") && lower.includes("connection")) return "Connection 4";
  if (lower.includes("candle ceremony")) return "Pass the TORCH";
  if (lower.startsWith("chips")) return "Debrief";
  if (lower.startsWith("follies") && !lower.includes("practice")) return "The TORCH Follies";
  if (lower.startsWith("follies")) return "Follies Rehearsal";
  if (lower === "dance") return "Free Time";
  if (lower.includes("bonfire")) return "Free Time";
  if (lower.startsWith("team final debrief")) return "TORCH Wrap Up";
  if (lower === "wake-up call") return "Wake-Up Call";
  if (lower.startsWith("lunch") && lower.includes("guild")) return "Lunch w/ Guild";
  if (lower.startsWith("lunch")) return "Lunch w/ Team";
  if (lower.startsWith("dinner") && lower.includes("team")) return "Dinner w/ Team";
  if (lower.startsWith("dinner")) return "Dinner w/ Guild";
  if (lower.startsWith("full check out")) return "Dress, Pack & Checkout";
  if (lower.startsWith("certificate handout")) return "Certificates & Departures";
  if (lower.startsWith("nonprofit")) return "Nonprofit Expo";
  if (lower.startsWith("team photos")) return "Group Photos";

  return source
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*-\s*(cont\.|continued)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function simplifyStudentLocation(value) {
  const source = normalizeScheduleText(value);
  if (!source || source === "-" || source === "—") return null;
  const lower = source.toLowerCase();

  if (lower.includes("dining")) return "Dining Hall";
  if (lower.includes("classroom")) return "Classrooms";
  if ((lower.includes("theatre") || lower.includes("theater")) && !lower.includes("amphitheat")) return "Campus Center Theatre";
  if (lower.includes("event room a")) return "Event Room A";
  if (lower.includes("campus center lobby")) return "Campus Center Lobby";
  if (lower.includes("housing")) return "Housing 2";
  if (lower.includes("coffee")) return "Coffee House";
  if (lower.includes("trlc")) return "TRLC";
  if (lower.includes("atrium")) return "Classrooms";
  if (lower.includes("front of campus")) return "Outside";
  if (
    lower.includes("outside") ||
    lower.includes("quad") ||
    lower.includes("grass") ||
    lower.includes("amphitheatre") ||
    lower.includes("amphitheater")
  ) {
    return "Outside";
  }

  return source;
}
