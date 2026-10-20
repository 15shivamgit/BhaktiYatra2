'use client';

import {
  CalendarCheck,
  CreditCard,
  Inbox,
  Landmark,
  LayoutDashboard,
  Map,
  Route,
  ScrollText,
  Search,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { inputClasses } from '@/components/ui/FormField';
import { useUser } from '@/lib/auth/user-context';
import { APP_ENV } from '@/lib/config';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', key: 'admin.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/bookings', key: 'admin.bookings', icon: CalendarCheck },
  { href: '/admin/payments', key: 'admin.payments', icon: CreditCard },
  { href: '/admin/tours', key: 'admin.tours', icon: Map },
  { href: '/admin/temples', key: 'admin.temples', icon: Landmark },
  { href: '/admin/circuits', key: 'admin.circuits', icon: Route },
  { href: '/admin/users', key: 'admin.users', icon: Users },
  { href: '/admin/contacts', key: 'admin.contacts', icon: Inbox },
  { href: '/admin/audit', key: 'admin.audit', icon: ScrollText },
];

/** Top bar search: booking reference, email or phone. */
function AdminSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      action="/admin/search"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/admin/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="relative w-full max-w-md"
    >
      <label htmlFor="admin-global-search" className="sr-only">
        {t('adminOps.globalSearch')}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
      />
      <input
        id="admin-global-search"
        name="q"
        type="search"
        required
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={t('adminOps.globalSearchPlaceholder')}
        className={cn(inputClasses(false), 'pl-9')}
      />
    </form>
  );
}

/**
 * Admin frame (docs/05-features/07-admin-panel.md "Layout"): sidebar, top bar with global search
 * and environment badge. Tablet widths show the sidebar as icons; phones get a scrolling row.
 */
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const { user } = useUser();
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
      <aside className="shrink-0 md:w-16 lg:w-56">
        <nav
          aria-label={t('admin.panel')}
          className="rounded-lg bg-accent p-2 text-white shadow-card md:sticky md:top-24 lg:p-3"
        >
          <p className="px-3 pt-1 pb-2 font-display text-xl font-semibold md:sr-only lg:not-sr-only">
            {t('admin.panel')}
          </p>
          <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {NAV.map(({ href, key, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              const label = t(key);
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    title={label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-white/10 md:justify-center lg:justify-start',
                      active && 'bg-white/15 font-semibold',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span className="md:sr-only lg:not-sr-only">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <AdminSearch />
          <div className="flex items-center gap-3 text-sm text-text-muted">
            {APP_ENV !== 'production' && (
              <span className="rounded-sm bg-warning-soft px-2 py-0.5 text-xs font-semibold tracking-wide text-warning uppercase">
                {APP_ENV}
              </span>
            )}
            <span>{t('adminOps.signedInAs', { name: user?.name ?? '' })}</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
