const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysInclusive(start: Date, end: Date): number {
  const ms = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export function weeksCovered(start: Date, end: Date): number {
  return daysInclusive(start, end) / 7;
}

export function formatDayMonthYear(date: Date, long = false): string {
  const months = long ? MONTHS_LONG : MONTHS_SHORT;
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRange(start: Date, end: Date, long = false): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  if (long) {
    if (sameYear) {
      return `${start.getDate()} ${MONTHS_LONG[start.getMonth()]} – ${end.getDate()} ${MONTHS_LONG[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${formatDayMonthYear(start, true)} – ${formatDayMonthYear(end, true)}`;
  }
  if (sameYear) {
    return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${formatDayMonthYear(start)} – ${formatDayMonthYear(end)}`;
}

/**
 * Parse day-first `dd-mm-yyyy[ hh:mm:ss]` or ISO 8601.
 * Slash dates such as mm/dd/yyyy are rejected as ambiguous.
 */
export function parseReviewDate(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.includes("/")) return null;

  const dmy = value.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const hour = dmy[4] ? Number(dmy[4]) : 0;
    const minute = dmy[5] ? Number(dmy[5]) : 0;
    const second = dmy[6] ? Number(dmy[6]) : 0;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const iso = new Date(value);
    if (Number.isNaN(iso.getTime())) return null;
    return iso;
  }

  return null;
}
