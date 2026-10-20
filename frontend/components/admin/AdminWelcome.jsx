'use client';

import { useUser } from '@/lib/auth/user-context';
import { t } from '@/lib/i18n';

export default function AdminWelcome() {
  const { user } = useUser();
  return (
    <p className="mt-4 max-w-prose text-text-muted">{t('admin.welcome', { name: user.name })}</p>
  );
}
