import Link from 'next/link';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import FormSkeleton from '@/components/auth/FormSkeleton';
import RegisterForm from '@/components/auth/RegisterForm';
import { t } from '@/lib/i18n';

export const metadata = { title: t('auth.registerButton'), robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('auth.loginInstead')}
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton fields={5} />}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
