/** Parses "2026-09-16" as a local date (the Date constructor would treat it as UTC). */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Parses "2026-09-16T13:00[:00]" as local clinic time. */
export function parseLocalDateTime(isoDateTime: string): Date {
  const date = parseLocalDate(isoDateTime);
  const [hours, minutes] = isoDateTime.slice(11, 16).split(':').map(Number);
  date.setHours(hours, minutes);
  return date;
}

/** Today in the browser as "YYYY-MM-DD". */
export function todayIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
