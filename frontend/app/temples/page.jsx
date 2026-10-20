import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import FiltersDisclosure from '@/components/temples/FiltersDisclosure';
import Pagination from '@/components/temples/Pagination';
import TempleFilters from '@/components/temples/TempleFilters';
import TempleGrid, { TempleGridSkeleton } from '@/components/temples/TempleGrid';
import TempleMapLazy from '@/components/temples/TempleMapLazy';
import { getTempleFilters, getTemples } from '@/lib/api/content';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const KEYS = ['q', 'state', 'deity', 'circuit', 'featured', 'page', 'view'];

/** Keep only known, single-valued string params. */
function readParams(searchParams) {
  const current = {};
  for (const key of KEYS) {
    const value = searchParams?.[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (typeof single === 'string' && single.trim()) current[key] = single.trim().slice(0, 100);
  }
  return current;
}

export async function generateMetadata({ searchParams }) {
  const current = readParams(await searchParams);
  const title = current.state
    ? t('temples.metaTitleState', { state: current.state })
    : t('temples.metaTitle');
  // Single state/deity/circuit filters are indexable landing pages; other combinations
  // canonicalise to the base list (docs/07-content/04-seo.md).
  const singleFilter = ['state', 'deity', 'circuit'].filter((k) => current[k]);
  const canonical =
    singleFilter.length === 1 && !current.q && !current.featured
      ? `/temples?${singleFilter[0]}=${encodeURIComponent(current[singleFilter[0]])}`
      : '/temples';
  return {
    title: { absolute: `${title} | BhaktiYatra` },
    description: t('temples.metaDescription'),
    alternates: { canonical },
  };
}

async function Results({ searchParams }) {
  const current = readParams(await searchParams);
  const page = Math.max(1, Number.parseInt(current.page ?? '1', 10) || 1);
  const isMap = current.view === 'map';
  const [facets, { temples, meta }] = await Promise.all([
    getTempleFilters(),
    getTemples({
      q: current.q,
      state: current.state,
      deity: current.deity,
      circuit: current.circuit,
      featured: current.featured === 'true' ? 'true' : undefined,
      page: isMap ? 1 : page,
      limit: isMap ? 50 : 12,
    }),
  ]);

  const viewHref = (view) => {
    const params = new URLSearchParams(
      Object.entries(current).filter(([k, v]) => v && k !== 'view' && k !== 'page'),
    );
    if (view === 'map') params.set('view', 'map');
    const s = params.toString();
    return s ? `/temples?${s}` : '/temples';
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <FiltersDisclosure
          activeCount={
            ['q', 'state', 'deity', 'circuit', 'featured'].filter((k) => current[k]).length
          }
        >
          <TempleFilters facets={facets} current={current} />
        </FiltersDisclosure>
      </aside>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-text-muted">
            {meta.total === 1 ? t('temples.result1') : t('temples.results', { count: meta.total })}
          </p>
          <div className="inline-flex rounded-md border border-border bg-surface p-1 text-sm">
            {[
              { view: 'grid', icon: LayoutGrid, label: t('temples.viewGrid') },
              { view: 'map', icon: MapIcon, label: t('temples.viewOnMap') },
            ].map(({ view, icon: Icon, label }) => {
              const active = (view === 'map') === isMap;
              return (
                <Link
                  key={view}
                  href={viewHref(view)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3',
                    active ? 'bg-primary text-white' : 'text-text-muted hover:text-primary',
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {temples.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-semibold text-text">{t('temples.noResults')}</p>
            <p className="mt-1 text-sm text-text-muted">{t('temples.noResultsHint')}</p>
            <Link
              href="/temples"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t('temples.clear')}
            </Link>
          </div>
        ) : isMap ? (
          <div className="mt-6 space-y-6">
            <TempleMapLazy temples={temples} label={t('temples.mapLabel')} height={480} />
            <TempleGrid temples={temples} columns={3} />
          </div>
        ) : (
          <div className="mt-6">
            <TempleGrid temples={temples} columns={3} priorityCount={3} />
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              basePath="/temples"
              params={current}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplesPage({ searchParams }) {
  return (
    <Container className="py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { name: t('temple.breadcrumbHome'), href: '/' },
          { name: t('temple.breadcrumbTemples') },
        ]}
      />
      <h1 className="mt-4 font-display text-4xl font-semibold text-accent sm:text-5xl">
        {t('temples.title')}
      </h1>
      <p className="mt-2 text-text-muted">{t('temples.subtitle')}</p>
      <Suspense
        fallback={
          <div className="mt-8">
            <TempleGridSkeleton count={6} />
          </div>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
