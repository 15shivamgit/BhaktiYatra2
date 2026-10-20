'use client';

import { BadgeCheck } from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { t } from '@/lib/i18n';

/** "Password" or "Set a password" depending on the account, plus the Google-linked badge. */
export default function PasswordHeading({ id }) {
  const { user } = useUser();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="text-2xl text-text">
        {user.hasPassword ? t('account.passwordHeading') : t('account.setPasswordHeading')}
      </h2>
      {user.googleLinked && (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
          <BadgeCheck aria-hidden="true" className="size-4" />
          {t('account.googleLinked')}
        </span>
      )}
    </div>
  );
}
