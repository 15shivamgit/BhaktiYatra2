import { MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistance } from '@/lib/format';
import { t } from '@/lib/i18n';

/** Placeholder when a temple has no photo yet. */
function NoImage({ name }) {
  return (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary-soft to-accent-soft">
      <span className="font-display text-4xl font-semibold text-accent/60">{name.charAt(0)}</span>
    </div>
  );
}

/**
 * Temple summary card (docs/06-design/03-components.md). `prefetch` warms the detail page.
 * @param {{ temple: any, sizes?: string, priority?: boolean }} props
 */
export default function TempleCard({
  temple,
  sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
}) {
  const image = temple.primaryImage;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-muted">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || temple.name}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <NoImage name={temple.name} />
        )}
        {temple.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-sm bg-surface/95 px-2 py-1 text-xs font-medium text-accent">
            <Star aria-hidden="true" className="size-3 fill-gold text-gold" />
            {t('temples.featured')}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{temple.deity}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-text">
          <Link
            href={`/temples/${temple.slug}`}
            prefetch
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {temple.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-text-muted">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          {temple.city}, {temple.state}
          {temple.distanceKm !== undefined && (
            <span className="ml-auto whitespace-nowrap">
              {t('temple.away', { distance: formatDistance(temple.distanceKm) })}
            </span>
          )}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-text-muted">{temple.shortDescription}</p>
      </div>
    </article>
  );
}
