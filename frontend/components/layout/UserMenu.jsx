'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';
import { useUser } from '@/lib/auth/user-context';
import { t } from '@/lib/i18n';

/** Same size as the avatar button while the account menu code loads. */
function AvatarPlaceholder() {
  return <span aria-hidden="true" className="size-8 rounded-full bg-surface-muted" />;
}

const AccountMenu = dynamic(() => import('./AccountMenu'), { loading: AvatarPlaceholder });

/** Auth area of the navbar: log in / register for guests, an account menu for users. */
export default function UserMenu() {
  const { user, status } = useUser();

  if (status === 'loading') {
    return (
      <span
        role="status"
        aria-label={t('nav.loadingUser')}
        className="size-8 animate-pulse rounded-full bg-surface-muted"
      />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          {t('nav.login')}
        </Link>
        <Link href="/register" className={buttonClasses({ size: 'sm' })}>
          {t('nav.register')}
        </Link>
      </div>
    );
  }

  return <AccountMenu />;
}
