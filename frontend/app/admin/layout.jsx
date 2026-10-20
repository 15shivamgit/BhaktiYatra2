import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import RequireAuth from '@/components/auth/RequireAuth';
import { t } from '@/lib/i18n';

export const metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  robots: { index: false },
};

/**
 * Admin area: admins only (the API enforces the same rule on every admin endpoint).
 * RequireAuth and the sidebar read the pathname, which is request data on dynamic routes such
 * as /admin/temples/[id], so they render inside <Suspense> (Cache Components).
 */
export default function AdminLayout({ children }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="mx-auto max-w-page px-4 py-8 text-sm text-text-muted">
          {t('adminContent.loading')}
        </p>
      }
    >
      <RequireAuth role="admin">
        <AdminShell>{children}</AdminShell>
      </RequireAuth>
    </Suspense>
  );
}
