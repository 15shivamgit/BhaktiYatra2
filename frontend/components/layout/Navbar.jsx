import Link from 'next/link';
import { t } from '@/lib/i18n';
import Container from './Container';

const LINKS = [
  { href: '/temples', key: 'nav.temples' },
  { href: '/circuits', key: 'nav.circuits' },
  { href: '/tours', key: 'nav.tours' },
  { href: '/about', key: 'nav.about' },
  { href: '/contact', key: 'nav.contact' },
];

/**
 * Phase 1 placeholder navbar. The full version (auth menu, mobile sheet, search) arrives in
 * Phases 2–3 per docs/06-design/02-page-specs.md. Links point at routes built in Phase 3.
 */
export default function Navbar() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl font-semibold text-accent">
          Bhakti<span className="text-primary">Yatra</span>
        </Link>
        <nav aria-label={t('nav.primary')} className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-medium text-text-muted">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  className="rounded-sm py-2 transition-colors hover:text-primary"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
