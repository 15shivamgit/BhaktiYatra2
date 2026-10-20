'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth/user-context';
import { t } from '@/lib/i18n';
import { loginUrl } from '@/lib/navigation';

/** Placeholder shown while the session is being checked or a redirect is under way. */
function GuardSkeleton() {
  return (
    <div role="status" aria-label={t('nav.loadingUser')} className="mx-auto max-w-page px-4 py-16">
      <div className="h-8 w-48 animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-6 h-4 w-80 max-w-full animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded-md bg-surface-muted" />
    </div>
  );
}

/**
 * Client-side page guard (UX only; the API enforces access). Guests go to the login page with
 * a return path; signed-in users without the role go home.
 * @param {{ role?: 'admin', children: React.ReactNode }} props
 */
export default function RequireAuth({ role, children }) {
  const { user, status } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = status === 'authenticated' && (!role || user?.role === role);

  useEffect(() => {
    if (status === 'guest') {
      toast.info(t('auth.pleaseLogin'), { id: 'please-login' });
      router.replace(loginUrl(pathname));
    } else if (status === 'authenticated' && role && user?.role !== role) {
      toast.error(t('auth.adminOnly'), { id: 'admin-only' });
      router.replace('/');
    }
  }, [status, role, user, router, pathname]);

  return allowed ? children : <GuardSkeleton />;
}
