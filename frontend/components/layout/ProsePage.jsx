import Breadcrumbs from './Breadcrumbs';
import Container from './Container';
import { t } from '@/lib/i18n';

/** Readable long-form page (policies, about). */
export default function ProsePage({ title, updated, children }) {
  return (
    <Container size="narrow" className="py-10 sm:py-14">
      <Breadcrumbs items={[{ name: t('temple.breadcrumbHome'), href: '/' }, { name: title }]} />
      <h1 className="mt-4 font-display text-4xl font-semibold text-accent sm:text-5xl">{title}</h1>
      {updated && (
        <p className="mt-2 text-sm text-text-muted">{t('pages.lastUpdated', { date: updated })}</p>
      )}
      <span aria-hidden="true" className="mt-5 block h-px w-16 bg-gold" />
      <div className="rich-text mt-8">{children}</div>
    </Container>
  );
}
