import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import TempleArticle, { TempleArticleSkeleton } from '@/components/temples/TempleArticle';
import { getTemple } from '@/lib/api/content';
import { t } from '@/lib/i18n';
import { ogImages } from '@/lib/seo';

/*
 * No generateStaticParams: every temple page is rendered on its first visit and then cached
 * (ISR with Cache Components), so builds never depend on the API (ADR-022). The page itself
 * does not await params; TempleContent does, inside <Suspense>.
 */

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { temple } = await getTemple(slug);
  if (!temple) return { title: t('errors.notFoundTitle'), robots: { index: false } };
  const title =
    temple.seo?.title || `${temple.name}, ${temple.city} — Timings, History & How to Reach`;
  const description = temple.seo?.description || temple.shortDescription.slice(0, 160);
  const url = `/temples/${temple.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description, url, images: ogImages(temple.primaryImage) },
    twitter: { card: 'summary_large_image', title, description },
  };
}

async function TempleContent({ params }) {
  const { slug } = await params;
  const result = await getTemple(slug);
  if (result.redirectSlug) permanentRedirect(`/temples/${result.redirectSlug}`);
  if (!result.temple) notFound();
  return <TempleArticle temple={result.temple} />;
}

export default function TemplePage({ params }) {
  return (
    <Suspense fallback={<TempleArticleSkeleton />}>
      <TempleContent params={params} />
    </Suspense>
  );
}
