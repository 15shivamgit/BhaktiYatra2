import Link from 'next/link';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import FormSkeleton from '@/components/auth/FormSkeleton';
import LoginForm from '@/components/auth/LoginForm';
import { t } from '@/lib/i18n';

export const metadata = { title: t('auth.loginButton'), robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthCard
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t('auth.createOne')}
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
