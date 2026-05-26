import {
  addMinutesToTime,
  dayLabel,
  dayNumbersForTrack,
  defaultDayForTrack,
  formatTimeLabel as formatScheduleTimeLabel,
  formatTimeRange,
  getProgramNowSnapshot,
  normalizeDayForTrack,
  PROGRAM_TIME_ZONE,
  timeToMinutes,
} from "./schedule";

function dayBounds(dayNumber, track) {
  return normalizeDayForTrack(dayNumber, track);
}

export {
  addMinutesToTime,
  dayLabel,
  dayNumbersForTrack,
  defaultDayForTrack,
  formatTimeRange,
};

export function getCurrentAndNextItem(items, options = {}) {
  const track = options?.track || null;
  const selectedDay =
    options?.selectedDay === null || options?.selectedDay === undefined
      ? null
      : Number(options.selectedDay);
  const programNow = getProgramNowSnapshot(track);
  const fallback = new Date();
  const currentMinutes = Number.isFinite(programNow.minutes)
    ? programNow.minutes
    : fallback.getHours() * 60 + fallback.getMinutes();
  const sorted = [...items].sort(
    (a, b) => (timeToMinutes(a.start_time) || 0) - (timeToMinutes(b.start_time) || 0),
  );

  const isSelectedDayCurrent =
    selectedDay === null || selectedDay === programNow.dayNumber;

  if (!isSelectedDayCurrent) {
    return {
      current: null,
      next: sorted[0] || null,
    };
  }

  let current = null;
  let next = null;

  for (let index = 0; index < sorted.length; index += 1) {
    const item = sorted[index];
    const start = timeToMinutes(item.start_time) || 0;
    const end = start + Number(item.duration_minutes || 0);

    if (currentMinutes >= start && currentMinutes < end) {
      current = item;
      next = sorted[index + 1] || null;
      break;
    }

    if (currentMinutes < start) {
      next = item;
      break;
    }
  }

  return { current, next };
}

export function formatTimeLabel(time) {
  return formatScheduleTimeLabel(time);
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: PROGRAM_TIME_ZONE,
  }).format(new Date(value));
}

export async function getStudentScheduleByDay(supabase, year, dayNumber) {
  const day = dayBounds(dayNumber, "student");
  const { data, error } = await supabase
    .from("student_schedule_items")
    .select("id, day_number, start_time, duration_minutes, activity_name, location, sort_order")
    .eq("program_year", year)
    .eq("day_number", day)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  return { data: data || [], error };
}

export async function getStaffScheduleByDay(supabase, year, dayNumber) {
  const day = dayBounds(dayNumber, "staff");
  const { data, error } = await supabase
    .from("staff_schedule_items")
    .select(
      "id, day_number, start_time, duration_minutes, activity_name, location, rain_location, point_person, secondary_person, notes, av_needs, sort_order",
    )
    .eq("program_year", year)
    .eq("day_number", day)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  return { data: data || [], error };
}

export async function getAnnouncements(supabase, year, limit = 40) {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, audience, is_push, is_pinned, created_at")
    .eq("program_year", year)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

export async function getResourceCategories(supabase, year) {
  const { data, error } = await supabase
    .from("resource_categories")
    .select(
      "id, name, icon, sort_order, resource_items(id, title, body, image_url, visibility, sort_order, updated_at)",
    )
    .eq("program_year", year)
    .order("sort_order", { ascending: true });

  const categories = (data || []).map((category) => ({
    ...category,
    resource_items: (category.resource_items || []).sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  }));

  return { data: categories, error };
}

export async function getUserProfiles(supabase, year = null) {
  let query = supabase
    .from("user_profiles")
    .select("id, full_name, email, role, program_year, is_active, created_at")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  if (Number.isFinite(Number(year))) {
    query = query.eq("program_year", Number(year));
  }

  const { data, error } = await query;

  return { data: data || [], error };
}
