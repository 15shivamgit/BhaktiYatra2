'use client';

import { CalendarCheck, Inbox, Landmark, LayoutDashboard, Map, Route, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Sidebar items; `phase` marks screens that are not built yet. */
const NAV = [
  { href: '/admin', key: 'admin.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/temples', key: 'admin.temples', icon: Landmark },
  { href: '/admin/circuits', key: 'admin.circuits', icon: Route },
  { href: '/admin/contacts', key: 'admin.contacts', icon: Inbox },
  { href: '/admin/tours', key: 'admin.tours', icon: Map, phase: 4 },
  { href: '/admin/bookings', key: 'admin.bookings', icon: CalendarCheck, phase: 8 },
  { href: '/admin/users', key: 'admin.users', icon: Users, phase: 8 },
];

/** Admin frame. The full layout (top bar, global search) arrives with Phase 8. */
export default function AdminShell({ children }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row lg:px-8">
      <aside className="shrink-0 md:w-56">
        <nav
          aria-label={t('admin.panel')}
          className="rounded-lg bg-accent p-3 text-white shadow-card md:sticky md:top-24"
        >
          <p className="px-3 pb-2 pt-1 font-display text-xl font-semibold">{t('admin.panel')}</p>
          <ul className="space-y-1">
            {NAV.map(({ href, key, icon: Icon, phase, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              const label = t(key);
              if (phase) {
                return (
                  <li key={href}>
                    <span
                      aria-disabled="true"
                      title={t('admin.comingInPhase', { phase })}
                      className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {label}
                      <span className="ml-auto text-[11px] uppercase tracking-wide">P{phase}</span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10',
                      active && 'bg-white/15 font-semibold',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
