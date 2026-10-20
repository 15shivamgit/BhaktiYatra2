import AdminPaymentsPage from '@/components/admin/AdminPaymentsPage';
import { t } from '@/lib/i18n';

export const metadata = { title: t('admin.payments') };

export default function Page() {
  return <AdminPaymentsPage />;
}
