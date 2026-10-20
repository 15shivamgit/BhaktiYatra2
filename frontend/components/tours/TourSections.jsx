import { Check, Coffee, Hotel, X } from 'lucide-react';
import { formatDateRange, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { departureBadge } from '@/lib/tours';
import { cn } from '@/lib/utils';
import { seatsLabel } from './TourCard';

const BADGE_TONES = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  muted: 'bg-surface-muted text-text-muted',
};

export function DepartureBadge({ departure }) {
  const { key, tone } = departureBadge(departure);
  return (
    <span
      className={cn(
        'inline-flex rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        BADGE_TONES[tone],
      )}
    >
      {t(key)}
    </span>
  );
}

/** Day-by-day accordion; native <details> works without JavaScript. */
export function Itinerary({ days }) {
  return (
    <ol className="space-y-3">
      {days.map((day, index) => (
        <li key={day.day}>
          <details
            open={index === 0}
            className="group rounded-md border border-border bg-surface open:shadow-card"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                {day.day}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-text-muted">
                  {t('tours.day', { n: day.day })}
                </span>
                <span className="block font-semibold text-text">{day.title}</span>
              </span>
              <span
                aria-hidden="true"
                className="text-xl text-text-muted transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="border-t border-border px-4 py-4">
              {day.description && (
                <div className="rich-text" dangerouslySetInnerHTML={{ __html: day.description }} />
              )}
              {(day.meals.length > 0 || day.stay) && (
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
                  {day.meals.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Coffee aria-hidden="true" className="size-4" />
                      <dt className="sr-only">{t('tours.meals')}</dt>
                      <dd>{day.meals.map((meal) => t(`tours.${meal}`)).join(', ')}</dd>
                    </div>
                  )}
                  {day.stay && (
                    <div className="flex items-center gap-1.5">
                      <Hotel aria-hidden="true" className="size-4" />
                      <dt className="sr-only">{t('tours.stay')}</dt>
                      <dd>{day.stay}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}

export function InclusionLists({ inclusions, exclusions }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-md border border-border bg-surface p-5">
        <h3 className="font-semibold text-text">{t('tours.inclusions')}</h3>
        <ul className="mt-3 space-y-2 text-sm text-text">
          {inclusions.map((item) => (
            <li key={item} className="flex gap-2">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      {exclusions.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-5">
          <h3 className="font-semibold text-text">{t('tours.exclusions')}</h3>
          <ul className="mt-3 space-y-2 text-sm text-text">
            {exclusions.map((item) => (
              <li key={item} className="flex gap-2">
                <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Every upcoming departure with price, seats and status (stacked rows on phones). */
export function DeparturesTable({ departures }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{t('tours.departures')}</caption>
        <thead className="hidden bg-surface-muted text-text-muted sm:table-header-group">
          <tr>
            <th scope="col" className="p-3 font-medium">
              {t('tours.dates')}
            </th>
            <th scope="col" className="p-3 font-medium">
              {t('tours.pickup')}
            </th>
            <th scope="col" className="p-3 font-medium">
              {t('tours.price')}
            </th>
            <th scope="col" className="p-3 font-medium">
              {t('tours.seats')}
            </th>
            <th scope="col" className="p-3 font-medium">
              {t('tours.status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {departures.map((d) => (
            <tr
              key={d.id}
              className="grid grid-cols-2 gap-1 border-t border-border p-3 first:border-t-0 sm:table-row sm:p-0"
            >
              <th scope="row" className="col-span-2 font-semibold text-text sm:p-3 sm:font-medium">
                {formatDateRange(d.startDate, d.endDate)}
              </th>
              <td className="text-text-muted sm:p-3">{d.pickupCity ?? t('tours.allPickups')}</td>
              <td className="text-right font-semibold text-text sm:p-3 sm:text-left">
                {formatPrice(d.price)}
              </td>
              <td className="text-text-muted sm:p-3">
                {d.status === 'full' ? '—' : seatsLabel(d.seatsAvailable)}
              </td>
              <td className="text-right sm:p-3 sm:text-left">
                <DepartureBadge departure={d} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Faqs({ faqs }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.question} className="group rounded-md border border-border bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium text-text [&::-webkit-details-marker]:hidden">
            {faq.question}
            <span
              aria-hidden="true"
              className="text-xl text-text-muted transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="border-t border-border px-4 py-3 text-sm text-text-muted">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
