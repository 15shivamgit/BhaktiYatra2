'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from './nav-links';

function Links({ pathname }) {
  return (
    <nav aria-label={t('nav.primary')} className="hidden md:block">
      <ul className="flex items-center gap-6 text-sm font-medium">
        {NAV_LINKS.map((link) => {
          const active =
            Boolean(pathname) && (pathname === link.href || pathname.startsWith(`${link.href}/`));
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-sm py-2 transition-colors hover:text-primary',
                  active ? 'text-primary' : 'text-text-muted',
                )}
              >
                {t(link.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Section links with the current section highlighted. */
export default function DesktopNavLinks() {
  return <Links pathname={usePathname()} />;
}

/** Same links without highlighting, used before the current path is known. */
export function DesktopNavLinksStatic() {
  return <Links pathname={null} />;
}
