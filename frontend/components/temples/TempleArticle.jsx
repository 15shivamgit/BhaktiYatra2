import { ExternalLink, MapPinned, Phone } from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import JsonLd from '@/components/seo/JsonLd';
import { buttonClasses } from '@/components/ui/Button';
import { BUSINESS } from '@/lib/config';
import { directionsUrl } from '@/lib/format';
import { t } from '@/lib/i18n';
import { breadcrumbJsonLd, templeJsonLd } from '@/lib/seo';
import TourGrid from '@/components/tours/TourGrid';
import TempleGallery from './TempleGallery';
import TempleGrid from './TempleGrid';
import TempleMapLazy from './TempleMapLazy';
import {
  FestivalList,
  HowToReach,
  QuickFacts,
  RulesList,
  SectionNav,
  TimingsTable,
} from './TempleSections';
import ViewTracker from './ViewTracker';

function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2
        id={`${id}-title`}
        className="font-display text-2xl font-semibold text-accent sm:text-3xl"
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Full temple page body (docs/06-design/02-page-specs.md "Temple detail"). */
export default function TempleArticle({ temple }) {
  const sections = [
    { id: 'overview', label: t('temple.overview'), show: true },
    {
      id: 'timings',
      label: t('temple.timings'),
      show: temple.timings.length || temple.aartiSchedule.length,
    },
    { id: 'festivals', label: t('temple.festivals'), show: temple.festivals.length },
    { id: 'reach', label: t('temple.reach'), show: temple.howToReach },
    { id: 'rules', label: t('temple.rules'), show: temple.rules.length },
    { id: 'map', label: t('temple.map'), show: temple.location },
    { id: 'tours', label: t('temple.toursTitle'), show: temple.tours.length },
    { id: 'nearby', label: t('temple.nearby'), show: temple.nearby.length },
  ].filter((s) => s.show);

  const crumbs = [
    { name: t('temple.breadcrumbHome'), path: '/' },
    { name: t('temple.breadcrumbTemples'), path: '/temples' },
    { name: temple.name, path: `/temples/${temple.slug}` },
  ];

  return (
    <article className="pb-16">
      <Container className="pt-6">
        <Breadcrumbs
          items={crumbs.map((c, i) => ({
            name: c.name,
            href: i < crumbs.length - 1 ? c.path : undefined,
          }))}
        />
        <header className="mt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            {temple.deity}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-accent sm:text-5xl">
            {temple.name}
          </h1>
          <p className="mt-2 text-text-muted">
            {[temple.city, temple.district !== temple.city ? temple.district : null, temple.state]
              .filter(Boolean)
              .join(', ')}
          </p>
        </header>
        <div className="mt-6">
          <TempleGallery images={temple.images} name={temple.name} />
        </div>
        <div className="mt-6">
          <QuickFacts temple={temple} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-12">
            <SectionNav sections={sections} />

            <Section id="overview" title={t('temple.overview')}>
              <div className="rich-text" dangerouslySetInnerHTML={{ __html: temple.description }} />
              {temple.history && (
                <>
                  <h3 className="mt-8 text-xl font-semibold text-text">{t('temple.history')}</h3>
                  <div
                    className="rich-text mt-3"
                    dangerouslySetInnerHTML={{ __html: temple.history }}
                  />
                </>
              )}
              {temple.significance && (
                <>
                  <h3 className="mt-8 text-xl font-semibold text-text">
                    {t('temple.significance')}
                  </h3>
                  <div
                    className="rich-text mt-3"
                    dangerouslySetInnerHTML={{ __html: temple.significance }}
                  />
                </>
              )}
            </Section>

            {(temple.timings.length > 0 || temple.aartiSchedule.length > 0) && (
              <Section id="timings" title={t('temple.timings')}>
                <TimingsTable timings={temple.timings} aarti={temple.aartiSchedule} />
              </Section>
            )}

            {temple.festivals.length > 0 && (
              <Section id="festivals" title={t('temple.festivals')}>
                <FestivalList festivals={temple.festivals} />
              </Section>
            )}

            {temple.howToReach && (
              <Section id="reach" title={t('temple.reach')}>
                <HowToReach howToReach={temple.howToReach} />
              </Section>
            )}

            {temple.rules.length > 0 && (
              <Section id="rules" title={t('temple.rules')}>
                <RulesList rules={temple.rules} entryFee={temple.entryFee} />
              </Section>
            )}

            {temple.location && (
              <Section id="map" title={t('temple.map')}>
                <TempleMapLazy
                  temples={[temple, ...temple.nearby]}
                  highlightSlug={temple.slug}
                  label={`${t('temple.map')}: ${temple.name}`}
                />
                <a
                  href={directionsUrl(temple.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <MapPinned aria-hidden="true" className="size-4" />
                  {t('temple.directions')}
                </a>
              </Section>
            )}

            {temple.circuits.length > 0 && (
              <Section id="circuits" title={t('temple.circuits')}>
                <ul className="flex flex-wrap gap-2">
                  {temple.circuits.map((circuit) => (
                    <li key={circuit.slug}>
                      <Link
                        href={`/circuits/${circuit.slug}`}
                        className="inline-flex min-h-10 items-center rounded-full bg-accent-soft px-4 text-sm font-medium text-accent hover:bg-accent hover:text-white"
                      >
                        {circuit.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {temple.tours.length > 0 && (
              <Section id="tours" title={t('temple.toursTitle')}>
                <TourGrid tours={temple.tours.slice(0, 3)} />
              </Section>
            )}

            {temple.nearby.length > 0 && (
              <Section id="nearby" title={t('temple.nearby')}>
                <TempleGrid temples={temple.nearby} columns={3} />
              </Section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
              <h2 className="font-display text-2xl font-semibold text-accent">
                {t('temple.plan')}
              </h2>
              <p className="mt-2 text-sm text-text-muted">{t('temple.planText')}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/contact" className={buttonClasses({ className: 'w-full' })}>
                  {t('temple.planCta')}
                </Link>
                <a
                  href={BUSINESS.phoneHref}
                  className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {BUSINESS.phoneDisplay}
                </a>
              </div>
              {temple.tours[0] ? (
                <p className="mt-4 text-sm text-text-muted">
                  <Link
                    href={`/tours/${temple.tours[0].slug}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {temple.tours[0].title}
                  </Link>{' '}
                  {t('temple.planTourVisits')}
                </p>
              ) : (
                <p className="mt-4 text-xs text-text-muted">{t('temple.noTours')}</p>
              )}
            </div>
            {(temple.officialWebsite || temple.darshanBookingUrl) && (
              <div className="rounded-lg border border-border bg-surface p-5">
                <ul className="space-y-2 text-sm">
                  {temple.officialWebsite && (
                    <li>
                      <a
                        href={temple.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                      >
                        <ExternalLink aria-hidden="true" className="size-4" />
                        {t('temple.officialSite')}
                      </a>
                    </li>
                  )}
                  {temple.darshanBookingUrl && (
                    <li>
                      <a
                        href={temple.darshanBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                      >
                        <ExternalLink aria-hidden="true" className="size-4" />
                        {t('temple.bookDarshan')}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </Container>

      <JsonLd data={templeJsonLd(temple)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ViewTracker slug={temple.slug} />
    </article>
  );
}

export function TempleArticleSkeleton() {
  return (
    <Container className="pt-6" aria-hidden="true">
      <div className="h-4 w-48 animate-pulse rounded bg-surface-muted" />
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded bg-surface-muted" />
      <div className="mt-6 aspect-[16/9] animate-pulse rounded-lg bg-surface-muted" />
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-surface-muted" />
        ))}
      </div>
    </Container>
  );
}
