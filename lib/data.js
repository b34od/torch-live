import {
  addMinutesToTime,
  dayLabel,
  dayNumbersForTrack,
  defaultDayForTrack,
  formatTimeLabel as formatScheduleTimeLabel,
  formatTimeRange,
  getProgramNowSnapshot,
  normalizeDayForTrack,
  programDayNowMinutes,
  programDaySortMinutes,
  PROGRAM_TIME_ZONE,
  simplifyStudentActivityName,
  simplifyStudentLocation,
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
  const currentMinutesRaw = Number.isFinite(programNow.minutes)
    ? programNow.minutes
    : fallback.getHours() * 60 + fallback.getMinutes();
  const sorted = [...items].sort((a, b) => {
    const aStart = programDaySortMinutes(a.start_time) || 0;
    const bStart = programDaySortMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
  const hasOvernightItems = sorted.some((item) => {
    const minutes = timeToMinutes(item.start_time);
    return Number.isFinite(minutes) && minutes < 4 * 60;
  });
  const currentMinutes = programDayNowMinutes(currentMinutesRaw, hasOvernightItems) || currentMinutesRaw;

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
    const start = programDaySortMinutes(item.start_time) || 0;
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

export async function getStudentScheduleByDay(supabase, year, dayNumber, options = {}) {
  const day = dayBounds(dayNumber, "student");
  const { data, error } = await supabase
    .from("schedule_items")
    .select(
      "id, day_number, start_time, duration_minutes, activity_name, location, visibility, sort_order",
    )
    .eq("program_year", year)
    .eq("day_number", day)
    .in("visibility", ["students", "both"])
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  const rows = data || [];
  if (!options?.simplify) {
    return { data: rows, error };
  }

  const simplifiedRows = rows.map((row) => ({
    ...row,
    activity_name: simplifyStudentActivityName(row.activity_name),
    location: simplifyStudentLocation(row.location),
  }));

  return { data: simplifiedRows, error };
}

export async function getStaffScheduleByDay(supabase, year, dayNumber) {
  const day = dayBounds(dayNumber, "staff");
  const visibilityFilter = day === 0 ? ["staff"] : ["staff", "both"];
  const { data, error } = await supabase
    .from("schedule_items")
    .select(
      "id, day_number, start_time, duration_minutes, activity_name, location, visibility, rain_location, point_person, secondary_person, notes, av_needs, sort_order",
    )
    .eq("program_year", year)
    .eq("day_number", day)
    .in("visibility", visibilityFilter)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  return { data: data || [], error };
}

export async function getAnnouncements(supabase, year, limit = 40) {
  const { data, error } = await supabase
    .from("announcements")
    .select(
      "id, title, body, audience, message_type, recipient_scope, recipient_cohort, custom_recipients, is_push, is_pinned, send_sms, sms_delivery_status, created_at",
    )
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

export async function getProgramSetting(supabase, year, key) {
  const { data } = await supabase
    .from("program_settings")
    .select("value")
    .eq("program_year", year)
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function getGuildPreferencesForYear(supabase, year) {
  const { data, error } = await supabase
    .from("guild_preferences")
    .select("student_id, program_year, rank_1, rank_2, rank_3, submitted_at")
    .eq("program_year", year);
  return { data: data || [], error };
}

export async function getGuildAssignmentCounts(supabase, year) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("guild_id")
    .eq("program_year", year)
    .eq("role", "student")
    .eq("is_active", true)
    .not("guild_id", "is", null);

  const counts = new Map();
  (data || []).forEach(({ guild_id }) => {
    counts.set(guild_id, (counts.get(guild_id) || 0) + 1);
  });
  return { data: counts, error };
}

export async function getGuildPreferenceBoardData(supabase, year) {
  const [
    guildsResponse,
    preferencesResponse,
    studentsResponse,
    selectionOpenValue,
    assignmentCountsResponse,
  ] = await Promise.all([
    supabase
      .from("guilds")
      .select("id, slug, name, sort_order, is_active")
      .eq("program_year", year)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    getGuildPreferencesForYear(supabase, year),
    supabase
      .from("user_profiles")
      .select("id, full_name, team_key, guild_id")
      .eq("program_year", year)
      .eq("role", "student")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    getProgramSetting(supabase, year, "guild_selection_open"),
    getGuildAssignmentCounts(supabase, year),
  ]);

  const error =
    guildsResponse.error ||
    preferencesResponse.error ||
    studentsResponse.error ||
    assignmentCountsResponse.error ||
    null;

  const guilds = guildsResponse.data || [];
  const students = studentsResponse.data || [];
  const preferences = preferencesResponse.data || [];
  const assignmentCounts = assignmentCountsResponse.data || new Map();

  const guildMap = new Map(guilds.map((guild) => [guild.id, guild]));
  const preferenceMap = new Map(preferences.map((preference) => [preference.student_id, preference]));

  const rows = students.map((student) => {
    const preference = preferenceMap.get(student.id) || null;
    return {
      id: student.id,
      full_name: student.full_name,
      team_key: student.team_key,
      assigned_guild_id: student.guild_id ?? null,
      assigned_guild_name: student.guild_id ? guildMap.get(student.guild_id)?.name ?? null : null,
      submitted_at: preference?.submitted_at ?? null,
      rank_1_name: preference?.rank_1 ? guildMap.get(preference.rank_1)?.name ?? null : null,
      rank_2_name: preference?.rank_2 ? guildMap.get(preference.rank_2)?.name ?? null : null,
      rank_3_name: preference?.rank_3 ? guildMap.get(preference.rank_3)?.name ?? null : null,
    };
  });

  const counts = guilds.map((guild) => ({
    id: guild.id,
    name: guild.name,
    assigned_count: assignmentCounts.get(guild.id) || 0,
  }));

  return {
    data: {
      counts,
      rows,
      selectionOpen: selectionOpenValue === "true",
    },
    error,
  };
}

export async function getUserProfiles(supabase, year = null) {
  let query = supabase
    .from("user_profiles")
    .select("id, full_name, email, role, program_year, team_key, guild_id, room_number, phone_number, is_active, created_at, pronouns, specialty_tag, cotl_color, superpower")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  if (Number.isFinite(Number(year))) {
    query = query.eq("program_year", Number(year));
  }

  const { data, error } = await query;

  return { data: data || [], error };
}
