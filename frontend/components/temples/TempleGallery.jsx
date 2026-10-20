'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Hero photo with thumbnails and a keyboard-friendly lightbox (native <dialog>: focus is
 * trapped and Escape closes it).
 * @param {{ images: { url: string, alt: string, width?: number, height?: number }[], name: string }} props
 */
export default function TempleGallery({ images, name }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef(null);
  const count = images.length;
  const current = images[index];

  const open = (i) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (delta) => setIndex((i) => (i + delta + count) % count);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return undefined;
    const onKey = (event) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
    // step is stable enough for this listener: it only depends on count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (count === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-gradient-to-br from-primary-soft to-accent-soft">
        <span className="font-display text-6xl text-accent/60">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <section aria-label={t('temple.gallery')}>
      <button
        type="button"
        onClick={() => open(0)}
        className="relative block h-[260px] w-full overflow-hidden rounded-lg bg-surface-muted sm:h-[340px] lg:h-[420px]"
      >
        <Image
          src={images[0].url}
          alt={images[0].alt || name}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="object-cover"
        />
        <span className="sr-only">{t('temple.openPhoto', { index: 1 })}</span>
      </button>

      {count > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.slice(1, 7).map((image, i) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => open(i + 1)}
                className="relative block aspect-square w-full overflow-hidden rounded-md bg-surface-muted"
              >
                <Image
                  src={image.url}
                  alt={image.alt || name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                <span className="sr-only">{t('temple.openPhoto', { index: i + 2 })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-label={t('temple.gallery')}
        className="m-auto max-h-[95dvh] w-[min(1100px,95vw)] rounded-lg bg-text p-0 text-white backdrop:bg-black/80"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="relative">
          <div className="relative aspect-[3/2] w-full">
            <Image
              src={current.url}
              alt={current.alt || name}
              fill
              sizes="95vw"
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-3 p-3 text-sm">
            <p>
              <span className="font-medium">
                {t('temple.photoOf', { index: index + 1, total: count })}
              </span>
              {current.alt && <span className="ml-2 text-white/80">{current.alt}</span>}
            </p>
            <div className="flex gap-2">
              {count > 1 && (
                <>
                  <IconButton label={t('temple.previousPhoto')} onClick={() => step(-1)}>
                    <ChevronLeft aria-hidden="true" className="size-5" />
                  </IconButton>
                  <IconButton label={t('temple.nextPhoto')} onClick={() => step(1)}>
                    <ChevronRight aria-hidden="true" className="size-5" />
                  </IconButton>
                </>
              )}
              <IconButton
                label={t('temple.close')}
                onClick={() => dialog.current?.close()}
                autoFocus
              >
                <X aria-hidden="true" className="size-5" />
              </IconButton>
            </div>
          </div>
        </div>
      </dialog>
    </section>
  );
}

function IconButton({ label, onClick, children, autoFocus }) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus={autoFocus}
      className={cn(
        'flex size-11 items-center justify-center rounded-md bg-white/10 hover:bg-white/20',
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
