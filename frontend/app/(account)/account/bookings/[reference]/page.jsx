import { Suspense } from 'react';
import BookingDetailView from '@/components/bookings/BookingDetailView';
import Container from '@/components/layout/Container';
import { t } from '@/lib/i18n';

export const metadata = { title: 'Booking' };

async function Detail({ params }) {
  const { reference } = await params;
  return <BookingDetailView reference={reference.toUpperCase()} />;
}

/** params are request data, so they are read inside <Suspense> (Cache Components). */
export default function BookingPage({ params }) {
  return (
    <Container className="py-10 sm:py-14">
      <Suspense
        fallback={
          <p role="status" className="text-text-muted">
            {t('booking.loading')}
          </p>
        }
      >
        <Detail params={params} />
      </Suspense>
    </Container>
  );
}
