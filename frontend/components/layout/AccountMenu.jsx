'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LayoutDashboard, LogOut, Ticket, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth/user-context';
import { t } from '@/lib/i18n';

function Avatar({ user }) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-full object-cover"
      />
    );
  }
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  // Initials come from CSS generated content so they are decoration, not part of the button's
  // accessible name (which must match its visible text: WCAG 2.5.3 "label in name").
  return (
    <span
      aria-hidden="true"
      data-initials={initials}
      className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white before:content-[attr(data-initials)]"
    />
  );
}

const itemClasses =
  'flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-muted';

/**
 * Account menu for signed-in users. Loaded only when someone is signed in, so visitors never
 * download the dropdown library (UserMenu imports it lazily).
 */
export default function AccountMenu() {
  const { user, logout } = useUser();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    toast.success(t('auth.loggedOut'));
    router.replace('/');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-surface-muted sm:pr-2">
        <Avatar user={user} />
        {/* Visible from sm up; on phones it stays available to screen readers. */}
        <span className="sr-only max-w-32 truncate text-sm font-medium text-text sm:not-sr-only">
          {user.name}
        </span>
        <ChevronDown aria-hidden="true" className="hidden size-4 text-text-muted sm:block" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-md border border-border bg-surface p-1 shadow-card-hover"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-text">{user.name}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild className={itemClasses}>
            <Link href="/account">
              <UserRound aria-hidden="true" className="size-4" />
              {t('nav.account')}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClasses}>
            <Link href="/account/bookings">
              <Ticket aria-hidden="true" className="size-4" />
              {t('nav.bookings')}
            </Link>
          </DropdownMenu.Item>
          {user.role === 'admin' && (
            <DropdownMenu.Item asChild className={itemClasses}>
              <Link href="/admin">
                <LayoutDashboard aria-hidden="true" className="size-4" />
                {t('nav.admin')}
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item onSelect={onLogout} className={`${itemClasses} text-danger`}>
            <LogOut aria-hidden="true" className="size-4" />
            {t('nav.logout')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
