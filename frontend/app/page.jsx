import { Suspense } from 'react';
import Container from '@/components/layout/Container';
import ApiStatus from '@/components/system/ApiStatus';
import { t } from '@/lib/i18n';

/** Temporary Phase 1 home page; replaced by the real home in Phase 3. */
export default function HomePage() {
  return (
    <Container size="narrow" className="py-16 sm:py-24">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">{t('site.name')}</p>
      <h1 className="mt-3 text-4xl text-accent sm:text-5xl">{t('site.tagline')}</h1>
      <span aria-hidden="true" className="mt-6 block h-px w-24 bg-gold" />
      <p className="mt-6 text-lg text-text-muted">{t('home.comingSoon')}</p>

      <section aria-labelledby="system-status" className="mt-12">
        <h2 id="system-status" className="text-2xl text-text">
          {t('home.systemStatus')}
        </h2>
        <div className="mt-4">
          <Suspense
            fallback={
              <p role="status" className="text-sm text-text-muted">
                {t('status.checking')}
              </p>
            }
          >
            <ApiStatus />
          </Suspense>
        </div>
      </section>
    </Container>
  );
}
