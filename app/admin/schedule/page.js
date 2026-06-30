import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "../../../components/ui/ConfirmSubmitButton";
import DayTabs from "../../../components/ui/DayTabs";
import ScheduleLocationSelect from "../../../components/ui/ScheduleLocationSelect";
import ScheduleList from "../../../components/ui/ScheduleList";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import ScheduleTimeFields from "../../../components/ui/ScheduleTimeFields";
import ScheduleViewTabs from "../../../components/ui/ScheduleViewTabs";
import { requireUser } from "../../../lib/auth";
import { getStaffScheduleByDay, getStudentScheduleByDay } from "../../../lib/data";
import {
  getScheduleDraftCounts,
  getScheduleDraftDaySummaries,
  getScheduleDraftRows,
  getScheduleDraftSourceLabel,
  getScheduleDraftSourceOptions,
  normalizeScheduleDraftSource,
} from "../../../lib/schedule-drafts";
import {
  addMinutesToTime,
  dayLabel,
  dayNumbersForTrack,
  expandScheduleSplitPairs,
  formatTimeLabel,
  formatTimeRange,
  programDaySortMinutes,
  resolveDayForTrack,
  simplifyStudentActivityName,
  simplifyStudentLocation,
  timeToMinutes,
} from "../../../lib/schedule";

const MIN_YEAR = 2020;
const MAX_YEAR = 2100;

function parseDay(value, track) {
  return resolveDayForTrack(value, track);
}

function parseTrack(value) {
  return value === "staff" ? "staff" : "student";
}

function parseDraftSource(value) {
  return normalizeScheduleDraftSource(value);
}

function parseProgramYear(value, fallback) {
  const year = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return fallback;
  }
  return year;
}

function schedulePageUrl(track, day, year, params = {}) {
  const search = new URLSearchParams({
    track,
    day: String(day),
    year: String(year),
  });

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  return `/admin/schedule?${search.toString()}`;
}

const SCHEDULE_TABLE = "schedule_items";

function visibilityOptionsForTrackDay(track, day) {
  if (track === "student") return ["students", "both"];
  return day === 0 ? ["staff"] : ["staff", "both"];
}

function defaultVisibilityForTrackDay(track, day) {
  if (track === "student") return "both";
  return day === 0 ? "staff" : "staff";
}

function canEditItemFromTrack(track, item) {
  if (!item) return false;
  if (track === "student") {
    return item.visibility !== "staff";
  }
  if (Number(item.day_number) === 0) return item.visibility === "staff";
  return item.visibility === "staff";
}

function getYearOptions(years, selectedYear, fallbackYear) {
  const set = new Set([selectedYear, fallbackYear]);
  years.forEach((year) => {
    if (Number.isFinite(Number(year))) {
      set.add(Number(year));
    }
  });

  return [...set].sort((a, b) => b - a);
}

function alertFromParams(params) {
  if (params?.added === "1") {
    return { className: "alert alert-success", text: "Schedule item added." };
  }

  if (params?.saved === "1") {
    const shiftedCount = Number(params?.shifted_count || 0);
    if (shiftedCount > 0) {
      return {
        className: "alert alert-success",
        text: `Schedule item updated. Shifted ${shiftedCount} dependent item${shiftedCount === 1 ? "" : "s"}.`,
      };
    }
    return { className: "alert alert-success", text: "Schedule item updated." };
  }

  if (params?.removed === "1") {
    return { className: "alert alert-success", text: "Schedule item removed." };
  }

  if (params?.dependency_added === "1") {
    return { className: "alert alert-success", text: "Dependency saved for this schedule item." };
  }

  if (params?.dependency_removed === "1") {
    return { className: "alert alert-success", text: "Dependency removed." };
  }

  if (params?.draft_loaded === "1") {
    const count = Number(params?.count || 0);
    const scope = String(params?.scope || "track");
    const sourceLabel = getScheduleDraftSourceLabel(params?.source);
    return {
      className: "alert alert-success",
      text:
        scope === "both"
          ? `Loaded ${count} draft schedule item${count === 1 ? "" : "s"} for both staff and student tracks in this year from ${sourceLabel}.`
          : `Loaded ${count} draft schedule item${count === 1 ? "" : "s"} for this track/year from ${sourceLabel}.`,
    };
  }

  if (params?.cloned === "1") {
    const count = Number(params?.count || 0);
    return {
      className: "alert alert-success",
      text: `Copied ${count} schedule item${count === 1 ? "" : "s"} to the target year.`,
    };
  }

  if (params?.cleared === "1") {
    const count = Number(params?.count || 0);
    return {
      className: "alert alert-success",
      text: `Cleared ${count} schedule item${count === 1 ? "" : "s"} from that year.`,
    };
  }

  if (params?.error) {
    return { className: "alert alert-error", text: params.error };
  }

  return null;
}

function scheduleSwitcher(track, day, year, source) {
  const studentDay = parseDay(day, "student");
  const staffDay = parseDay(day, "staff");

  return (
    <div className="day-tabs" aria-label="Schedule type">
      <Link
        href={schedulePageUrl("student", studentDay, year, { source })}
        className={`day-tab ${track === "student" ? "day-tab-active" : ""}`}
      >
        Student Schedule
      </Link>
      <Link
        href={schedulePageUrl("staff", staffDay, year, { source })}
        className={`day-tab ${track === "staff" ? "day-tab-active" : ""}`}
      >
        Staff Schedule
      </Link>
    </div>
  );
}

function parseDuration(value) {
  const minutes = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 360) {
    return null;
  }
  return minutes;
}

function normalizeText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function allowOverlap(formData) {
  return String(formData.get("allow_overlap") || "") === "1";
}

function shouldShiftDependencies(formData) {
  return String(formData.get("shift_dependencies") || "") === "1";
}

function timeWindow(startTime, durationMinutes) {
  const start = timeToMinutes(startTime);
  if (start === null) return null;
  const duration = Number(durationMinutes || 0);
  return {
    start,
    end: start + duration,
  };
}

function firstOverlap(rows, startTime, durationMinutes, excludeId = null) {
  const candidate = timeWindow(startTime, durationMinutes);
  if (!candidate) return null;

  for (const row of rows || []) {
    if (excludeId && row.id === excludeId) continue;
    const existing = timeWindow(row.start_time, row.duration_minutes);
    if (!existing) continue;
    const overlaps = candidate.start < existing.end && candidate.end > existing.start;
    if (overlaps) return row;
  }

  return null;
}

async function listEditableRowsForTrackDay(supabase, year, track, day) {
  let query = supabase
    .from(SCHEDULE_TABLE)
    .select("id, day_number, start_time, duration_minutes, activity_name, visibility, sort_order")
    .eq("program_year", year)
    .eq("day_number", day)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  query = query.in("visibility", visibilityOptionsForTrackDay(track, day));
  return query;
}

async function listDependentsForSource(supabase, sourceItemId) {
  const { data: links, error: linksError } = await supabase
    .from("schedule_dependencies")
    .select("id, dependent_item_id, offset_minutes, relation_type")
    .eq("source_item_id", sourceItemId)
    .order("created_at", { ascending: true });

  if (linksError) {
    return { data: [], error: linksError };
  }

  const dependentIds = [...new Set((links || []).map((entry) => entry.dependent_item_id).filter(Boolean))];
  if (!dependentIds.length) {
    return { data: [], error: null };
  }

  const { data: dependentItems, error: dependentError } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id, day_number, start_time, duration_minutes, activity_name, visibility")
    .in("id", dependentIds);

  if (dependentError) {
    return { data: [], error: dependentError };
  }

  const dependentById = new Map((dependentItems || []).map((entry) => [entry.id, entry]));
  const merged = (links || [])
    .map((link) => {
      const dependent = dependentById.get(link.dependent_item_id);
      if (!dependent) return null;
      return {
        ...link,
        dependent,
      };
    })
    .filter(Boolean);

  return { data: merged, error: null };
}

async function applyDependencyShift(supabase, sourceItem, userId) {
  const { data: links, error: linksError } = await listDependentsForSource(supabase, sourceItem.id);
  if (linksError) {
    return { shiftedCount: 0, error: linksError };
  }

  if (!links.length) {
    return { shiftedCount: 0, error: null };
  }

  if (!Number.isFinite(timeToMinutes(sourceItem.start_time))) {
    return { shiftedCount: 0, error: null };
  }

  const updates = links
    .map((entry) => {
      if (!Number.isFinite(timeToMinutes(entry.dependent.start_time))) return null;
      const nextStart = addMinutesToTime(sourceItem.start_time, Number(entry.offset_minutes || 0));
      if (!nextStart) return null;
      return {
        id: entry.dependent.id,
        start_time: nextStart,
      };
    })
    .filter(Boolean);

  if (!updates.length) {
    return { shiftedCount: 0, error: null };
  }

  for (const entry of updates) {
    const { error } = await supabase
      .from(SCHEDULE_TABLE)
      .update({ start_time: entry.start_time, updated_by: userId })
      .eq("id", entry.id);
    if (error) {
      return { shiftedCount: 0, error };
    }
  }

  return { shiftedCount: updates.length, error: null };
}

async function addScheduleItem(formData) {
  "use server";

  const { profile, user, supabase } = await requireUser(["admin"]);
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });
  const startTime = String(formData.get("start_time") || "").trim();
  const duration = parseDuration(formData.get("duration_minutes"));
  const activityName = String(formData.get("activity_name") || "").trim();
  const allowTimeOverlap = allowOverlap(formData);
  const visibility = defaultVisibilityForTrackDay(track, day);

  if (!startTime || !duration || !activityName) {
    redirect(pageUrl({ error: "Time, duration, and activity are required." }));
  }

  const { data: existingRows, error: existingError } = await listEditableRowsForTrackDay(
    supabase,
    year,
    track,
    day,
  );

  if (existingError) {
    redirect(pageUrl({ error: existingError.message }));
  }

  const conflict = firstOverlap(existingRows, startTime, duration);
  if (conflict && !allowTimeOverlap) {
    redirect(
      pageUrl({
        error: `Overlap with ${conflict.activity_name} (${formatTimeRange(conflict.start_time, conflict.duration_minutes)}). Adjust time or check Allow overlap.`,
      }),
    );
  }

  const { data: lastRows } = await supabase
    .from(SCHEDULE_TABLE)
    .select("sort_order")
    .eq("program_year", year)
    .eq("day_number", day)
    .eq("visibility", visibility)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (lastRows?.[0]?.sort_order || 0) + 1;

  const payload = {
    program_year: year,
    day_number: day,
    start_time: startTime,
    duration_minutes: duration,
    activity_name: activityName,
    location: normalizeText(formData.get("location")),
    visibility,
    sort_order: nextSort,
    updated_by: user.id,
  };

  if (track === "staff") {
    payload.rain_location = normalizeText(formData.get("rain_location"));
    payload.point_person = normalizeText(formData.get("point_person"));
    payload.secondary_person = normalizeText(formData.get("secondary_person"));
    payload.notes = normalizeText(formData.get("notes"));
    payload.av_needs = normalizeText(formData.get("av_needs"));
  }

  const { error } = await supabase.from(SCHEDULE_TABLE).insert(payload);

  if (error) {
    redirect(pageUrl({ error: error.message }));
  }

  redirect(pageUrl({ added: "1" }));
}

async function updateScheduleItem(formData) {
  "use server";

  const { profile, user, supabase } = await requireUser(["admin"]);
  const id = String(formData.get("id") || "").trim();
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });
  const shiftDependencies = shouldShiftDependencies(formData);

  if (!id) {
    redirect(pageUrl({ error: "Missing schedule item id." }));
  }

  const startTime = String(formData.get("start_time") || "").trim();
  const duration = parseDuration(formData.get("duration_minutes"));
  const activityName = String(formData.get("activity_name") || "").trim();
  const allowTimeOverlap = allowOverlap(formData);

  if (!startTime || !duration || !activityName) {
    redirect(pageUrl({ error: "Time, duration, and activity are required." }));
  }

  const { data: existingItem, error: existingItemError } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id, day_number, visibility, start_time")
    .eq("id", id)
    .eq("program_year", year)
    .maybeSingle();

  if (existingItemError) {
    redirect(pageUrl({ error: existingItemError.message }));
  }

  if (!existingItem) {
    redirect(pageUrl({ error: "Schedule item was not found for this year." }));
  }

  if (!canEditItemFromTrack(track, existingItem)) {
    redirect(
      pageUrl({
        error:
          track === "staff"
            ? "Edit shared schedule items from the Student track. Staff track is for staff-only operations."
            : "This item can only be edited from the Staff track.",
      }),
    );
  }

  const { data: existingRows, error: existingError } = await listEditableRowsForTrackDay(
    supabase,
    year,
    track,
    day,
  );

  if (existingError) {
    redirect(pageUrl({ error: existingError.message }));
  }

  const conflict = firstOverlap(existingRows, startTime, duration, id);
  if (conflict && !allowTimeOverlap) {
    redirect(
      pageUrl({
        error: `Overlap with ${conflict.activity_name} (${formatTimeRange(conflict.start_time, conflict.duration_minutes)}). Adjust time or check Allow overlap.`,
      }),
    );
  }

  const payload = {
    program_year: year,
    day_number: day,
    start_time: startTime,
    duration_minutes: duration,
    activity_name: activityName,
    location: normalizeText(formData.get("location")),
    visibility: track === "student" ? existingItem.visibility || "both" : "staff",
    updated_by: user.id,
  };

  if (track === "staff") {
    payload.rain_location = normalizeText(formData.get("rain_location"));
    payload.point_person = normalizeText(formData.get("point_person"));
    payload.secondary_person = normalizeText(formData.get("secondary_person"));
    payload.notes = normalizeText(formData.get("notes"));
    payload.av_needs = normalizeText(formData.get("av_needs"));
  }

  const { error } = await supabase.from(SCHEDULE_TABLE).update(payload).eq("id", id);

  if (error) {
    redirect(pageUrl({ error: error.message }));
  }

  let shiftedCount = 0;
  if (shiftDependencies) {
    const { shiftedCount: shifted, error: dependencyShiftError } = await applyDependencyShift(supabase, {
      id,
      start_time: startTime,
    }, user.id);
    if (dependencyShiftError) {
      redirect(pageUrl({ error: dependencyShiftError.message }));
    }
    shiftedCount = shifted;
  }

  redirect(pageUrl({ saved: "1", shifted_count: shiftedCount }));
}

async function removeScheduleItem(formData) {
  "use server";

  const { profile, supabase } = await requireUser(["admin"]);
  const id = String(formData.get("id") || "").trim();
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });

  if (!id) {
    redirect(pageUrl({ error: "Missing schedule item id." }));
  }

  const { data: targetItem, error: targetItemError } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id, day_number, visibility")
    .eq("id", id)
    .eq("program_year", year)
    .maybeSingle();

  if (targetItemError) {
    redirect(pageUrl({ error: targetItemError.message }));
  }

  if (!targetItem) {
    redirect(pageUrl({ error: "Schedule item not found." }));
  }

  if (!canEditItemFromTrack(track, targetItem)) {
    redirect(
      pageUrl({
        error:
          track === "staff"
            ? "Remove shared schedule items from the Student track."
            : "This item can only be removed from the Staff track.",
      }),
    );
  }

  const { error } = await supabase.from(SCHEDULE_TABLE).delete().eq("id", id);

  if (error) {
    redirect(pageUrl({ error: error.message }));
  }

  redirect(pageUrl({ removed: "1" }));
}

async function cloneScheduleYear(formData) {
  "use server";

  const { profile, user, supabase } = await requireUser(["admin"]);
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const sourceYear = parseProgramYear(formData.get("source_year"), profile.program_year);
  const targetYear = parseProgramYear(formData.get("target_year"), profile.program_year);
  const visibilityOptions = track === "staff" ? ["staff"] : ["students", "both"];
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });
  const columns =
    "day_number, start_time, duration_minutes, activity_name, location, visibility, rain_location, point_person, secondary_person, notes, av_needs, sort_order";

  if (sourceYear === targetYear) {
    redirect(pageUrl({ error: "Source year and target year must be different." }));
  }

  const { data: existingTargetRows, error: targetCheckError } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id")
    .eq("program_year", targetYear)
    .in("visibility", visibilityOptions)
    .limit(1);

  if (targetCheckError) {
    redirect(pageUrl({ error: targetCheckError.message }));
  }

  if ((existingTargetRows || []).length > 0) {
    redirect(
      pageUrl({
        error: `Target year ${targetYear} already has schedule data. Clear it first.`,
      }),
    );
  }

  const { data: sourceRows, error: sourceError } = await supabase
    .from(SCHEDULE_TABLE)
    .select(columns)
    .eq("program_year", sourceYear)
    .in("visibility", visibilityOptions)
    .order("day_number", { ascending: true })
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  if (sourceError) {
    redirect(pageUrl({ error: sourceError.message }));
  }

  if (!sourceRows?.length) {
    redirect(pageUrl({ error: `No rows found for ${sourceYear}.` }));
  }

  const insertRows = sourceRows.map((row) => {
    const base = {
      program_year: targetYear,
      day_number: row.day_number,
      start_time: row.start_time,
      duration_minutes: row.duration_minutes,
      activity_name: row.activity_name,
      location: row.location,
      visibility: row.visibility,
      sort_order: row.sort_order,
      updated_by: user.id,
      rain_location: row.rain_location,
      point_person: row.point_person,
      secondary_person: row.secondary_person,
      notes: row.notes,
      av_needs: row.av_needs,
    };
    return base;
  });

  const { error: insertError } = await supabase.from(SCHEDULE_TABLE).insert(insertRows);

  if (insertError) {
    redirect(pageUrl({ error: insertError.message }));
  }

  redirect(pageUrl({ cloned: "1", count: insertRows.length }, targetYear));
}

async function clearScheduleYear(formData) {
  "use server";

  const { profile, supabase } = await requireUser(["admin"]);
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const clearYear = parseProgramYear(formData.get("clear_year"), profile.program_year);
  const confirm = String(formData.get("confirm_text") || "").trim();
  const visibilityOptions = track === "staff" ? ["staff"] : ["students", "both"];
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });

  if (confirm !== String(clearYear)) {
    redirect(
      pageUrl({
        error: `Type ${clearYear} exactly in the confirmation box before clearing.`,
      }),
    );
  }

  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .delete()
    .eq("program_year", clearYear)
    .in("visibility", visibilityOptions)
    .select("id");

  if (error) {
    redirect(pageUrl({ error: error.message }));
  }

  redirect(pageUrl({ cleared: "1", count: data?.length || 0 }));
}

async function loadScheduleDraft(formData) {
  "use server";

  const { profile, user, supabase } = await requireUser(["admin"]);
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("load_source") || formData.get("source"));
  const scope = String(formData.get("load_scope") || "track").trim().toLowerCase();
  const isBothScope = scope === "both";
  const visibilityOptions = track === "staff" ? ["staff"] : ["students", "both"];
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });
  const confirmText = String(formData.get("load_confirm") || "")
    .trim()
    .toUpperCase();
  const requiredConfirmText = isBothScope ? `LOAD BOTH ${year}` : `LOAD ${year}`;

  if (confirmText !== requiredConfirmText) {
    redirect(
      pageUrl({
        error: `Type ${requiredConfirmText} exactly before loading the draft.`,
      }),
    );
  }

  if (isBothScope) {
    const studentRows = getScheduleDraftRows("student", year, user.id, source);
    const staffRows = getScheduleDraftRows("staff", year, user.id, source);
    if (!studentRows.length && !staffRows.length) {
      redirect(pageUrl({ error: "No draft rows available for this year." }));
    }

    const { error: clearStudentError } = await supabase
      .from(SCHEDULE_TABLE)
      .delete()
      .eq("program_year", year)
      .in("visibility", ["students", "both"]);
    if (clearStudentError) {
      redirect(pageUrl({ error: clearStudentError.message }));
    }

    const { error: clearStaffError } = await supabase
      .from(SCHEDULE_TABLE)
      .delete()
      .eq("program_year", year)
      .eq("visibility", "staff");
    if (clearStaffError) {
      redirect(pageUrl({ error: clearStaffError.message }));
    }

    if (studentRows.length > 0) {
      const { error: insertStudentError } = await supabase.from(SCHEDULE_TABLE).insert(studentRows);
      if (insertStudentError) {
        redirect(pageUrl({ error: insertStudentError.message }));
      }
    }

    if (staffRows.length > 0) {
      const { error: insertStaffError } = await supabase.from(SCHEDULE_TABLE).insert(staffRows);
      if (insertStaffError) {
        redirect(pageUrl({ error: insertStaffError.message }));
      }
    }

    const total = studentRows.length + staffRows.length;
    redirect(
      pageUrl({
        draft_loaded: "1",
        count: total,
        scope: "both",
      }),
    );
  }

  const draftRows = getScheduleDraftRows(track, year, user.id, source);
  if (!draftRows.length) {
    redirect(pageUrl({ error: "No draft rows available for this track." }));
  }

  const { error: clearError } = await supabase
    .from(SCHEDULE_TABLE)
    .delete()
    .eq("program_year", year)
    .in("visibility", visibilityOptions);
  if (clearError) {
    redirect(pageUrl({ error: clearError.message }));
  }

  const { error: insertError } = await supabase.from(SCHEDULE_TABLE).insert(draftRows);
  if (insertError) {
    redirect(pageUrl({ error: insertError.message }));
  }

  redirect(
    pageUrl({
      draft_loaded: "1",
      count: draftRows.length,
      scope: "track",
    }),
  );
}

async function addScheduleDependency(formData) {
  "use server";

  const { profile, user, supabase } = await requireUser(["admin"]);
  const sourceItemId = String(formData.get("source_item_id") || "").trim();
  const dependentItemId = String(formData.get("dependent_item_id") || "").trim();
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });

  if (!sourceItemId || !dependentItemId) {
    redirect(pageUrl({ error: "Choose a source item and dependent item.", edit: sourceItemId || "" }));
  }

  if (sourceItemId === dependentItemId) {
    redirect(pageUrl({ error: "A schedule item cannot depend on itself.", edit: sourceItemId }));
  }

  const { data: sourceItem, error: sourceError } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id, day_number, start_time, visibility")
    .eq("id", sourceItemId)
    .eq("program_year", year)
    .maybeSingle();
  if (sourceError) {
    redirect(pageUrl({ error: sourceError.message, edit: sourceItemId }));
  }
  if (!sourceItem) {
    redirect(pageUrl({ error: "Source schedule item not found.", edit: sourceItemId }));
  }
  if (!canEditItemFromTrack(track, sourceItem)) {
    redirect(pageUrl({ error: "Source item is not editable in this track.", edit: sourceItemId }));
  }

  const { data: dependentItem, error: dependentError } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id, start_time")
    .eq("id", dependentItemId)
    .eq("program_year", year)
    .maybeSingle();
  if (dependentError) {
    redirect(pageUrl({ error: dependentError.message, edit: sourceItemId }));
  }
  if (!dependentItem) {
    redirect(pageUrl({ error: "Dependent schedule item not found.", edit: sourceItemId }));
  }

  const sourceStart = timeToMinutes(sourceItem.start_time);
  const dependentStart = timeToMinutes(dependentItem.start_time);
  if (!Number.isFinite(sourceStart) || !Number.isFinite(dependentStart)) {
    redirect(pageUrl({ error: "Could not calculate dependency offset from the selected times.", edit: sourceItemId }));
  }

  const offsetMinutes = dependentStart - sourceStart;
  const { error } = await supabase.from("schedule_dependencies").upsert(
    {
      source_item_id: sourceItemId,
      dependent_item_id: dependentItemId,
      relation_type: "shift_with",
      offset_minutes: offsetMinutes,
      updated_by: user.id,
    },
    { onConflict: "source_item_id,dependent_item_id,relation_type" },
  );

  if (error) {
    redirect(pageUrl({ error: error.message, edit: sourceItemId }));
  }

  redirect(pageUrl({ dependency_added: "1", edit: sourceItemId }));
}

async function removeScheduleDependency(formData) {
  "use server";

  const { profile, supabase } = await requireUser(["admin"]);
  const id = String(formData.get("id") || "").trim();
  const sourceItemId = String(formData.get("source_item_id") || "").trim();
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });

  if (!id) {
    redirect(pageUrl({ error: "Missing dependency id.", edit: sourceItemId }));
  }

  const { error } = await supabase.from("schedule_dependencies").delete().eq("id", id);
  if (error) {
    redirect(pageUrl({ error: error.message, edit: sourceItemId }));
  }

  redirect(pageUrl({ dependency_removed: "1", edit: sourceItemId }));
}

export const metadata = {
  title: "Admin Schedule",
};

export default async function AdminSchedulePage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const { supabase, profile } = await requireUser(["admin"]);
  const track = parseTrack(params?.track);
  const day = parseDay(params?.day, track);
  const selectedYear = parseProgramYear(params?.year, profile.program_year);
  const alert = alertFromParams(params || {});
  const dayOptions = dayNumbersForTrack(track);

  const [yearsResponse, scheduleResponse] = await Promise.all([
    supabase.from(SCHEDULE_TABLE).select("program_year"),
    track === "staff"
      ? getStaffScheduleByDay(supabase, selectedYear, day)
      : getStudentScheduleByDay(supabase, selectedYear, day),
  ]);

  const years = (yearsResponse.data || []).map((entry) => entry.program_year);
  const yearOptions = getYearOptions(years, selectedYear, profile.program_year);

  const items = scheduleResponse.data || [];
  const error = scheduleResponse.error;
  const editingId = String(params?.edit || "").trim();
  const editingItem = items.find((item) => item.id === editingId) || null;
  const sortedItems = [...items].sort((a, b) => {
    const aStart = programDaySortMinutes(a.start_time) || 0;
    const bStart = programDaySortMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
  const firstItem = sortedItems[0] || null;
  const lastItem = sortedItems[sortedItems.length - 1] || null;
  const lastEndTime = lastItem ? addMinutesToTime(lastItem.start_time, lastItem.duration_minutes) : "";
  const studentPreviewItems =
    track === "student"
      ? expandScheduleSplitPairs(
          sortedItems.map((item) => ({
            ...item,
            activity_name: simplifyStudentActivityName(item.activity_name),
            location: simplifyStudentLocation(item.location),
          })),
          day,
        ).sort((a, b) => {
          const aStart = programDaySortMinutes(a.start_time) || 0;
          const bStart = programDaySortMinutes(b.start_time) || 0;
          if (aStart !== bStart) return aStart - bStart;
          if (a.splitPairId && a.splitPairId === b.splitPairId) return (a.splitLane || 0) - (b.splitLane || 0);
          return Number(a.sort_order || 0) - Number(b.sort_order || 0);
        })
      : [];
  const selectedDraftSource = parseDraftSource(params?.source);
  const draftCounts = getScheduleDraftCounts(selectedYear, selectedDraftSource);
  const draftSourceOptions = getScheduleDraftSourceOptions();
  const draftPreviewCurrentTrack = getScheduleDraftDaySummaries(
    track,
    selectedYear,
    selectedDraftSource,
  );
  const draftPreviewOtherTrack = getScheduleDraftDaySummaries(
    track === "staff" ? "student" : "staff",
    selectedYear,
    selectedDraftSource,
  );
  const dependencyResponse = editingItem
    ? await listDependentsForSource(supabase, editingItem.id)
    : { data: [], error: null };
  const dependencyLinks = dependencyResponse.data || [];
  const dependencyError = dependencyResponse.error;
  const dependencyCandidateResponse = editingItem
    ? await listEditableRowsForTrackDay(supabase, selectedYear, track, day)
    : { data: [], error: null };
  const dependencyCandidates = (dependencyCandidateResponse.data || [])
    .filter((entry) => entry.id !== editingItem?.id)
    .sort((a, b) => {
      const aStart = programDaySortMinutes(a.start_time) || 0;
      const bStart = programDaySortMinutes(b.start_time) || 0;
      if (aStart !== bStart) return aStart - bStart;
      return Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });
  const editingHasOperationalDetails = Boolean(
    editingItem &&
      (
        (editingItem.rain_location && editingItem.rain_location !== "N/A") ||
        editingItem.point_person ||
        editingItem.secondary_person ||
        editingItem.av_needs ||
        editingItem.notes
      ),
  );

  return (
    <>
      <section className="card" id="schedule-controls">
        <h2>Schedule Management</h2>
        <p className="muted">
          Manage student and staff schedules by day, with start/end time visibility and timeline
          interdependency preview.
        </p>
        {alert ? <p className={alert.className}>{alert.text}</p> : null}
        <form method="get" className="grid-two mt-md">
          <input type="hidden" name="source" value={selectedDraftSource} />
          <div className="field">
            <label className="label" htmlFor="track_picker">
              Track
            </label>
            <select id="track_picker" name="track" className="select" defaultValue={track}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="year_picker">
              Program Year
            </label>
            <select id="year_picker" name="year" className="select" defaultValue={selectedYear}>
              {yearOptions.map((year) => (
                <option value={year} key={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="day_picker">
              Day
            </label>
            <select id="day_picker" name="day" className="select" defaultValue={day}>
              {dayOptions.map((optionDay) => (
                <option value={optionDay} key={`day-${optionDay}`}>
                  {dayLabel(optionDay)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button button-secondary">
            Load Schedule
          </button>
        </form>

        <div className="mt-md">{scheduleSwitcher(track, day, selectedYear, selectedDraftSource)}</div>
        <div className="mt-sm">
          <DayTabs
            basePath={`/admin/schedule?track=${track}&year=${selectedYear}&source=${encodeURIComponent(selectedDraftSource)}`}
            selectedDay={day}
            days={dayOptions}
          />
        </div>

        <nav className="schedule-jump-nav mt-md" aria-label="Schedule editor sections">
          <a href="#schedule-items" className="schedule-jump-link schedule-jump-primary">
            Edit Items
          </a>
          <a href="#schedule-overview" className="schedule-jump-link">
            Timeline
          </a>
          <a href="#schedule-add" className="schedule-jump-link">
            Add Item
          </a>
          <a href="#schedule-year-tools" className="schedule-jump-link">
            Year Tools
          </a>
          {editingItem ? (
            <a href="#schedule-edit" className="schedule-jump-link">
              Edit Item
            </a>
          ) : null}
        </nav>
      </section>

      <section className="card" id="schedule-overview">
        <h2>
          {track === "staff" ? "Staff" : "Student"} Snapshot · {dayLabel(day)} · {selectedYear}
        </h2>
        {error ? (
          <p className="alert alert-error mt-md">{error.message}</p>
        ) : items.length === 0 ? (
          <p className="empty mt-md">No entries yet for {dayLabel(day)}. Add your first item below.</p>
        ) : (
          <>
            <p className="muted">
              {items.length} item{items.length === 1 ? "" : "s"} · starts at{" "}
              <strong>{formatTimeLabel(firstItem.start_time)}</strong> · ends at{" "}
              <strong>{formatTimeLabel(lastEndTime)}</strong> · Eastern Time (ET)
            </p>
            {track === "staff" && day > 0 ? (
              <p className="muted">
                Shared student timeline appears here for staff alignment. Edit shared blocks on the Student track; use Staff for Friday and staff-only add-ons.
              </p>
            ) : null}
            {track === "student" ? (
              <p className="muted">
                Showing simplified names and locations — exactly what students see.
              </p>
            ) : null}
            <ScheduleTimeline
              items={track === "student" && studentPreviewItems.length > 0 ? studentPreviewItems : sortedItems}
              track={track}
              showNowMarker={false}
              showConflicts={track === "staff"}
              dayNumber={day}
              programYear={selectedYear}
            />
          </>
        )}
      </section>

      {track === "student" && studentPreviewItems.length > 0 ? (
        <section className="card student-preview-card" id="schedule-student-preview">
          <h2>What Students See</h2>
          <p className="muted">
            This is exactly how students see the schedule for this day — simplified names, locations, and no staff-only items.
          </p>
          <div className="mt-sm">
            <ScheduleList items={studentPreviewItems} track="student" groupSplitPairs={true} />
          </div>
        </section>
      ) : null}

      <section className="card" id="schedule-add">
        <h2>Add Schedule Item</h2>
        <form action={addScheduleItem} className="stack mt-md">
          <input type="hidden" name="track" value={track} />
          <input type="hidden" name="day" value={day} />
          <input type="hidden" name="program_year" value={selectedYear} />
          <input type="hidden" name="source" value={selectedDraftSource} />
          <ScheduleTimeFields idPrefix="add" defaultDuration={45} />

          <div className="field">
            <label className="label" htmlFor="add_activity_name">
              Activity
            </label>
            <input id="add_activity_name" name="activity_name" className="input" required />
          </div>

          <ScheduleLocationSelect
            id="add_location"
            name="location"
            label="Location"
            type="primary"
            defaultValue="TBD"
          />

          <label className="inline-check">
            <input type="checkbox" name="allow_overlap" value="1" />
            <span>Allow overlap for this item (use only when intentional).</span>
          </label>

          {track === "staff" ? (
            <details className="admin-inline-expander">
              <summary>Operational details</summary>
              <div className="stack mt-md">
                <div className="grid-two">
                  <ScheduleLocationSelect
                    id="add_rain_location"
                    name="rain_location"
                    label="Rain Location"
                    type="rain"
                    defaultValue="N/A"
                  />
                  <div className="field">
                    <label className="label" htmlFor="add_point_person">
                      Point Person
                    </label>
                    <input id="add_point_person" name="point_person" className="input" />
                  </div>
                </div>
                <div className="grid-two">
                  <div className="field">
                    <label className="label" htmlFor="add_secondary_person">
                      Secondary Person
                    </label>
                    <input id="add_secondary_person" name="secondary_person" className="input" />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="add_av_needs">
                      A/V Needs
                    </label>
                    <input id="add_av_needs" name="av_needs" className="input" />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="add_notes">
                    Notes
                  </label>
                  <textarea id="add_notes" name="notes" className="textarea" />
                </div>
              </div>
            </details>
          ) : null}

          <button type="submit" className="button button-primary">
            Add Item
          </button>
        </form>
      </section>

      <section className="card" id="schedule-year-tools">
        <details className="admin-collapsible">
          <summary>
            <span className="admin-collapsible-title">Year Tools</span>
            <span className="admin-collapsible-meta">Load draft baselines, clone years, or clear schedule data.</span>
          </summary>
          <p className="muted mt-md">Copy schedule blocks from one year to another after annual updates.</p>

          <div className="surface surface-pad-sm mt-md">
          <h3 className="card-subtitle">Load 2026 Draft Baseline</h3>
          <p className="muted">
            Replaces existing {track} schedule entries for {selectedYear} with a draft baseline
            from the attached TORCH schedule references (student view + staff day zero prep).
          </p>
          <p className="muted">
            Draft rows: <strong>{draftCounts.student}</strong> student ·{" "}
            <strong>{draftCounts.staff}</strong> staff · <strong>{draftCounts.total}</strong> total
          </p>
          <div className="grid-two mt-sm">
            <div className="surface surface-pad-sm">
              <p className="schedule-label">
                {track === "staff" ? "Staff" : "Student"} draft preview
              </p>
              <div className="stack-sm">
                {draftPreviewCurrentTrack.map((entry) => (
                  <p className="muted" key={`preview-current-${entry.dayNumber}`}>
                    {dayLabel(entry.dayNumber)}: {entry.count} items · {entry.firstStartLabel} to{" "}
                    {entry.lastEndLabel}
                  </p>
                ))}
              </div>
            </div>
            <div className="surface surface-pad-sm">
              <p className="schedule-label">
                {track === "staff" ? "Student" : "Staff"} draft preview
              </p>
              <div className="stack-sm">
                {draftPreviewOtherTrack.map((entry) => (
                  <p className="muted" key={`preview-other-${entry.dayNumber}`}>
                    {dayLabel(entry.dayNumber)}: {entry.count} items · {entry.firstStartLabel} to{" "}
                    {entry.lastEndLabel}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <form action={loadScheduleDraft} className="stack mt-sm">
            <input type="hidden" name="track" value={track} />
            <input type="hidden" name="day" value={day} />
            <input type="hidden" name="program_year" value={selectedYear} />
            <input type="hidden" name="source" value={selectedDraftSource} />
            <div className="grid-two">
              <div className="field">
                <label className="label" htmlFor="load_source">
                  Draft Source
                </label>
                <select
                  id="load_source"
                  name="load_source"
                  className="select"
                  defaultValue={selectedDraftSource}
                >
                  {draftSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="load_scope">
                  Scope
                </label>
                <select id="load_scope" name="load_scope" className="select" defaultValue="track">
                  <option value="track">
                    Current Track Only ({track === "staff" ? "Staff" : "Student"})
                  </option>
                  <option value="both">Both Staff + Student Tracks</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="load_confirm">
                  Confirm Reload
                </label>
                <input
                  id="load_confirm"
                  name="load_confirm"
                  className="input"
                  placeholder={`LOAD ${selectedYear} or LOAD BOTH ${selectedYear}`}
                  required
                />
              </div>
            </div>
            <div className="field align-end">
              <button type="submit" className="button button-secondary">
                Load {selectedYear} Draft Baseline
              </button>
            </div>
          </form>
          </div>

          <form action={cloneScheduleYear} className="grid-two mt-md">
            <input type="hidden" name="track" value={track} />
            <input type="hidden" name="day" value={day} />
            <input type="hidden" name="program_year" value={selectedYear} />
            <input type="hidden" name="source" value={selectedDraftSource} />
            <div className="field">
              <label className="label" htmlFor="source_year">
                Source Year
              </label>
              <select id="source_year" name="source_year" className="select" defaultValue={selectedYear}>
                {yearOptions.map((year) => (
                  <option value={year} key={`source-${year}`}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="target_year">
                Target Year
              </label>
              <input
                id="target_year"
                name="target_year"
                type="number"
                min={MIN_YEAR}
                max={MAX_YEAR}
                className="input"
                defaultValue={selectedYear + 1}
                required
              />
            </div>
            <button type="submit" className="button button-secondary">
              Copy Year
            </button>
          </form>

          <form action={clearScheduleYear} className="stack mt-md">
            <input type="hidden" name="track" value={track} />
            <input type="hidden" name="day" value={day} />
            <input type="hidden" name="program_year" value={selectedYear} />
            <input type="hidden" name="source" value={selectedDraftSource} />
            <div className="grid-two">
              <div className="field">
                <label className="label" htmlFor="clear_year">
                  Clear Year
                </label>
                <select id="clear_year" name="clear_year" className="select" defaultValue={selectedYear}>
                  {yearOptions.map((year) => (
                    <option value={year} key={`clear-${year}`}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="confirm_text">
                  Type year to confirm
                </label>
                <input id="confirm_text" name="confirm_text" className="input" placeholder={`${selectedYear}`} />
              </div>
            </div>
            <button type="submit" className="button button-secondary">
              Clear Year Data
            </button>
          </form>
        </details>
      </section>

      {editingItem ? (
        <section className="card" id="schedule-edit">
          <h2>Edit Schedule Item</h2>
          <form action={updateScheduleItem} className="stack mt-md">
            <input type="hidden" name="id" value={editingItem.id} />
            <input type="hidden" name="track" value={track} />
            <input type="hidden" name="day" value={day} />
            <input type="hidden" name="program_year" value={selectedYear} />
            <input type="hidden" name="source" value={selectedDraftSource} />
            <ScheduleTimeFields
              idPrefix="edit"
              defaultStartTime={editingItem.start_time?.slice(0, 5)}
              defaultDuration={editingItem.duration_minutes}
            />

            <div className="field">
              <label className="label" htmlFor="edit_activity_name">
                Activity
              </label>
              <input
                id="edit_activity_name"
                name="activity_name"
                className="input"
                defaultValue={editingItem.activity_name}
                required
              />
            </div>

            <ScheduleLocationSelect
              id="edit_location"
              name="location"
              label="Location"
              type="primary"
              defaultValue={editingItem.location || "TBD"}
            />

            <label className="inline-check">
              <input type="checkbox" name="allow_overlap" value="1" />
              <span>Allow overlap for this item (use only when intentional).</span>
            </label>

            {dependencyLinks.length > 0 ? (
              <div className="surface surface-pad-sm">
                <p className="schedule-label">Dependency Shift</p>
                <p className="muted">
                  Keep linked items aligned when this time block moves. One save can shift all dependents by the same delta.
                </p>
                <label className="inline-check">
                  <input
                    type="checkbox"
                    name="shift_dependencies"
                    value="1"
                    defaultChecked
                  />
                  <span>
                    Shift {dependencyLinks.length} dependent item{dependencyLinks.length === 1 ? "" : "s"} with this change.
                  </span>
                </label>
                <div className="dependency-preview mt-sm">
                  <p className="schedule-label">Items that will shift:</p>
                  {dependencyLinks.map((link) => (
                    <p key={link.id} className="dependency-preview-item">
                      <strong>{link.dependent.activity_name}</strong>
                      {" "}— currently {formatTimeRange(link.dependent.start_time, link.dependent.duration_minutes)}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {track === "staff" ? (
              <details className="admin-inline-expander" open={editingHasOperationalDetails}>
                <summary>Operational details</summary>
                <div className="stack mt-md">
                  <div className="grid-two">
                    <ScheduleLocationSelect
                      id="edit_rain_location"
                      name="rain_location"
                      label="Rain Location"
                      type="rain"
                      defaultValue={editingItem.rain_location || "N/A"}
                    />
                    <div className="field">
                      <label className="label" htmlFor="edit_point_person">
                        Point Person
                      </label>
                      <input
                        id="edit_point_person"
                        name="point_person"
                        className="input"
                        defaultValue={editingItem.point_person || ""}
                      />
                    </div>
                  </div>
                  <div className="grid-two">
                    <div className="field">
                      <label className="label" htmlFor="edit_secondary_person">
                        Secondary Person
                      </label>
                      <input
                        id="edit_secondary_person"
                        name="secondary_person"
                        className="input"
                        defaultValue={editingItem.secondary_person || ""}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="edit_av_needs">
                        A/V Needs
                      </label>
                      <input
                        id="edit_av_needs"
                        name="av_needs"
                        className="input"
                        defaultValue={editingItem.av_needs || ""}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="edit_notes">
                      Notes
                    </label>
                    <textarea
                      id="edit_notes"
                      name="notes"
                      className="textarea"
                      defaultValue={editingItem.notes || ""}
                    />
                  </div>
                </div>
              </details>
            ) : null}

            <button type="submit" className="button button-primary">
              Save Item
            </button>
          </form>
          {dependencyError ? <p className="alert alert-error mt-md">{dependencyError.message}</p> : null}
          <div className="surface surface-pad-sm mt-md">
            <p className="schedule-label">Linked Dependencies</p>
            {dependencyLinks.length === 0 ? (
              <p className="muted">No dependencies configured for this item yet.</p>
            ) : (
              <div className="stack-sm">
                {dependencyLinks.map((entry) => (
                  <div key={entry.id} className="item-actions">
                    <p className="muted">
                      {formatTimeRange(entry.dependent.start_time, entry.dependent.duration_minutes)} ·{" "}
                      {entry.dependent.activity_name} · offset {entry.offset_minutes}m
                    </p>
                    <form action={removeScheduleDependency}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="source_item_id" value={editingItem.id} />
                      <input type="hidden" name="track" value={track} />
                      <input type="hidden" name="day" value={day} />
                      <input type="hidden" name="program_year" value={selectedYear} />
                      <input type="hidden" name="source" value={selectedDraftSource} />
                      <ConfirmSubmitButton
                        label="Remove Link"
                        className="button button-secondary"
                        confirmMessage="Remove this dependency?"
                      />
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface surface-pad-sm mt-md">
            <p className="schedule-label">Add Dependency</p>
            <p className="muted">
              Choose another block that should move with this item. Offset is calculated automatically.
            </p>
            <form action={addScheduleDependency} className="grid-two">
              <input type="hidden" name="source_item_id" value={editingItem.id} />
              <input type="hidden" name="track" value={track} />
              <input type="hidden" name="day" value={day} />
              <input type="hidden" name="program_year" value={selectedYear} />
              <input type="hidden" name="source" value={selectedDraftSource} />
              <div className="field">
                <label className="label" htmlFor="dependent_item_id">
                  Dependent Item
                </label>
                <select id="dependent_item_id" name="dependent_item_id" className="select" required>
                  <option value="">Select schedule item</option>
                  {dependencyCandidates.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {formatTimeRange(entry.start_time, entry.duration_minutes)} · {entry.activity_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field align-end">
                <button type="submit" className="button button-secondary">
                  Add Link
                </button>
              </div>
            </form>
          </div>
          <p className="muted mt-sm">
            <Link href={schedulePageUrl(track, day, selectedYear, { source: selectedDraftSource })}>
              Done editing
            </Link>
          </p>
        </section>
      ) : null}

      <section className="card" id="schedule-items">
        <h2>
          {track === "staff" ? "Staff" : "Student"} Schedule · {dayLabel(day)} · {selectedYear}
        </h2>

        {error ? (
          <p className="alert alert-error mt-md">{error.message}</p>
        ) : items.length === 0 ? (
          <p className="empty mt-md">No entries yet for {dayLabel(day)}.</p>
        ) : (
          <>
            <div className="mobile-only mt-md">
              <details className="schedule-item-editor-panel" open>
                <summary>
                  Edit Items ({sortedItems.length})
                </summary>
                <div className="schedule-card-list mt-sm">
                  {sortedItems.map((item) => (
                    <article key={item.id} className="schedule-card">
                      <div className="schedule-card-header">
                        <div className="schedule-card-time-group">
                          <span className="schedule-time">
                            {formatTimeRange(item.start_time, item.duration_minutes)}
                          </span>
                          <span className="schedule-duration">{item.duration_minutes}m</span>
                        </div>
                        <div className="schedule-card-inline-actions">
                          {canEditItemFromTrack(track, item) ? (
                            <>
                              <Link
                                href={schedulePageUrl(track, day, selectedYear, {
                                  edit: item.id,
                                  source: selectedDraftSource,
                                })}
                                className="schedule-card-action schedule-card-action-edit"
                              >
                                Edit
                              </Link>
                              <form action={removeScheduleItem} className="schedule-card-action-form">
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="track" value={track} />
                                <input type="hidden" name="day" value={day} />
                                <input type="hidden" name="program_year" value={selectedYear} />
                                <input type="hidden" name="source" value={selectedDraftSource} />
                                <ConfirmSubmitButton
                                  label="Remove"
                                  className="schedule-card-action schedule-card-action-remove"
                                  confirmMessage="Remove this schedule item?"
                                />
                              </form>
                            </>
                          ) : (
                            <span className="muted">Edit on Student track</span>
                          )}
                        </div>
                      </div>
                      <p className="schedule-activity">{item.activity_name}</p>
                      <p className="schedule-detail">
                        <span className="schedule-label">Location:</span> {item.location || "TBD"}
                      </p>
                      {track === "staff" ? (
                        <p className="schedule-detail">
                          <span className="schedule-label">Rain:</span> {item.rain_location || "N/A"} ·{" "}
                          <span className="schedule-label">Point:</span> {item.point_person || "TBD"}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </details>
            </div>

            <div className="table-wrap mt-md desktop-only">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Time Range</th>
                    <th>Duration</th>
                    <th>Activity</th>
                    <th>Location</th>
                    {track === "staff" ? (
                      <>
                        <th>Rain</th>
                        <th>Point</th>
                      </>
                    ) : null}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item.id}>
                      <td>{formatTimeRange(item.start_time, item.duration_minutes)}</td>
                      <td>{item.duration_minutes}m</td>
                      <td>{item.activity_name}</td>
                      <td>{item.location || "TBD"}</td>
                      {track === "staff" ? (
                        <>
                          <td>{item.rain_location || "N/A"}</td>
                          <td>{item.point_person || "TBD"}</td>
                        </>
                      ) : null}
                      <td>
                        <div className="schedule-table-actions">
                          {canEditItemFromTrack(track, item) ? (
                            <>
                              <Link
                                href={schedulePageUrl(track, day, selectedYear, {
                                  edit: item.id,
                                  source: selectedDraftSource,
                                })}
                                className="schedule-table-action schedule-table-action-edit"
                              >
                                Edit
                              </Link>
                              <form action={removeScheduleItem} className="schedule-table-action-form">
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="track" value={track} />
                                <input type="hidden" name="day" value={day} />
                                <input type="hidden" name="program_year" value={selectedYear} />
                                <input type="hidden" name="source" value={selectedDraftSource} />
                                <ConfirmSubmitButton
                                  label="Remove"
                                  className="schedule-table-action schedule-table-action-remove"
                                  confirmMessage="Remove this schedule item?"
                                />
                              </form>
                            </>
                          ) : (
                            <span className="muted">Edit on Student track</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </section>
    </>
  );
}
