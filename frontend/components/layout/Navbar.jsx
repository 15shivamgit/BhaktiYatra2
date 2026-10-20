import { Menu } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { t } from '@/lib/i18n';
import Container from './Container';
import DesktopNavLinks, { DesktopNavLinksStatic } from './DesktopNavLinks';
import MobileNav from './MobileNav';
import UserMenu from './UserMenu';

/** Same size as the real menu button, shown while the current path streams in. */
function MobileNavPlaceholder() {
  return (
    <div className="md:hidden">
      <span aria-hidden="true" className="flex size-11 items-center justify-center text-text">
        <Menu className="size-6" />
      </span>
    </div>
  );
}

/**
 * Site header: brand, section links (desktop) or a menu button (mobile), account menu.
 * The link lists read the current path, which is request data under Cache Components, so they
 * sit in <Suspense> with path-independent fallbacks (the static shell stays complete).
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <Container className="relative flex h-16 items-center gap-4">
        <Suspense fallback={<MobileNavPlaceholder />}>
          <MobileNav />
        </Suspense>
        <Link href="/" className="mr-auto font-display text-2xl font-semibold text-accent">
          Bhakti<span className="text-primary">Yatra</span>
          <span className="sr-only"> — {t('site.tagline')}</span>
        </Link>
        <Suspense fallback={<DesktopNavLinksStatic />}>
          <DesktopNavLinks />
        </Suspense>
        <UserMenu />
      </Container>
    </header>
  );
}
