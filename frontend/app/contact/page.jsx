import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Suspense } from 'react';
import ContactForm from '@/components/contact/ContactForm';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Container from '@/components/layout/Container';
import { BUSINESS } from '@/lib/config';
import { t } from '@/lib/i18n';

export const metadata = {
  title: t('contact.title'),
  description: t('contact.subtitle'),
  alternates: { canonical: '/contact' },
};

/** A tour page links here with ?subject=…; the form starts with that subject filled in. */
async function ContactFormFromQuery({ searchParams }) {
  const params = await searchParams;
  const subject = typeof params?.subject === 'string' ? params.subject.slice(0, 120) : '';
  return <ContactForm defaultSubject={subject} />;
}

export default function ContactPage({ searchParams }) {
  const cards = [
    {
      icon: Phone,
      label: t('contact.call'),
      value: BUSINESS.phoneDisplay,
      href: BUSINESS.phoneHref,
    },
    {
      icon: Mail,
      label: t('contact.write'),
      value: BUSINESS.email,
      href: `mailto:${BUSINESS.email}`,
    },
    { icon: MapPin, label: t('contact.visit'), value: BUSINESS.address },
    { icon: Clock, label: t('contact.hoursLabel'), value: t('contact.hours') },
  ];
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        items={[{ name: t('temple.breadcrumbHome'), href: '/' }, { name: t('contact.title') }]}
      />
      <h1 className="mt-4 font-display text-4xl font-semibold text-accent sm:text-5xl">
        {t('contact.title')}
      </h1>
      <p className="mt-2 max-w-2xl text-text-muted">{t('contact.subtitle')}</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-surface-muted" />}>
            <ContactFormFromQuery searchParams={searchParams} />
          </Suspense>
        </div>
        <ul className="space-y-3">
          {cards.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex gap-3 rounded-md border border-border bg-surface p-4">
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-saffron" />
              <div>
                <p className="text-sm font-semibold text-text">{label}</p>
                {href ? (
                  <a href={href} className="text-sm text-primary hover:underline">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm text-text-muted">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
