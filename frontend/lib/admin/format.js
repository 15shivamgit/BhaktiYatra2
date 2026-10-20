/** Date and time in India for admin screens: "21 Oct 2026, 2:05 pm". */
export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

/** "payment_received_no_seats" → "payment received no seats" */
export const humanize = (value) => String(value ?? '').replaceAll('_', ' ');
