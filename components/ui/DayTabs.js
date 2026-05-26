import Link from "next/link";
import { dayLabel as defaultDayLabel, STUDENT_DAY_NUMBERS } from "../../lib/schedule";

export default function DayTabs({
  basePath,
  selectedDay,
  days = STUDENT_DAY_NUMBERS,
  labelFormatter = defaultDayLabel,
}) {
  const [pathname, queryString] = basePath.split("?");
  const baseParams = new URLSearchParams(queryString || "");

  return (
    <nav className="day-tabs" aria-label="Program day">
      {days.map((day) => {
        const active = day === selectedDay;
        const params = new URLSearchParams(baseParams.toString());
        params.set("day", String(day));
        const href = `${pathname}?${params.toString()}`;

        return (
          <Link
            key={day}
            href={href}
            className={`day-tab ${active ? "day-tab-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {labelFormatter(day)}
          </Link>
        );
      })}
    </nav>
  );
}
