import { MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import JsonLd from '@/components/seo/JsonLd';
import TempleMapLazy from '@/components/temples/TempleMapLazy';
import TourGrid from '@/components/tours/TourGrid';
import { getCircuit } from '@/lib/api/content';
import { t } from '@/lib/i18n';
import { breadcrumbJsonLd, circuitJsonLd, ogImages } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { circuit } = await getCircuit(slug);
  if (!circuit) return { title: t('errors.notFoundTitle'), robots: { index: false } };
  const title = circuit.seo?.title || `${circuit.name} — Temples, Route & Guide`;
  const description = circuit.seo?.description || circuit.shortDescription.slice(0, 160);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/circuits/${circuit.slug}` },
    openGraph: {
      title,
      description,
      url: `/circuits/${circuit.slug}`,
      images: ogImages(circuit.image),
    },
  };
}

function CircuitBody({ circuit }) {
  const crumbs = [
    { name: t('temple.breadcrumbHome'), path: '/' },
    { name: t('circuits.breadcrumb'), path: '/circuits' },
    { name: circuit.name, path: `/circuits/${circuit.slug}` },
  ];
  return (
    <article className="pb-16">
      <Container className="pt-6">
        <Breadcrumbs
          items={crumbs.map((c, i) => ({ name: c.name, href: i < 2 ? c.path : undefined }))}
        />
        <header className="mt-4 grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            {circuit.region && (
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                {circuit.region}
              </p>
            )}
            <h1 className="mt-1 font-display text-4xl font-semibold text-accent sm:text-5xl">
              {circuit.name}
            </h1>
            <p className="mt-3 text-lg text-text-muted">{circuit.shortDescription}</p>
            <p className="mt-2 text-sm font-medium text-text">
              {t('circuits.templeCount', { count: circuit.templeCount })}
            </p>
          </div>
          {circuit.image && (
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-surface-muted">
              <Image
                src={circuit.image.url}
                alt={circuit.image.alt || circuit.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </header>

        {circuit.description && (
          <div
            className="rich-text mt-10"
            dangerouslySetInnerHTML={{ __html: circuit.description }}
          />
        )}

        <section aria-labelledby="route-title" className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 id="route-title" className="font-display text-3xl font-semibold text-accent">
              {t('circuits.route')}
            </h2>
            <ol className="relative mt-6 space-y-4 border-l-2 border-dashed border-gold pl-6">
              {circuit.temples.map((temple) => (
                <li key={temple.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[37px] flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
                  >
                    {temple.position}
                  </span>
                  <div className="flex gap-4 rounded-md border border-border bg-surface p-3 shadow-card">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
                      {temple.primaryImage && (
                        <Image
                          src={temple.primaryImage.url}
                          alt={temple.primaryImage.alt || temple.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted">
                        {t('circuits.stop', { n: temple.position })}
                      </p>
                      <h3 className="font-semibold text-text">
                        <Link
                          href={`/temples/${temple.slug}`}
                          prefetch
                          className="hover:text-primary"
                        >
                          {temple.name}
                        </Link>
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-text-muted">
                        <MapPin aria-hidden="true" className="size-3.5" />
                        {temple.city}, {temple.state}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <TempleMapLazy
              temples={circuit.temples}
              route
              label={`${t('temple.map')}: ${circuit.name}`}
              height={460}
            />
          </div>
        </section>

        {circuit.tours?.length > 0 && (
          <section aria-labelledby="circuit-tours-title" className="mt-16">
            <h2
              id="circuit-tours-title"
              className="font-display text-3xl font-semibold text-accent"
            >
              {t('circuits.toursTitle')}
            </h2>
            <div className="mt-6">
              <TourGrid tours={circuit.tours.slice(0, 3)} />
            </div>
          </section>
        )}
      </Container>
      <JsonLd data={circuitJsonLd(circuit)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </article>
  );
}

async function CircuitContent({ params }) {
  const { slug } = await params;
  const result = await getCircuit(slug);
  if (result.redirectSlug) permanentRedirect(`/circuits/${result.redirectSlug}`);
  if (!result.circuit) notFound();
  return <CircuitBody circuit={result.circuit} />;
}

export default function CircuitPage({ params }) {
  return (
    <Suspense
      fallback={
        <Container className="py-10">
          <div className="h-10 w-1/2 animate-pulse rounded bg-surface-muted" />
        </Container>
      }
    >
      <CircuitContent params={params} />
    </Suspense>
  );
}
