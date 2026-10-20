'use client';

import { CalendarDays, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Tabs, { tabPanelProps } from '@/components/admin/Tabs';
import BookingStatus from '@/components/bookings/BookingStatus';
import Alert from '@/components/ui/Alert';
import { buttonClasses } from '@/components/ui/Button';
import { errorMessage } from '@/lib/api/messages';
import { bookingsApi, clockOffset, groupBookings, useCountdown } from '@/lib/bookings';
import { formatDateRange, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

function PendingTimer({ expiresAt, offsetMs }) {
  const { expired, label } = useCountdown(expiresAt, offsetMs);
  return (
    <p className="text-sm font-medium text-warning">
      {expired ? t('booking.holdExpired') : `${t('booking.payWithin')} ${label}`}
    </p>
  );
}

function BookingCard({ booking, offsetMs }) {
  const href = `/account/bookings/${booking.bookingReference}`;
  return (
    <article className="relative flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-card sm:flex-row">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-md bg-surface-muted sm:w-40">
        {booking.tour.primaryImage && (
          <Image
            src={booking.tour.primaryImage.url}
            alt={booking.tour.primaryImage.alt || booking.tour.title}
            fill
            sizes="160px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatus status={booking.bookingStatus} />
          <span className="font-mono text-xs text-text-muted">{booking.bookingReference}</span>
        </div>
        <h3 className="mt-1 text-lg font-semibold text-text">
          <Link href={href} className="after:absolute after:inset-0 hover:text-primary">
            {booking.tour.title}
          </Link>
        </h3>
        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-muted">
          <li className="flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4" />
            {formatDateRange(booking.departure.startDate, booking.departure.endDate)}
          </li>
          <li className="flex items-center gap-1.5">
            <Users aria-hidden="true" className="size-4" />
            {t('booking.seatsCount', { count: booking.seats })}
          </li>
          <li className="font-semibold text-text">{formatPrice(booking.amount)}</li>
        </ul>
        {booking.bookingStatus === 'pending' && (
          <div className="mt-2">
            <PendingTimer expiresAt={booking.holdExpiresAt} offsetMs={offsetMs} />
          </div>
        )}
      </div>
      {booking.bookingStatus === 'pending' && (
        <div className="relative z-10 self-start sm:self-center">
          <Link href={href} className={buttonClasses({ size: 'sm' })}>
            {t('booking.payNow')}
          </Link>
        </div>
      )}
    </article>
  );
}

/** /account/bookings: tabs Upcoming · Past · Cancelled (docs/06-design/02-page-specs.md). */
export default function MyBookings() {
  const [state, setState] = useState({ data: null, offsetMs: 0, error: null });
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    let cancelled = false;
    bookingsApi
      .mine('?limit=50')
      .then((body) => {
        if (!cancelled) {
          setState({ data: body.data, offsetMs: clockOffset(body.meta?.serverTime), error: null });
        }
      })
      .catch((error) => !cancelled && setState({ data: null, offsetMs: 0, error }));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.error) return <Alert tone="danger">{errorMessage(state.error)}</Alert>;
  if (!state.data) {
    return (
      <p role="status" className="text-text-muted">
        {t('booking.loading')}
      </p>
    );
  }

  const groups = groupBookings(state.data);
  const tabs = [
    { key: 'upcoming', label: `${t('booking.tabUpcoming')} (${groups.upcoming.length})` },
    { key: 'past', label: `${t('booking.tabPast')} (${groups.past.length})` },
    { key: 'cancelled', label: `${t('booking.tabCancelled')} (${groups.cancelled.length})` },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        tabs={tabs}
        active={tab}
        onChange={setTab}
        label={t('booking.myBookings')}
        idPrefix="bookings"
      />
      {tabs.map(({ key }) => (
        <div key={key} {...tabPanelProps('bookings', key, tab)} className="focus:outline-none">
          {groups[key].length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
              <p className="text-text-muted">{t(`booking.empty.${key}`)}</p>
              {key === 'upcoming' && (
                <Link href="/tours" className={buttonClasses({ className: 'mt-4' })}>
                  {t('booking.browseTours')}
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {groups[key].map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} offsetMs={state.offsetMs} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
