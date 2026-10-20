import { Suspense } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';

export const metadata = { robots: { index: false } };

/**
 * Every page under (account) requires a signed-in user. RequireAuth reads the pathname, which is
 * request data on dynamic routes such as /account/bookings/[reference], so it sits in <Suspense>.
 */
export default function AccountLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}
