import AdminDashboard from '@/components/admin/dashboard/AdminDashboard';
import { t } from '@/lib/i18n';

export const metadata = { title: t('admin.dashboard') };

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
