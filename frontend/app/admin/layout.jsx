import AdminShell from '@/components/admin/AdminShell';
import RequireAuth from '@/components/auth/RequireAuth';

export const metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  robots: { index: false },
};

/** Admin area: admins only (the API enforces the same rule on every admin endpoint). */
export default function AdminLayout({ children }) {
  return (
    <RequireAuth role="admin">
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
