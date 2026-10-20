import MyBookings from '@/components/bookings/MyBookings';
import Container from '@/components/layout/Container';
import { t } from '@/lib/i18n';

export const metadata = { title: 'My bookings' };

export default function MyBookingsPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-4xl font-semibold text-accent">{t('booking.myBookings')}</h1>
      <div className="mt-8">
        <MyBookings />
      </div>
    </Container>
  );
}
