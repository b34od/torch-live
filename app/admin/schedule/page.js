import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "../../../components/ui/ConfirmSubmitButton";
import DayTabs from "../../../components/ui/DayTabs";
import ScheduleLocationSelect from "../../../components/ui/ScheduleLocationSelect";
import ScheduleTimeline from "../../../components/ui/ScheduleTimeline";
import ScheduleTimeFields from "../../../components/ui/ScheduleTimeFields";
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
  formatTimeLabel,
  formatTimeRange,
  resolveDayForTrack,
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

function scheduleTableForTrack(track) {
  return track === "staff" ? "staff_schedule_items" : "student_schedule_items";
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
    return { className: "alert alert-success", text: "Schedule item updated." };
  }

  if (params?.removed === "1") {
    return { className: "alert alert-success", text: "Schedule item removed." };
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

async function addScheduleItem(formData) {
  "use server";

  const { profile, user, supabase } = await requireUser(["admin"]);
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const table = scheduleTableForTrack(track);
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });
  const startTime = String(formData.get("start_time") || "").trim();
  const duration = parseDuration(formData.get("duration_minutes"));
  const activityName = String(formData.get("activity_name") || "").trim();
  const allowTimeOverlap = allowOverlap(formData);

  if (!startTime || !duration || !activityName) {
    redirect(pageUrl({ error: "Time, duration, and activity are required." }));
  }

  const { data: existingRows, error: existingError } = await supabase
    .from(table)
    .select("id, start_time, duration_minutes, activity_name")
    .eq("program_year", year)
    .eq("day_number", day)
    .order("start_time", { ascending: true });

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
    .from(table)
    .select("sort_order")
    .eq("program_year", year)
    .eq("day_number", day)
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

  const { error } = await supabase.from(table).insert(payload);

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
  const table = scheduleTableForTrack(track);
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });

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

  const { data: existingRows, error: existingError } = await supabase
    .from(table)
    .select("id, start_time, duration_minutes, activity_name")
    .eq("program_year", year)
    .eq("day_number", day)
    .order("start_time", { ascending: true });

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
    updated_by: user.id,
  };

  if (track === "staff") {
    payload.rain_location = normalizeText(formData.get("rain_location"));
    payload.point_person = normalizeText(formData.get("point_person"));
    payload.secondary_person = normalizeText(formData.get("secondary_person"));
    payload.notes = normalizeText(formData.get("notes"));
    payload.av_needs = normalizeText(formData.get("av_needs"));
  }

  const { error } = await supabase.from(table).update(payload).eq("id", id);

  if (error) {
    redirect(pageUrl({ error: error.message }));
  }

  redirect(pageUrl({ saved: "1" }));
}

async function removeScheduleItem(formData) {
  "use server";

  const { profile, supabase } = await requireUser(["admin"]);
  const id = String(formData.get("id") || "").trim();
  const track = parseTrack(formData.get("track"));
  const day = parseDay(formData.get("day"), track);
  const year = parseProgramYear(formData.get("program_year"), profile.program_year);
  const source = parseDraftSource(formData.get("source"));
  const table = scheduleTableForTrack(track);
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });

  if (!id) {
    redirect(pageUrl({ error: "Missing schedule item id." }));
  }

  const { error } = await supabase.from(table).delete().eq("id", id);

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
  const table = scheduleTableForTrack(track);
  const pageUrl = (params = {}, pageYear = year) =>
    schedulePageUrl(track, day, pageYear, { source, ...params });
  const columns =
    track === "staff"
      ? "day_number, start_time, duration_minutes, activity_name, location, rain_location, point_person, secondary_person, notes, av_needs, sort_order"
      : "day_number, start_time, duration_minutes, activity_name, location, sort_order";

  if (sourceYear === targetYear) {
    redirect(pageUrl({ error: "Source year and target year must be different." }));
  }

  const { data: existingTargetRows, error: targetCheckError } = await supabase
    .from(table)
    .select("id")
    .eq("program_year", targetYear)
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
    .from(table)
    .select(columns)
    .eq("program_year", sourceYear)
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
      sort_order: row.sort_order,
      updated_by: user.id,
    };

    if (track === "staff") {
      return {
        ...base,
        rain_location: row.rain_location,
        point_person: row.point_person,
        secondary_person: row.secondary_person,
        notes: row.notes,
        av_needs: row.av_needs,
      };
    }

    return base;
  });

  const { error: insertError } = await supabase.from(table).insert(insertRows);

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
  const table = scheduleTableForTrack(track);
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
    .from(table)
    .delete()
    .eq("program_year", clearYear)
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
  const table = scheduleTableForTrack(track);
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
      .from("student_schedule_items")
      .delete()
      .eq("program_year", year);
    if (clearStudentError) {
      redirect(pageUrl({ error: clearStudentError.message }));
    }

    const { error: clearStaffError } = await supabase
      .from("staff_schedule_items")
      .delete()
      .eq("program_year", year);
    if (clearStaffError) {
      redirect(pageUrl({ error: clearStaffError.message }));
    }

    if (studentRows.length > 0) {
      const { error: insertStudentError } = await supabase.from("student_schedule_items").insert(studentRows);
      if (insertStudentError) {
        redirect(pageUrl({ error: insertStudentError.message }));
      }
    }

    if (staffRows.length > 0) {
      const { error: insertStaffError } = await supabase.from("staff_schedule_items").insert(staffRows);
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

  const { error: clearError } = await supabase.from(table).delete().eq("program_year", year);
  if (clearError) {
    redirect(pageUrl({ error: clearError.message }));
  }

  const { error: insertError } = await supabase.from(table).insert(draftRows);
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

  const [studentYearsResponse, staffYearsResponse, scheduleResponse] = await Promise.all([
    supabase.from("student_schedule_items").select("program_year"),
    supabase.from("staff_schedule_items").select("program_year"),
    track === "staff"
      ? getStaffScheduleByDay(supabase, selectedYear, day)
      : getStudentScheduleByDay(supabase, selectedYear, day),
  ]);

  const years = [
    ...(studentYearsResponse.data || []).map((entry) => entry.program_year),
    ...(staffYearsResponse.data || []).map((entry) => entry.program_year),
  ];
  const yearOptions = getYearOptions(years, selectedYear, profile.program_year);

  const items = scheduleResponse.data || [];
  const error = scheduleResponse.error;
  const editingId = String(params?.edit || "").trim();
  const editingItem = items.find((item) => item.id === editingId) || null;
  const sortedItems = [...items].sort((a, b) => {
    const aStart = timeToMinutes(a.start_time) || 0;
    const bStart = timeToMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
  const firstItem = sortedItems[0] || null;
  const lastItem = sortedItems[sortedItems.length - 1] || null;
  const lastEndTime = lastItem ? addMinutesToTime(lastItem.start_time, lastItem.duration_minutes) : "";
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
          <a href="#schedule-overview" className="schedule-jump-link">
            Timeline
          </a>
          <a href="#schedule-add" className="schedule-jump-link">
            Add Item
          </a>
          <a href="#schedule-year-tools" className="schedule-jump-link">
            Year Tools
          </a>
          <a href="#schedule-items" className="schedule-jump-link">
            Items
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
              <strong>{formatTimeLabel(lastEndTime)}</strong>
            </p>
            <ScheduleTimeline
              items={sortedItems}
              track={track}
              showNowMarker={false}
              showConflicts
              dayNumber={day}
              programYear={selectedYear}
            />
          </>
        )}
      </section>

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
            <>
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
            </>
          ) : null}

          <button type="submit" className="button button-primary">
            Add Item
          </button>
        </form>
      </section>

      <section className="card" id="schedule-year-tools">
        <h2>Year Tools</h2>
        <p className="muted">Copy schedule blocks from one year to another after annual updates.</p>

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

            {track === "staff" ? (
              <>
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
              </>
            ) : null}

            <button type="submit" className="button button-primary">
              Save Item
            </button>
          </form>
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
              <details className="schedule-item-editor-panel" open={Boolean(editingItem)}>
                <summary>
                  Edit Items ({sortedItems.length})
                </summary>
                <div className="schedule-card-list mt-sm">
                  {sortedItems.map((item) => (
                    <article key={item.id} className="schedule-card">
                      <div className="schedule-card-header">
                        <span className="schedule-time">
                          {formatTimeRange(item.start_time, item.duration_minutes)}
                        </span>
                        <span className="schedule-duration">{item.duration_minutes}m</span>
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
                      <div className="schedule-card-actions">
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
                      </div>
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
