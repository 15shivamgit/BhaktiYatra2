import { Suspense } from 'react';
import AdminBookingDetail from '@/components/admin/bookings/AdminBookingDetail';
import { t } from '@/lib/i18n';

export const metadata = { title: 'Booking' };

async function Detail({ params }) {
  const { id } = await params;
  return <AdminBookingDetail id={id} />;
}

/** params are request data, so they are read inside <Suspense> (Cache Components). */
export default function AdminBookingPage({ params }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-text-muted">
          {t('adminContent.loading')}
        </p>
      }
    >
      <Detail params={params} />
    </Suspense>
  );
}
