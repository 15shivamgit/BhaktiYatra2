'use client';

import { Phone } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { useUser } from '@/lib/auth/user-context';
import { BUSINESS } from '@/lib/config';
import { formatDateRange, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { loginUrl } from '@/lib/navigation';
import { departureBadge } from '@/lib/tours';
import { cn } from '@/lib/utils';

/** Online booking (Phase 5) is switched on with NEXT_PUBLIC_FEATURE_BOOKING=true. */
const BOOKING_ENABLED = process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

function bookHref(slug, departureId) {
  return `/tours/${slug}/book?departure=${departureId}`;
}

/**
 * Departure picker and call to action (desktop: sticky right column; phones: in the page flow
 * with a sticky bar that jumps here). Seat counts can be a few minutes old; the booking page
 * re-checks live availability.
 * @param {{ tour: { slug: string, title: string, fromPrice: number, priceIsIndicative: boolean,
 *   departures: any[] } }} props
 */
export default function BookingPanel({ tour }) {
  const bookable = tour.departures.filter((d) => d.isBookable);
  const [selectedId, setSelectedId] = useState(bookable[0]?.id ?? null);
  const { user, status } = useUser();
  const selected = bookable.find((d) => d.id === selectedId);
  const enquiryHref = `/contact?subject=${encodeURIComponent(`Enquiry: ${tour.title}`)}`;

  return (
    <section
      id="book"
      aria-labelledby="book-title"
      className="scroll-mt-24 rounded-lg border border-border bg-surface p-5 shadow-card"
    >
      <p className="text-xs text-text-muted">
        {tour.priceIsIndicative ? t('tours.indicative') : t('tours.from')}
      </p>
      <p className="text-3xl font-semibold text-text">
        {formatPrice(selected?.price ?? tour.fromPrice)}
        <span className="ml-1 text-sm font-normal text-text-muted">{t('tours.perPerson')}</span>
      </p>

      <h2 id="book-title" className="mt-5 text-sm font-semibold text-text">
        {t('tours.chooseDate')}
      </h2>
      {tour.departures.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">{t('tours.departuresEmpty')}</p>
      ) : (
        <fieldset className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
          <legend className="sr-only">{t('tours.chooseDate')}</legend>
          {tour.departures.map((d) => {
            const badge = departureBadge(d);
            return (
              <label
                key={d.id}
                className={cn(
                  'flex items-start gap-3 rounded-md border p-3 text-sm',
                  d.isBookable
                    ? 'cursor-pointer border-border hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft'
                    : 'cursor-not-allowed border-border bg-surface-muted text-text-muted',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-saffron',
                )}
              >
                <input
                  type="radio"
                  name="departure"
                  value={d.id}
                  checked={selectedId === d.id}
                  disabled={!d.isBookable}
                  onChange={() => setSelectedId(d.id)}
                  className="mt-1 size-4 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-text">
                    {formatDateRange(d.startDate, d.endDate)}
                  </span>
                  <span className="block text-xs text-text-muted">
                    {d.pickupCity ?? t('tours.allPickups')}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold text-text">{formatPrice(d.price)}</span>
                  <span
                    className={cn(
                      'block text-xs',
                      badge.tone === 'warning' ? 'font-medium text-warning' : 'text-text-muted',
                    )}
                  >
                    {badge.tone === 'success'
                      ? t('tours.seatsLeft', { count: d.seatsAvailable })
                      : t(badge.key)}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      <div className="mt-5 space-y-2">
        {BOOKING_ENABLED && selected ? (
          <Link
            href={
              status !== 'loading' && !user
                ? loginUrl(bookHref(tour.slug, selected.id))
                : bookHref(tour.slug, selected.id)
            }
            className={buttonClasses({ size: 'lg', className: 'w-full' })}
          >
            {t('tours.bookNow')}
          </Link>
        ) : (
          <>
            {!BOOKING_ENABLED && (
              <div className="rounded-md bg-info-soft p-3 text-sm text-info">
                <p className="font-semibold">{t('tours.bookingSoon')}</p>
                <p className="mt-0.5">{t('tours.bookingSoonText')}</p>
              </div>
            )}
            <Link href={enquiryHref} className={buttonClasses({ className: 'w-full' })}>
              {t('tours.enquire')}
            </Link>
            <a
              href={BUSINESS.phoneHref}
              className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
            >
              <Phone aria-hidden="true" className="size-4" />
              {t('tours.callUs', { phone: BUSINESS.phoneDisplay })}
            </a>
          </>
        )}
      </div>
    </section>
  );
}

/** Phone-only bar that stays at the bottom of the tour article (never over the footer). */
export function MobileBookingBar({ fromPrice, priceIsIndicative }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-10 flex items-center justify-between gap-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
      <p>
        <span className="block text-xs text-text-muted">
          {priceIsIndicative ? t('tours.indicative') : t('tours.from')}
        </span>
        <span className="text-lg font-semibold text-text">{formatPrice(fromPrice)}</span>
      </p>
      <a href="#book" className={buttonClasses()}>
        {BOOKING_ENABLED ? t('tours.bookNow') : t('tours.chooseDate')}
      </a>
    </div>
  );
}
