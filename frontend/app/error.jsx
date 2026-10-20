'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import Container from '@/components/layout/Container';
import { t } from '@/lib/i18n';

/** Route-level error boundary. `retry` re-fetches and re-renders the segment (Next 16). */
export default function Error({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error?.requestId
    ? t('errors.withReference', { requestId: error.requestId })
    : t('errors.generic');

  return (
    <Container size="narrow" className="py-24 text-center">
      <h1 className="text-3xl text-accent">{message}</h1>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-medium text-white transition-colors hover:bg-primary-hover"
      >
        {t('errors.retry')}
      </button>
    </Container>
  );
}
