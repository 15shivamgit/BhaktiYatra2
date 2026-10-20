import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { t } from '@/lib/i18n';

export const metadata = { title: t('auth.forgotTitle'), robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
