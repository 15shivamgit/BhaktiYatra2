import AdminSearchPage from '@/components/admin/AdminSearchPage';
import { t } from '@/lib/i18n';

export const metadata = { title: t('admin.search') };

export default function Page() {
  return <AdminSearchPage />;
}
