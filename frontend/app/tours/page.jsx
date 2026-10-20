import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import FiltersDisclosure from '@/components/temples/FiltersDisclosure';
import Pagination from '@/components/temples/Pagination';
import TourFilters from '@/components/tours/TourFilters';
import TourGrid, { TourGridSkeleton } from '@/components/tours/TourGrid';
import { getTourFilters, getTours } from '@/lib/api/content';
import { t } from '@/lib/i18n';
import { DAY_RANGES, TOUR_FILTER_KEYS, TOUR_SORTS } from '@/lib/tours';

const KEYS = [...TOUR_FILTER_KEYS, 'sort', 'page'];

/** Keep only known, single-valued string params, with values the API accepts. */
function readParams(searchParams) {
  const current = {};
  for (const key of KEYS) {
    const value = searchParams?.[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (typeof single === 'string' && single.trim()) current[key] = single.trim().slice(0, 100);
  }
  if (current.days && !DAY_RANGES[current.days]) delete current.days;
  if (current.sort && !TOUR_SORTS.includes(current.sort)) delete current.sort;
  if (current.month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(current.month)) delete current.month;
  if (current.maxPrice && !/^\d{1,7}$/.test(current.maxPrice)) delete current.maxPrice;
  return current;
}

/** The next 12 months in India, for the month filter. */
function nextMonths(count = 12) {
  const now = new Date(Date.now() + 330 * 60_000); // IST
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    return {
      value: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date),
    };
  });
}

export async function generateMetadata({ searchParams }) {
  const current = readParams(await searchParams);
  // A single destination is an indexable landing page; other combinations canonicalise.
  const onlyDestination =
    current.destination && Object.keys(current).every((k) => k === 'destination');
  return {
    title: { absolute: `${t('tours.metaTitle')} | BhaktiYatra` },
    description: t('tours.metaDescription'),
    alternates: {
      canonical: onlyDestination
        ? `/tours?destination=${encodeURIComponent(current.destination)}`
        : '/tours',
    },
  };
}

async function Results({ searchParams }) {
  const current = readParams(await searchParams);
  await connection(); // the month list depends on today's date
  const page = Math.max(1, Number.parseInt(current.page ?? '1', 10) || 1);
  const [minDays, maxDays] = DAY_RANGES[current.days] ?? [];
  const [facets, { tours, meta }] = await Promise.all([
    getTourFilters(),
    getTours({
      q: current.q,
      destination: current.destination,
      pickupCity: current.pickupCity,
      minDays,
      maxDays,
      maxPrice: current.maxPrice,
      month: current.month,
      bookableOnly: current.bookable === 'true' ? 'true' : undefined,
      sort: current.sort,
      page,
      limit: 12,
    }),
  ]);
  const activeCount = TOUR_FILTER_KEYS.filter((k) => current[k]).length;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <FiltersDisclosure activeCount={activeCount}>
          <TourFilters facets={facets} months={nextMonths()} current={current} />
        </FiltersDisclosure>
      </aside>
      <div className="min-w-0">
        <p role="status" className="text-sm text-text-muted">
          {meta.total === 1 ? t('tours.result1') : t('tours.results', { count: meta.total })}
        </p>
        {tours.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-semibold text-text">{t('tours.noResults')}</p>
            <p className="mt-1 text-sm text-text-muted">{t('tours.noResultsHint')}</p>
            <Link
              href="/tours"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t('tours.clear')}
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <TourGrid tours={tours} priorityCount={3} />
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              basePath="/tours"
              params={current}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToursPage({ searchParams }) {
  return (
    <Container className="py-8 sm:py-10">
      <Breadcrumbs
        items={[{ name: t('tours.breadcrumbHome'), href: '/' }, { name: t('tours.breadcrumb') }]}
      />
      <h1 className="mt-4 font-display text-4xl font-semibold text-accent sm:text-5xl">
        {t('tours.title')}
      </h1>
      <p className="mt-2 text-text-muted">{t('tours.subtitle')}</p>
      <Suspense
        fallback={
          <div className="mt-8">
            <TourGridSkeleton count={6} />
          </div>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
