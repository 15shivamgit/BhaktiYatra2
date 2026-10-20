import Link from 'next/link';
import { Suspense } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';
import BookingForm from '@/components/bookings/BookingForm';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import { t } from '@/lib/i18n';

export const metadata = { title: 'Book a tour', robots: { index: false } };

/** params and searchParams are request data, so they are read inside <Suspense>. */
async function Booking({ params, searchParams }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const departure = typeof query?.departure === 'string' ? query.departure : '';
  if (!/^[a-f0-9]{24}$/i.test(departure)) {
    return (
      <p className="text-text-muted">
        {t('booking.chooseDateFirst')}{' '}
        <Link href={`/tours/${slug}`} className="font-medium text-accent underline">
          {t('booking.backToTour')}
        </Link>
      </p>
    );
  }
  return (
    <RequireAuth>
      <BookingForm slug={slug} departureId={departure} />
    </RequireAuth>
  );
}

export default function BookPage({ params, searchParams }) {
  return (
    <Container className="py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { name: t('tours.breadcrumbHome'), href: '/' },
          { name: t('tours.breadcrumb'), href: '/tours' },
          { name: t('booking.title') },
        ]}
      />
      <h1 className="mt-4 font-display text-4xl font-semibold text-accent">{t('booking.title')}</h1>
      <div className="mt-8">
        <Suspense
          fallback={
            <p role="status" className="text-text-muted">
              {t('booking.loading')}
            </p>
          }
        >
          <Booking params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}
