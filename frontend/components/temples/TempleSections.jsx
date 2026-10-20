import { Bus, Car, Clock, IndianRupee, Plane, Sun, TrainFront, CheckCircle2 } from 'lucide-react';
import { formatRange, monthName } from '@/lib/format';
import { t } from '@/lib/i18n';

/** Four key facts above the fold. */
export function QuickFacts({ temple }) {
  const first = temple.timings?.[0];
  const facts = [
    {
      icon: Clock,
      label: t('temple.quickTimings'),
      value: first
        ? formatRange(first.open, first.close) || first.note || t('temple.varies')
        : t('temple.varies'),
    },
    { icon: Sun, label: t('temple.quickBest'), value: temple.bestTimeToVisit },
    { icon: TrainFront, label: t('temple.quickRail'), value: temple.howToReach?.nearestRailway },
    { icon: IndianRupee, label: t('temple.quickFee'), value: temple.entryFee },
  ].filter((fact) => fact.value);
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-md border border-border bg-surface p-4">
          <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            <Icon aria-hidden="true" className="size-4 text-saffron" />
            {label}
          </dt>
          <dd className="mt-1 line-clamp-3 text-sm font-medium text-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Darshan timings and aarti schedule; stacks into cards on small screens. */
export function TimingsTable({ timings = [], aarti = [] }) {
  return (
    <div className="space-y-6">
      {timings.length > 0 && (
        <table className="w-full border-collapse overflow-hidden rounded-md border border-border text-sm">
          <caption className="sr-only">{t('temple.timings')}</caption>
          <tbody>
            {timings.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className="bg-surface-muted p-3 text-left font-medium text-text sm:w-1/3"
                >
                  {row.label}
                </th>
                <td className="p-3 text-text">
                  <span className="font-medium">{formatRange(row.open, row.close)}</span>
                  {row.note && <span className="block text-text-muted">{row.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {aarti.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text">{t('temple.aarti')}</h3>
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {aarti.map((row) => (
              <li
                key={row.name}
                className="flex flex-wrap items-baseline justify-between gap-2 p-3 text-sm"
              >
                <span className="font-medium text-text">{row.name}</span>
                <span className="text-text-muted">
                  {row.time ? formatRange(row.time) : ''}
                  {row.time && row.note ? ' · ' : ''}
                  {row.note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-sm text-text-muted">{t('temple.verifyNote')}</p>
    </div>
  );
}

export function FestivalList({ festivals }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {festivals.map((festival) => (
        <li key={festival.name} className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {festival.month ? monthName(festival.month) : t('temple.monthVaries')}
          </p>
          <p className="mt-1 font-semibold text-text">{festival.name}</p>
          {festival.description && (
            <p className="mt-1 text-sm text-text-muted">{festival.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function HowToReach({ howToReach }) {
  const rows = [
    { icon: Plane, label: t('temple.airport'), value: howToReach?.nearestAirport },
    { icon: TrainFront, label: t('temple.railway'), value: howToReach?.nearestRailway },
    { icon: Bus, label: t('temple.bus'), value: howToReach?.nearestBusStand },
    { icon: Car, label: t('temple.road'), value: howToReach?.byRoad },
  ].filter((row) => row.value);
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-md border border-border bg-surface p-4">
          <dt className="flex items-center gap-2 font-semibold text-text">
            <Icon aria-hidden="true" className="size-4 text-saffron" />
            {label}
          </dt>
          <dd className="mt-1 text-sm text-text-muted">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RulesList({ rules, entryFee }) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-2 text-text">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
      {entryFee && (
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text">{t('temple.quickFee')}:</span> {entryFee}
        </p>
      )}
    </div>
  );
}

/** In-page jump links; scrolls horizontally on small screens. */
export function SectionNav({ sections }) {
  return (
    <nav aria-label={t('temple.onThisPage')} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 whitespace-nowrap">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-3 text-sm text-text-muted hover:border-primary hover:text-primary"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
