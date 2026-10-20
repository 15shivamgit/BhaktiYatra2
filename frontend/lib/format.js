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
