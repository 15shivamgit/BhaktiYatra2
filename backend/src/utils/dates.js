/**
 * Departure dates are calendar days in India. They are stored as midnight IST (UTC+05:30, no
 * daylight saving) and exchanged with clients as "YYYY-MM-DD" strings.
 */

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;
export const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in "YYYY-MM-DD" form. */
export function isValidYmd(value) {
  if (typeof value !== 'string' || !YMD_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** "2026-05-10" → Date at 2026-05-10 00:00 IST. */
export function istMidnight(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

/** Date → its calendar day in IST as "YYYY-MM-DD". */
export function toIstYmd(date) {
  return new Date(new Date(date).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Midnight IST of the current day in India. */
export function todayIst(now = new Date()) {
  return istMidnight(toIstYmd(now));
}

export function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * DAY_MS);
}

export function addMonths(date, months) {
  const ymd = toIstYmd(date);
  const [y, m, d] = ymd.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return istMidnight(target.toISOString().slice(0, 10));
}

/** "2026-05" → [start of May IST, start of June IST). */
export function istMonthRange(yearMonth) {
  const start = istMidnight(`${yearMonth}-01`);
  return [start, addMonths(start, 1)];
}

/** Whole days between two IST midnights (end − start). */
export function daysBetween(start, end) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS);
}
