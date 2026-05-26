export const DAY_LABELS = {
  0: "Friday",
  1: "Saturday",
  2: "Sunday",
  3: "Monday",
  4: "Tuesday",
};

export const STUDENT_DAY_NUMBERS = [1, 2, 3, 4];
export const STAFF_DAY_NUMBERS = [0, 1, 2, 3, 4];

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
