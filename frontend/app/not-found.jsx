import Link from 'next/link';
import Container from '@/components/layout/Container';
import { t } from '@/lib/i18n';

export const metadata = { title: t('errors.notFoundTitle'), robots: { index: false } };

export default function NotFound() {
  return (
    <Container size="narrow" className="py-24 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-4xl text-accent">{t('errors.notFoundTitle')}</h1>
      <p className="mt-4 text-text-muted">{t('errors.notFoundBody')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-medium text-white transition-colors hover:bg-primary-hover"
      >
        {t('errors.goHome')}
      </Link>
    </Container>
  );
}
