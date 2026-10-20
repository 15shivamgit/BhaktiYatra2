import Link from 'next/link';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import FormSkeleton from '@/components/auth/FormSkeleton';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { t } from '@/lib/i18n';

export const metadata = { title: t('auth.resetTitle'), robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
