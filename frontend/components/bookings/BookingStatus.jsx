import { BOOKING_STATUS_TONES } from '@/lib/bookings';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const TONES = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  danger: 'bg-danger-soft text-danger',
  muted: 'bg-surface-muted text-text-muted',
};

/** Booking status as text with a tint (never colour alone). */
export default function BookingStatus({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[BOOKING_STATUS_TONES[status] ?? 'muted'],
        className,
      )}
    >
      {t(`booking.status.${status}`)}
    </span>
  );
}
