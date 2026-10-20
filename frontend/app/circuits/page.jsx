import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import CircuitCard from '@/components/circuits/CircuitCard';
import { getCircuits } from '@/lib/api/content';
import { t } from '@/lib/i18n';

export const metadata = {
  title: t('circuits.title'),
  description: t('circuits.metaDescription'),
  alternates: { canonical: '/circuits' },
};

export default async function CircuitsPage() {
  const { circuits } = await getCircuits({ limit: 50 });
  return (
    <Container className="py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { name: t('temple.breadcrumbHome'), href: '/' },
          { name: t('circuits.breadcrumb') },
        ]}
      />
      <h1 className="mt-4 font-display text-4xl font-semibold text-accent sm:text-5xl">
        {t('circuits.title')}
      </h1>
      <p className="mt-2 text-text-muted">{t('circuits.subtitle')}</p>
      {circuits.length === 0 ? (
        <p className="mt-10 text-text-muted">{t('circuits.empty')}</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {circuits.map((circuit, index) => (
            <li key={circuit.id}>
              <CircuitCard circuit={circuit} priority={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
