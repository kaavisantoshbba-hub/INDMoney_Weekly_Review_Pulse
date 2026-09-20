import { daysInclusive, startOfDay } from "@/lib/dates";
import type { ReviewRow } from "@/lib/types";

export function windowStartFor(latest: Date, weeks: number): Date {
  const days = weeks * 7;
  const end = startOfDay(latest);
  const start = startOfDay(latest);
  start.setDate(end.getDate() - (days - 1));
  return start;
}

export function applyLookbackWindow(rows: ReviewRow[], weeks: number) {
  if (rows.length === 0) {
    return {
      kept: [] as ReviewRow[],
      excluded: 0,
      start: null as Date | null,
      end: null as Date | null,
      coverageWeeks: 0,
    };
  }

  const latest = rows.reduce(
    (max, row) => (row.date > max ? row.date : max),
    rows[0].date,
  );
  const earliest = rows.reduce(
    (min, row) => (row.date < min ? row.date : min),
    rows[0].date,
  );
  const start = windowStartFor(latest, weeks);
  const kept = rows.filter((row) => startOfDay(row.date) >= start);
  const coverageWeeks = daysInclusive(earliest, latest) / 7;

  return {
    kept,
    excluded: rows.length - kept.length,
    start,
    end: latest,
    coverageWeeks,
  };
}
