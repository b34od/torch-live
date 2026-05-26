import { RAIN_LOCATIONS, SCHEDULE_LOCATIONS } from "../../lib/schedule";

function locationOptionsForType(type) {
  return type === "rain" ? RAIN_LOCATIONS : SCHEDULE_LOCATIONS;
}

export default function ScheduleLocationSelect({
  id,
  name,
  label,
  type = "primary",
  defaultValue = "",
}) {
  const options = locationOptionsForType(type);
  const normalizedDefault = String(defaultValue || "").trim();
  const mergedOptions =
    normalizedDefault && !options.includes(normalizedDefault)
      ? [normalizedDefault, ...options]
      : options;
  const fallbackValue = normalizedDefault || mergedOptions[0] || "";

  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select id={id} name={name} className="select" defaultValue={fallbackValue}>
        {mergedOptions.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
