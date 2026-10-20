import { HeartHandshake, ListChecks, Map as MapIcon, Route, Search } from 'lucide-react';
import Form from 'next/form';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import CircuitCard from '@/components/circuits/CircuitCard';
import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import JsonLd from '@/components/seo/JsonLd';
import TempleGrid, { TempleGridSkeleton } from '@/components/temples/TempleGrid';
import { buttonClasses } from '@/components/ui/Button';
import { getCircuits, getTempleFilters, getTemples } from '@/lib/api/content';
import { BUSINESS, HERO_IMAGE } from '@/lib/config';
import { t } from '@/lib/i18n';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';

export const metadata = { alternates: { canonical: '/' } };

async function FeaturedCircuits() {
  const { circuits } = await getCircuits({ featured: true, limit: 3 });
  if (!circuits.length) return null;
  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {circuits.map((circuit) => (
        <li key={circuit.id}>
          <CircuitCard circuit={circuit} />
        </li>
      ))}
    </ul>
  );
}

async function FeaturedTemples() {
  const { temples } = await getTemples({ featured: 'true', limit: 8 });
  if (!temples.length) return null;
  return (
    <div className="mt-8">
      <TempleGrid temples={temples} />
    </div>
  );
}

async function BrowseByState() {
  const { states } = await getTempleFilters();
  if (!states.length) return null;
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {states.map((state) => (
        <li key={state.value}>
          <Link
            href={`/temples?state=${encodeURIComponent(state.value)}`}
            className="flex min-h-14 items-center justify-between gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-text hover:border-primary hover:text-primary"
          >
            {state.value}
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-accent">
              {state.count}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const WHY = [
  { icon: ListChecks, title: 'home.why1Title', text: 'home.why1Text' },
  { icon: Route, title: 'home.why2Title', text: 'home.why2Text' },
  { icon: MapIcon, title: 'home.why3Title', text: 'home.why3Text' },
  { icon: HeartHandshake, title: 'home.why4Title', text: 'home.why4Text' },
];

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <Image
          src={HERO_IMAGE.url}
          alt={HERO_IMAGE.alt}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/45 to-black/70" />
        <Container className="py-24 text-white sm:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/85">
            {BUSINESS.name}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold sm:text-6xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">{t('home.heroSubtitle')}</p>
          <Form
            action="/temples"
            role="search"
            className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="hero-search" className="sr-only">
              {t('home.searchLabel')}
            </label>
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted"
              />
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder={t('home.searchPlaceholder')}
                className="block min-h-13 w-full rounded-md border-0 bg-white pl-11 pr-3 text-base text-text shadow-card focus-visible:outline-2 focus-visible:outline-saffron"
              />
            </div>
            <button type="submit" className={buttonClasses({ size: 'lg' })}>
              {t('home.searchButton')}
            </button>
          </Form>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              href="/temples"
              className="rounded-full bg-white/15 px-4 py-2 font-medium backdrop-blur hover:bg-white/25"
            >
              {t('home.exploreTemples')}
            </Link>
            <Link
              href="/circuits"
              className="rounded-full bg-white/15 px-4 py-2 font-medium backdrop-blur hover:bg-white/25"
            >
              {t('home.viewCircuits')}
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <SectionHeading
          title={t('home.featuredCircuits')}
          description={t('home.featuredCircuitsText')}
          action={{ href: '/circuits', label: t('home.viewAll') }}
        />
        <Suspense
          fallback={<div className="mt-8 h-72 animate-pulse rounded-lg bg-surface-muted" />}
        >
          <FeaturedCircuits />
        </Suspense>
      </Container>

      <section className="bg-surface-muted/60 py-16">
        <Container>
          <SectionHeading
            title={t('home.featuredTemples')}
            description={t('home.featuredTemplesText')}
            action={{ href: '/temples', label: t('home.viewAll') }}
          />
          <Suspense
            fallback={
              <div className="mt-8">
                <TempleGridSkeleton count={4} />
              </div>
            }
          >
            <FeaturedTemples />
          </Suspense>
        </Container>
      </section>

      <Container className="py-16">
        <SectionHeading title={t('home.whyTitle')} />
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-lg border border-border bg-surface p-6">
              <Icon aria-hidden="true" className="size-7 text-saffron" />
              <h3 className="mt-3 font-semibold text-text">{t(title)}</h3>
              <p className="mt-1 text-sm text-text-muted">{t(text)}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section className="bg-surface-muted/60 py-16">
        <Container>
          <SectionHeading title={t('home.browseByState')} />
          <Suspense
            fallback={<div className="mt-8 h-32 animate-pulse rounded-lg bg-surface-muted" />}
          >
            <BrowseByState />
          </Suspense>
        </Container>
      </section>

      <Container className="py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-accent p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-3xl font-semibold">{t('home.enquiryTitle')}</h2>
            <p className="mt-2 text-white/90">{t('home.enquiryText')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center rounded-md bg-white px-5 font-medium text-accent hover:bg-white/90"
            >
              {t('home.enquiryCta')}
            </Link>
            <a
              href={BUSINESS.phoneHref}
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 px-5 font-medium hover:bg-white/10"
            >
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>
      </Container>

      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
    </>
  );
}
