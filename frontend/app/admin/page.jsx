import AdminWelcome from '@/components/admin/AdminWelcome';
import { t } from '@/lib/i18n';

export const metadata = { title: t('admin.dashboard') };

/** Placeholder dashboard; real statistics arrive in Phase 8. */
export default function AdminDashboardPage() {
  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-4xl text-accent">{t('admin.dashboard')}</h1>
      <AdminWelcome />
    </section>
  );
}
