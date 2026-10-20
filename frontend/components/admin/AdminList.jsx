'use client';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { errorMessage } from '@/lib/api/messages';
import { t } from '@/lib/i18n';

/** Loading / error / empty wrapper plus pager for admin tables. */
export function AdminListState({ loading, error, empty, onRetry, children }) {
  if (error) {
    return (
      <Alert tone="danger" className="mt-6">
        {errorMessage(error)}{' '}
        <button type="button" onClick={onRetry} className="font-medium underline">
          {t('adminContent.retry')}
        </button>
      </Alert>
    );
  }
  if (loading && empty) {
    return (
      <p role="status" className="mt-6 text-sm text-text-muted">
        {t('adminContent.loading')}
      </p>
    );
  }
  if (empty) return <p className="mt-6 text-sm text-text-muted">{t('adminContent.none')}</p>;
  return children;
}

export function AdminPager({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <Button
        size="sm"
        variant="secondary"
        disabled={meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        {t('adminContent.previous')}
      </Button>
      <span className="text-text-muted">
        {t('adminContent.pageOf', { page: meta.page, total: meta.totalPages })}
      </span>
      <Button
        size="sm"
        variant="secondary"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPage(meta.page + 1)}
      >
        {t('adminContent.next')}
      </Button>
    </div>
  );
}

export function AdminPageHeader({ title, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-3xl font-semibold text-accent sm:text-4xl">{title}</h1>
      {action}
    </div>
  );
}
