'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminListState, AdminPageHeader } from '@/components/admin/AdminList';
import StatusBadge from '@/components/admin/StatusBadge';
import BookingStatus from '@/components/bookings/BookingStatus';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { formatDate, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

const LIMIT = 10;

/** Results for the top bar search: bookings (reference, email, phone, name) and accounts. */
export default function AdminSearchPage() {
  const q = (useSearchParams().get('q') ?? '').trim();
  const encoded = encodeURIComponent(q);
  const bookings = useAdminData(q ? `/admin/bookings?q=${encoded}&limit=${LIMIT}` : null);
  const users = useAdminData(q ? `/admin/users?q=${encoded}&limit=${LIMIT}` : null);

  return (
    <section>
      <AdminPageHeader title={q ? t('adminOps.resultsFor', { q }) : t('adminOps.searchTitle')} />
      {!q && <p className="mt-6 text-sm text-text-muted">{t('adminOps.searchHint')}</p>}
      {q && (
        <div className="mt-6 grid gap-8">
          <section aria-labelledby="search-bookings">
            <div className="flex items-center justify-between gap-3">
              <h2 id="search-bookings" className="font-semibold text-text">
                {t('admin.bookings')}
                {bookings.meta && ` (${bookings.meta.total})`}
              </h2>
              {bookings.meta?.total > LIMIT && (
                <Link
                  href={`/admin/bookings?q=${encoded}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t('adminOps.viewAll')}
                </Link>
              )}
            </div>
            <AdminListState
              loading={bookings.loading}
              error={bookings.error}
              empty={!bookings.data?.length}
              onRetry={bookings.reload}
            >
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
                {bookings.data?.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-mono font-medium text-primary hover:underline"
                    >
                      {b.bookingReference}
                    </Link>
                    <span className="text-text">{b.contact.name}</span>
                    <span className="break-all text-text-muted">{b.contact.email}</span>
                    <span className="text-text-muted">
                      {b.tour.title} · {formatDate(b.departure.startDate)} · {formatPrice(b.amount)}
                    </span>
                    <span className="ml-auto">
                      <BookingStatus status={b.bookingStatus} />
                    </span>
                  </li>
                ))}
              </ul>
            </AdminListState>
          </section>

          <section aria-labelledby="search-users">
            <h2 id="search-users" className="font-semibold text-text">
              {t('admin.users')}
              {users.meta && ` (${users.meta.total})`}
            </h2>
            <AdminListState
              loading={users.loading}
              error={users.error}
              empty={!users.data?.length}
              onRetry={users.reload}
            >
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
                {users.data?.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
                    <span className="font-medium text-text">{u.name}</span>
                    <span className="break-all text-text-muted">{u.email}</span>
                    {u.phone && <span className="text-text-muted">{u.phone}</span>}
                    <StatusBadge value={u.role} />
                    <Link
                      href={`/admin/bookings?user=${u.id}`}
                      className="ml-auto text-primary hover:underline"
                    >
                      {t('adminOps.bookingsLink')}
                    </Link>
                  </li>
                ))}
              </ul>
            </AdminListState>
          </section>
        </div>
      )}
    </section>
  );
}
