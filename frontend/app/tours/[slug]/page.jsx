import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import TourArticle, { TourArticleSkeleton } from '@/components/tours/TourArticle';
import { getTour } from '@/lib/api/content';
import { t } from '@/lib/i18n';
import { ogImages } from '@/lib/seo';

/*
 * Same rendering model as temple pages (ADR-026): no generateStaticParams, rendered on first
 * visit and cached under the "content" tag until the API revalidates it.
 */

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { tour } = await getTour(slug);
  if (!tour) return { title: t('errors.notFoundTitle'), robots: { index: false } };
  const title = tour.seo?.title || `${tour.title} — Dates, Price & Itinerary`;
  const description = tour.seo?.description || tour.summary.slice(0, 160);
  const url = `/tours/${tour.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url, images: ogImages(tour.primaryImage) },
    twitter: { card: 'summary_large_image', title, description },
  };
}

async function TourContent({ params }) {
  const { slug } = await params;
  const result = await getTour(slug);
  if (result.redirectSlug) permanentRedirect(`/tours/${result.redirectSlug}`);
  if (!result.tour) notFound();
  return <TourArticle tour={result.tour} />;
}

export default function TourPage({ params }) {
  return (
    <Suspense fallback={<TourArticleSkeleton />}>
      <TourContent params={params} />
    </Suspense>
  );
}
