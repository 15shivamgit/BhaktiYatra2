const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "05:30" → "5:30 am" (12-hour, Indian English style). */
export function formatTime(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return value ?? '';
  const [h, m] = value.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "05:30", "13:00" → "5:30 am – 1:00 pm" */
export function formatRange(open, close) {
  if (open && close) return `${formatTime(open)} – ${formatTime(close)}`;
  return formatTime(open || close);
}

export function monthName(month) {
  return MONTHS[month - 1] ?? '';
}

/** Distance label: 12.4 → "12 km", 0.6 → "600 m". */
export function formatDistance(km) {
  if (km === undefined || km === null) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`;
}

/** Google Maps directions link for coordinates. */
export function directionsUrl({ lat, lng }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** 24999 → "₹24,999" */
export function formatPrice(amount) {
  return typeof amount === 'number' ? INR.format(amount) : '';
}

const DATE_STYLES = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
};

/**
 * Calendar date from the API ("YYYY-MM-DD", already an Indian date) → "10 May", "10 May 2026" or
 * "Sun, 10 May 2026". Formatted in UTC so the day never shifts with the viewer's time zone.
 */
export function formatDate(ymd, style = 'medium') {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  return new Intl.DateTimeFormat('en-IN', { ...DATE_STYLES[style], timeZone: 'UTC' }).format(
    new Date(`${ymd}T00:00:00Z`),
  );
}

/** "10 – 16 May 2026" or "28 May – 3 Jun 2026" */
export function formatDateRange(start, end) {
  if (!end || start === end) return formatDate(start);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatDate(start, sameYear ? 'short' : 'medium')} – ${formatDate(end)}`;
}
