import AdminUsersPage from '@/components/admin/AdminUsersPage';
import { t } from '@/lib/i18n';

export const metadata = { title: t('admin.users') };

export default function Page() {
  return <AdminUsersPage />;
}
