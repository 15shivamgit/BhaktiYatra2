import RequireAuth from '@/components/auth/RequireAuth';

export const metadata = { robots: { index: false } };

/** Every page under (account) requires a signed-in user. */
export default function AccountLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}
