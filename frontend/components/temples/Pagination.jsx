import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

/**
 * Previous / next links that keep the current filters (crawlable, unlike infinite scroll).
 * @param {{ page: number, totalPages: number, basePath: string, params: Record<string, string | undefined> }} props
 */
export default function Pagination({ page, totalPages, basePath, params }) {
  if (totalPages <= 1) return null;
  const href = (target) => {
    const search = new URLSearchParams(
      Object.entries(params).filter(([key, value]) => value && key !== 'page'),
    );
    if (target > 1) search.set('page', String(target));
    const s = search.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav
      aria-label={t('temples.pagination')}
      className="mt-10 flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className={buttonClasses({ variant: 'secondary', size: 'sm' })}
        >
          ← {t('temples.previous')}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-text-muted">{t('temples.page', { page, total: totalPages })}</p>
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className={buttonClasses({ variant: 'secondary', size: 'sm' })}
        >
          {t('temples.next')} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
