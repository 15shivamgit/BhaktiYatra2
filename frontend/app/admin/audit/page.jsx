import AdminAuditPage from '@/components/admin/AdminAuditPage';
import { t } from '@/lib/i18n';

export const metadata = { title: t('admin.audit') };

export default function Page() {
  return <AdminAuditPage />;
}
