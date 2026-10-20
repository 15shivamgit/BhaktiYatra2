import { CalendarDays, Clock, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

export function durationLabel(days, nights) {
  return days === 1 ? t('tours.day1') : t('tours.durationLabel', { days, nights });
}

export function seatsLabel(count) {
  return count === 1 ? t('tours.seatLeft') : t('tours.seatsLeft', { count });
}

/**
 * Tour summary card (docs/05-features/03-tours-catalog.md "Browse tours").
 * @param {{ tour: any, sizes?: string, priority?: boolean }} props
 */
export default function TourCard({
  tour,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
}) {
  const image = tour.primaryImage;
  const shown = tour.destinations.slice(0, 3);
  const more = tour.destinations.length - shown.length;
  const next = tour.nextDeparture;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-muted">
        {image && (
          <Image
            src={image.url}
            alt={image.alt || tour.title}
            fill
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        )}
        {tour.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-sm bg-surface/95 px-2 py-1 text-xs font-medium text-accent">
            <Star aria-hidden="true" className="size-3 fill-gold text-gold" />
            {t('tours.featured')}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-primary">
          <Clock aria-hidden="true" className="size-3.5" />
          {durationLabel(tour.durationDays, tour.durationNights)}
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-text">
          <Link
            href={`/tours/${tour.slug}`}
            prefetch
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {tour.title}
          </Link>
        </h3>
        <p className="mt-1 flex items-start gap-1 text-sm text-text-muted">
          <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {shown.join(' · ')}
            {more > 0 && ` ${t('tours.moreDestinations', { count: more })}`}
          </span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-xs text-text-muted">
              {tour.priceIsIndicative ? t('tours.indicative') : t('tours.from')}
            </p>
            <p className="text-xl font-semibold text-text">
              {formatPrice(tour.fromPrice)}
              <span className="ml-1 text-xs font-normal text-text-muted">
                {t('tours.perPerson')}
              </span>
            </p>
          </div>
          <p className="text-right text-xs text-text-muted">
            {next ? (
              <>
                <span className="flex items-center justify-end gap-1 font-medium text-text">
                  <CalendarDays aria-hidden="true" className="size-3.5" />
                  {formatDate(next.startDate, 'short')}
                </span>
                <span className={next.seatsAvailable <= 5 ? 'font-medium text-warning' : ''}>
                  {seatsLabel(next.seatsAvailable)}
                </span>
              </>
            ) : (
              t('tours.noDates')
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
