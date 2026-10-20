import PasswordForm from '@/components/account/PasswordForm';
import PasswordHeading from '@/components/account/PasswordHeading';
import ProfileForm from '@/components/account/ProfileForm';
import Container from '@/components/layout/Container';
import { t } from '@/lib/i18n';

export const metadata = { title: t('account.title') };

export default function AccountPage() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <h1 className="text-4xl text-accent">{t('account.title')}</h1>
      <p className="mt-2 text-text-muted">{t('account.subtitle')}</p>

      <section
        aria-labelledby="details-heading"
        className="mt-10 rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        <h2 id="details-heading" className="text-2xl text-text">
          {t('account.detailsHeading')}
        </h2>
        <div className="mt-6">
          <ProfileForm />
        </div>
      </section>

      <section
        aria-labelledby="password-heading"
        className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        <PasswordHeading id="password-heading" />
        <div className="mt-6">
          <PasswordForm />
        </div>
      </section>
    </Container>
  );
}
