'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth/user-context';
import { bookingsApi, clockOffset, useCountdown } from '@/lib/bookings';
import { t } from '@/lib/i18n';

function Banner({ booking, offsetMs }) {
  const { expired, label } = useCountdown(booking.holdExpiresAt, offsetMs);
  if (expired) return null;
  return (
    <div role="status" className="border-b border-warning/30 bg-warning-soft">
      <p className="mx-auto max-w-page px-4 py-2 text-sm text-warning sm:px-6 lg:px-8">
        {t('booking.pendingBanner', { title: booking.tour.title, time: label })}{' '}
        <Link
          href={`/account/bookings/${booking.bookingReference}`}
          className="font-semibold underline"
        >
          {t('booking.payNow')}
        </Link>
      </p>
    </div>
  );
}

/**
 * Reminder about an unpaid booking whose seats are still held. Checked when the user signs in,
 * on navigation and when the tab regains focus; hidden on the booking pages themselves.
 */
export default function PendingBookingBanner() {
  const { user } = useUser();
  const pathname = usePathname();
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const check = () =>
      bookingsApi
        .mine('?status=pending&limit=1')
        .then((body) => {
          if (!cancelled) {
            setState(
              body.data[0]
                ? { booking: body.data[0], offsetMs: clockOffset(body.meta?.serverTime) }
                : null,
            );
          }
        })
        .catch(() => {});
    check();
    window.addEventListener('focus', check);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', check);
    };
  }, [user, pathname]);

  if (!user || !state || pathname.startsWith('/account/bookings') || pathname.endsWith('/book')) {
    return null;
  }
  return <Banner booking={state.booking} offsetMs={state.offsetMs} />;
}
