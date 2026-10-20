import { Route } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { t } from '@/lib/i18n';

/** Large circuit card with cover image, region and temple count. */
export default function CircuitCard({ circuit, priority = false }) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative aspect-[16/10] bg-surface-muted">
        {circuit.image ? (
          <Image
            src={circuit.image.url}
            alt={circuit.image.alt || circuit.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary-soft to-accent-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          {circuit.region && (
            <p className="text-xs font-medium uppercase tracking-widest text-white/85">
              {circuit.region}
            </p>
          )}
          <h3 className="mt-1 font-display text-2xl font-semibold">
            <Link
              href={`/circuits/${circuit.slug}`}
              prefetch
              className="after:absolute after:inset-0"
            >
              {circuit.name}
            </Link>
          </h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/90">
            <Route aria-hidden="true" className="size-4" />
            {t('circuits.templeCount', { count: circuit.templeCount })}
          </p>
        </div>
      </div>
      <p className="p-5 text-sm text-text-muted">{circuit.shortDescription}</p>
    </article>
  );
}
