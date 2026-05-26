"use client";

import { useMemo, useState } from "react";
import { addMinutesToTime, formatTimeLabel, formatTimeRange } from "../../lib/schedule";

function parseDuration(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export default function ScheduleTimeFields({
  idPrefix,
  startName = "start_time",
  durationName = "duration_minutes",
  defaultStartTime = "",
  defaultDuration = 45,
}) {
  const [startTime, setStartTime] = useState(defaultStartTime || "");
  const [durationMinutes, setDurationMinutes] = useState(defaultDuration);

  const endTime = useMemo(
    () => addMinutesToTime(startTime, durationMinutes),
    [startTime, durationMinutes],
  );
  const rangeLabel = useMemo(
    () => formatTimeRange(startTime, durationMinutes),
    [startTime, durationMinutes],
  );

  return (
    <>
      <div className="grid-two">
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}_start_time`}>
            Start Time
          </label>
          <input
            id={`${idPrefix}_start_time`}
            name={startName}
            type="time"
            className="input"
            defaultValue={defaultStartTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}_duration_minutes`}>
            Duration (minutes)
          </label>
          <input
            id={`${idPrefix}_duration_minutes`}
            name={durationName}
            type="number"
            min="1"
            max="360"
            className="input"
            defaultValue={defaultDuration}
            onChange={(event) => setDurationMinutes(parseDuration(event.target.value, defaultDuration))}
            required
          />
        </div>
      </div>
      <p className="time-preview">
        {rangeLabel ? (
          <>
            Expected time block: <strong>{rangeLabel}</strong>
          </>
        ) : (
          "Set start time and duration to preview end time."
        )}
        {endTime ? <span className="time-preview-end">Ends at {formatTimeLabel(endTime)}</span> : null}
      </p>
    </>
  );
}
