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

export const SCHEDULE_LOCATIONS = [
  "TBD",
  "Main Hall",
  "Dining Hall",
  "Chapel",
  "Gym",
  "Classroom A",
  "Classroom B",
  "Leadership Lab",
  "Outdoor Field",
  "Lakefront",
  "Cabin Area",
  "Off-site",
];

export const RAIN_LOCATIONS = [
  "N/A",
  "Main Hall",
  "Dining Hall",
  "Chapel",
  "Gym",
  "Classroom A",
  "Classroom B",
  "Leadership Lab",
  "Cabin Area",
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
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(referenceDate);

  const readPart = (type) => parts.find((part) => part.type === type)?.value || "";
  const weekdayName = readPart("weekday");
  const weekdayIndex = WEEKDAY_NAME_TO_INDEX[weekdayName];
  const dayNumber = programDayNumberFromWeekdayIndex(weekdayIndex, track);
  const hour = Number.parseInt(readPart("hour"), 10);
  const minute = Number.parseInt(readPart("minute"), 10);
  const year = Number.parseInt(readPart("year"), 10);

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
