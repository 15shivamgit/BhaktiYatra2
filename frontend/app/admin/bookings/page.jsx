import AdminBookingsList from '@/components/admin/bookings/AdminBookingsList';
import { t } from '@/lib/i18n';

export const metadata = { title: t('admin.bookings') };

export default function AdminBookingsPage() {
  return <AdminBookingsList />;
}
