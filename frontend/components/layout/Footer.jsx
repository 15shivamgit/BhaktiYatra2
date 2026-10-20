import Link from 'next/link';
import { BUSINESS } from '@/lib/config';
import { t } from '@/lib/i18n';
import Container from './Container';

const COLUMNS = [
  {
    key: 'footer.explore',
    links: [
      { href: '/temples', key: 'footer.allTemples' },
      { href: '/temples?state=Uttarakhand', label: 'Uttarakhand' },
      { href: '/temples?state=Tamil%20Nadu', label: 'Tamil Nadu' },
      { href: '/temples?deity=Shiva', label: 'Shiva temples' },
      { href: '/tours', key: 'footer.allTours' },
    ],
  },
  {
    key: 'footer.circuitsHeading',
    links: [
      { href: '/circuits', key: 'footer.allCircuits' },
      { href: '/circuits/char-dham', label: 'Char Dham' },
      { href: '/circuits/12-jyotirlingas', label: '12 Jyotirlingas' },
      { href: '/circuits/bada-char-dham', label: 'Bada Char Dham' },
    ],
  },
  {
    key: 'footer.help',
    links: [
      { href: '/about', key: 'footer.about' },
      { href: '/contact', key: 'footer.contact' },
      { href: '/refund-policy', key: 'footer.refund' },
      { href: '/privacy', key: 'footer.privacy' },
      { href: '/terms', key: 'footer.terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl font-semibold text-accent">{BUSINESS.name}</p>
          <p className="mt-2 max-w-sm text-sm text-text-muted">{t('footer.tagline2')}</p>
          <address className="mt-4 space-y-1 text-sm not-italic text-text-muted">
            <p className="font-semibold text-text">{t('footer.contactHeading')}</p>
            <p>{BUSINESS.address}</p>
            <p>
              <a className="hover:text-primary" href={BUSINESS.phoneHref}>
                {BUSINESS.phoneDisplay}
              </a>
              {' · '}
              <a className="hover:text-primary" href={`mailto:${BUSINESS.email}`}>
                {BUSINESS.email}
              </a>
            </p>
          </address>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.key} aria-label={t(column.key)}>
            <p className="text-sm font-semibold text-text">{t(column.key)}</p>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.key ? t(link.key) : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <Container className="border-t border-border py-4 text-xs text-text-muted">
        © {BUSINESS.name}. {t('footer.rights')}
      </Container>
    </footer>
  );
}
