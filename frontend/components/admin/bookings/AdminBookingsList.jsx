'use client';

import { Download, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminListState, AdminPageHeader, AdminPager } from '@/components/admin/AdminList';
import StatusBadge from '@/components/admin/StatusBadge';
import BookingStatus from '@/components/bookings/BookingStatus';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { adminErrorMessage } from '@/lib/admin/errors';
import { formatDateTime } from '@/lib/admin/format';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiQuery, useUrlQuery } from '@/lib/admin/use-url-query';
import { apiDownload } from '@/lib/api/client';
import { formatDate, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'cancellation_requested',
  'payment_received_no_seats',
  'cancelled',
  'expired',
];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];
const SORTS = ['-createdAt', 'createdAt', 'startDate', '-amount'];
const FILTERS = ['q', 'bookingStatus', 'paymentStatus', 'from', 'to', 'sort', 'user', 'tour'];

/** Admin bookings list (docs/05-features/07-admin-panel.md "Bookings"). Filters live in the URL. */
export default function AdminBookingsList() {
  const [query, setQuery] = useUrlQuery({ sort: '-createdAt', page: '1' });
  const [q, setQ] = useState(query.q ?? '');
  const [exporting, setExporting] = useState(false);
  const filters = Object.fromEntries(FILTERS.map((key) => [key, query[key]]));
  const { data, meta, loading, error, reload } = useAdminData(
    `/admin/bookings?${apiQuery({ ...filters, page: query.page, limit: 20 })}`,
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      await apiDownload(
        `/admin/bookings?${apiQuery({ ...filters, format: 'csv' })}`,
        'bookings.csv',
      );
    } catch (err) {
      toast.error(adminErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const select = (id, key, label, options, renderLabel) => (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={query[key] ?? ''}
        onChange={(event) => setQuery({ [key]: event.target.value })}
        className={cn(inputClasses(false), 'w-auto max-w-56')}
      >
        {key !== 'sort' && <option value="">{label}</option>}
        {options.map((value) => (
          <option key={value} value={value}>
            {renderLabel(value)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section>
      <AdminPageHeader
        title={t('admin.bookings')}
        action={
          <Button variant="secondary" onClick={exportCsv} loading={exporting}>
            <Download aria-hidden="true" className="size-4" />
            {t('adminOps.exportCsv')}
          </Button>
        }
      />

      <form
        role="search"
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery({ q: q.trim() });
        }}
      >
        <div className="w-full sm:w-72">
          <label htmlFor="booking-search" className="sr-only">
            {t('adminOps.searchBookings')}
          </label>
          <input
            id="booking-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t('adminOps.searchBookings')}
            className={inputClasses(false)}
          />
        </div>
        {select(
          'booking-status',
          'bookingStatus',
          t('adminOps.allBookingStatuses'),
          BOOKING_STATUSES,
          (s) => t(`booking.status.${s}`),
        )}
        {select(
          'payment-status',
          'paymentStatus',
          t('adminOps.allPaymentStatuses'),
          PAYMENT_STATUSES,
          (s) => t(`adminOps.paymentStatus.${s}`),
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="booking-from" className="text-sm text-text-muted">
            {t('adminOps.createdFrom')}
          </label>
          <input
            id="booking-from"
            type="date"
            value={query.from ?? ''}
            onChange={(event) => setQuery({ from: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          />
          <label htmlFor="booking-to" className="text-sm text-text-muted">
            {t('adminOps.to')}
          </label>
          <input
            id="booking-to"
            type="date"
            value={query.to ?? ''}
            onChange={(event) => setQuery({ to: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          />
        </div>
        {select('booking-sort', 'sort', t('adminOps.sortBy'), SORTS, (s) =>
          t(`adminOps.sort.${s}`),
        )}
        <Button type="submit" variant="secondary">
          {t('adminContent.search')}
        </Button>
      </form>

      {(query.user || query.tour) && (
        <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
          {query.user ? t('adminOps.filteredByAccount') : t('adminOps.filteredByTour')}
          <button
            type="button"
            onClick={() => setQuery({ user: '', tour: '' })}
            className="inline-flex items-center gap-1 rounded-sm px-1 font-medium text-primary hover:underline"
          >
            <X aria-hidden="true" className="size-3.5" />
            {t('adminOps.clearFilter')}
          </button>
        </p>
      )}

      <AdminListState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
        <p className="mt-6 text-sm text-text-muted" aria-live="polite">
          {t('adminOps.resultCount', { count: meta?.total ?? 0 })}
        </p>
        <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                {[
                  'reference',
                  'customer',
                  'trip',
                  'seats',
                  'amount',
                  'bookingStatus',
                  'payment',
                  'created',
                ].map((key) => (
                  <th key={key} scope="col" className="p-3 font-medium">
                    {t(`adminOps.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.map((b) => (
                <tr key={b.id} className="border-t border-border align-top">
                  <td className="p-3">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-mono font-medium whitespace-nowrap text-primary hover:underline"
                    >
                      {b.bookingReference}
                    </Link>
                  </td>
                  <td className="p-3">
                    <p className="text-text">{b.contact.name}</p>
                    <p className="break-all text-text-muted">{b.contact.email}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-text">{b.tour.title}</p>
                    <p className="text-text-muted">{formatDate(b.departure.startDate)}</p>
                  </td>
                  <td className="p-3 text-text">{b.seats}</td>
                  <td className="p-3 text-text">{formatPrice(b.amount)}</td>
                  <td className="p-3">
                    <BookingStatus status={b.bookingStatus} />
                  </td>
                  <td className="p-3">
                    <StatusBadge value={b.paymentStatus} />
                  </td>
                  <td className="p-3 whitespace-nowrap text-text-muted">
                    {formatDateTime(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPager meta={meta} onPage={(page) => setQuery({ page })} />
      </AdminListState>
    </section>
  );
}
