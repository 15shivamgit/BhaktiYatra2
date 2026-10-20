'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AdminListState, AdminPageHeader, AdminPager } from '@/components/admin/AdminList';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { formatDateTime, humanize } from '@/lib/admin/format';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiQuery, useUrlQuery } from '@/lib/admin/use-url-query';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const STATUSES = ['created', 'authorized', 'captured', 'failed', 'refunded'];

/** Every payment attempt across bookings (docs/05-features/07-admin-panel.md "Payments"). */
export default function AdminPaymentsPage() {
  const [query, setQuery] = useUrlQuery({ page: '1' });
  const [q, setQ] = useState(query.q ?? '');
  const { data, meta, loading, error, reload } = useAdminData(
    `/admin/payments?${apiQuery({
      q: query.q,
      status: query.status,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: 20,
    })}`,
  );

  return (
    <section>
      <AdminPageHeader title={t('admin.payments')} />
      <form
        role="search"
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery({ q: q.trim() });
        }}
      >
        <div className="w-full sm:w-80">
          <label htmlFor="payment-search" className="sr-only">
            {t('adminOps.searchPayments')}
          </label>
          <input
            id="payment-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t('adminOps.searchPayments')}
            className={inputClasses(false)}
          />
        </div>
        <div>
          <label htmlFor="payment-status" className="sr-only">
            {t('adminContent.status')}
          </label>
          <select
            id="payment-status"
            value={query.status ?? ''}
            onChange={(event) => setQuery({ status: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          >
            <option value="">{t('adminOps.allPaymentStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`adminOps.recordStatus.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="payment-from" className="text-sm text-text-muted">
            {t('adminOps.from')}
          </label>
          <input
            id="payment-from"
            type="date"
            value={query.from ?? ''}
            onChange={(event) => setQuery({ from: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          />
          <label htmlFor="payment-to" className="text-sm text-text-muted">
            {t('adminOps.to')}
          </label>
          <input
            id="payment-to"
            type="date"
            value={query.to ?? ''}
            onChange={(event) => setQuery({ to: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          />
        </div>
        <Button type="submit" variant="secondary">
          {t('adminContent.search')}
        </Button>
      </form>

      <AdminListState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
        <p className="mt-6 text-sm text-text-muted" aria-live="polite">
          {t('adminOps.resultCount', { count: meta?.total ?? 0 })}
        </p>
        <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                {[
                  'date',
                  'booking',
                  'customerEmail',
                  'amount',
                  'status',
                  'method',
                  'paymentId',
                  'orderId',
                ].map((key) => (
                  <th key={key} scope="col" className="p-3 font-medium">
                    {t(`adminOps.col.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p.id} className="border-t border-border align-top">
                  <td className="p-3 whitespace-nowrap text-text-muted">
                    {formatDateTime(p.capturedAt ?? p.createdAt)}
                  </td>
                  <td className="p-3">
                    {p.booking ? (
                      <Link
                        href={`/admin/bookings/${p.booking.id}`}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {p.booking.bookingReference}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 break-all text-text">{p.userEmail ?? '—'}</td>
                  <td className="p-3 text-text">
                    {formatPrice(p.amount)}
                    {p.refund && (
                      <p className="text-xs text-text-muted">
                        {t('adminOps.refundedAmount', { amount: formatPrice(p.refund.amount) })}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge value={p.status} />
                    {p.failureReason && (
                      <p className="mt-1 text-xs text-text-muted">{humanize(p.failureReason)}</p>
                    )}
                  </td>
                  <td className="p-3 text-text">
                    {p.method ? humanize(p.method) : '—'}
                    {p.verifiedVia && (
                      <p className="text-xs text-text-muted">
                        {t('adminOps.via', { via: p.verifiedVia })}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <code className="text-xs break-all select-all">
                      {p.providerPaymentId ?? '—'}
                    </code>
                  </td>
                  <td className="p-3">
                    <code className="text-xs break-all select-all">{p.providerOrderId}</code>
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
