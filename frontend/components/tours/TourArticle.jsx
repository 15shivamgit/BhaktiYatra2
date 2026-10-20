import { Clock, MapPin, Navigation, Star } from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import JsonLd from '@/components/seo/JsonLd';
import TempleGallery from '@/components/temples/TempleGallery';
import TempleGrid from '@/components/temples/TempleGrid';
import { SectionNav } from '@/components/temples/TempleSections';
import { t } from '@/lib/i18n';
import { breadcrumbJsonLd, faqJsonLd, tourJsonLd } from '@/lib/seo';
import BookingPanel, { MobileBookingBar } from './BookingPanel';
import { durationLabel } from './TourCard';
import { DeparturesTable, Faqs, InclusionLists, Itinerary } from './TourSections';

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

/** Full tour page body (docs/06-design/02-page-specs.md "Tour detail"). */
export default function TourArticle({ tour }) {
  const sections = [
    { id: 'overview', label: t('tours.overview'), show: true },
    { id: 'itinerary', label: t('tours.itinerary'), show: tour.itinerary.length },
    { id: 'inclusions', label: t('tours.inclusionsTitle'), show: tour.inclusions.length },
    { id: 'temples', label: t('tours.temples'), show: tour.temples.length },
    { id: 'departures', label: t('tours.departures'), show: true },
    { id: 'faqs', label: t('tours.faqs'), show: tour.faqs.length },
  ].filter((s) => s.show);

  const crumbs = [
    { name: t('tours.breadcrumbHome'), path: '/' },
    { name: t('tours.breadcrumb'), path: '/tours' },
    { name: tour.title, path: `/tours/${tour.slug}` },
  ];

  return (
    <article>
      <Container className="pt-6">
        <Breadcrumbs
          items={crumbs.map((c, i) => ({
            name: c.name,
            href: i < crumbs.length - 1 ? c.path : undefined,
          }))}
        />
        <header className="mt-4">
          {tour.featured && (
            <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-primary">
              <Star aria-hidden="true" className="size-3 fill-gold text-gold" />
              {t('tours.featured')}
            </p>
          )}
          <h1 className="mt-1 font-display text-4xl font-semibold text-accent sm:text-5xl">
            {tour.title}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
            <li className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4" />
              {durationLabel(tour.durationDays, tour.durationNights)}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-4" />
              {tour.destinations.join(' · ')}
            </li>
            <li className="flex items-center gap-1.5">
              <Navigation aria-hidden="true" className="size-4" />
              {t('tours.pickupCities')}: {tour.pickupCities.join(', ')}
            </li>
          </ul>
        </header>
        <div className="mt-6">
          <TempleGallery images={tour.images} name={tour.title} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-12">
            <SectionNav sections={sections} />

            <Section id="overview" title={t('tours.overview')}>
              <p className="text-lg text-text">{tour.summary}</p>
              {tour.description && (
                <div
                  className="rich-text mt-4"
                  dangerouslySetInnerHTML={{ __html: tour.description }}
                />
              )}
              {tour.highlights.length > 0 && (
                <>
                  <h3 className="mt-6 text-xl font-semibold text-text">{t('tours.highlights')}</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {tour.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 rounded-md bg-primary-soft px-3 py-2 text-sm text-accent"
                      >
                        <Star aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Section>

            {tour.itinerary.length > 0 && (
              <Section id="itinerary" title={t('tours.itinerary')}>
                <Itinerary days={tour.itinerary} />
              </Section>
            )}

            {tour.inclusions.length > 0 && (
              <Section id="inclusions" title={t('tours.inclusionsTitle')}>
                <InclusionLists inclusions={tour.inclusions} exclusions={tour.exclusions} />
              </Section>
            )}

            {tour.temples.length > 0 && (
              <Section id="temples" title={t('tours.temples')}>
                <TempleGrid temples={tour.temples} columns={3} />
              </Section>
            )}

            <Section id="departures" title={t('tours.departures')}>
              {tour.departures.length > 0 ? (
                <DeparturesTable departures={tour.departures} />
              ) : (
                <p className="text-text-muted">
                  {t('tours.departuresEmpty')}{' '}
                  <Link
                    href={`/contact?subject=${encodeURIComponent(`Dates for ${tour.title}`)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {t('tours.requestDates')}
                  </Link>
                </p>
              )}
            </Section>

            {tour.faqs.length > 0 && (
              <Section id="faqs" title={t('tours.faqs')}>
                <Faqs faqs={tour.faqs} />
              </Section>
            )}

            <section
              aria-labelledby="policies-title"
              className="rounded-lg border border-border bg-surface-muted/60 p-5"
            >
              <h2 id="policies-title" className="font-semibold text-text">
                {t('tours.policies')}
              </h2>
              <p className="mt-1 text-sm text-text-muted">{t('tours.policiesText')}</p>
              <Link
                href="/refund-policy"
                className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
              >
                {t('tours.policiesLink')}
              </Link>
            </section>
          </div>

          {/* One panel only (radio names and ids must be unique). On phones it follows the
              content and the sticky bar below jumps to it. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <BookingPanel tour={tour} />
          </aside>
        </div>

        <MobileBookingBar fromPrice={tour.fromPrice} priceIsIndicative={tour.priceIsIndicative} />
      </Container>

      <div className="pb-16" />
      <JsonLd data={tourJsonLd(tour)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {tour.faqs.length > 0 && <JsonLd data={faqJsonLd(tour.faqs)} />}
    </article>
  );
}

export function TourArticleSkeleton() {
  return (
    <Container className="pt-6" aria-hidden="true">
      <div className="h-4 w-48 animate-pulse rounded bg-surface-muted" />
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded bg-surface-muted" />
      <div className="mt-6 aspect-[16/9] animate-pulse rounded-lg bg-surface-muted" />
    </Container>
  );
}
