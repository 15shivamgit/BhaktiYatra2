'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { AdminListState, AdminPageHeader } from '@/components/admin/AdminList';
import BookingStatus from '@/components/bookings/BookingStatus';
import { inputClasses } from '@/components/ui/FormField';
import { formatDateTime } from '@/lib/admin/format';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { useUrlQuery } from '@/lib/admin/use-url-query';
import { formatDate, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const RANGES = ['7d', '30d', '90d', 'mtd'];
const STATUS_ORDER = [
  'pending',
  'confirmed',
  'cancellation_requested',
  'payment_received_no_seats',
  'cancelled',
  'expired',
];

/** Where each alert is resolved. */
const ALERT_LINKS = {
  payment_received_no_seats: '/admin/bookings?bookingStatus=payment_received_no_seats',
  cancellation_requested: '/admin/bookings?bookingStatus=cancellation_requested',
};

function StatCard({ label, value, detail, href }) {
  const body = (
    <>
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold text-text tabular-nums">{value}</dd>
      {detail && <dd className="mt-1 text-sm text-text-muted">{detail}</dd>}
    </>
  );
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      {href ? (
        <Link href={href} className="block hover:[&_dd:first-of-type]:text-primary">
          <dl>{body}</dl>
        </Link>
      ) : (
        <dl>{body}</dl>
      )}
    </div>
  );
}

function Alerts({ alerts }) {
  const active = alerts.filter((a) => a.count > 0);
  if (!active.length) {
    return (
      <p className="mt-6 flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-4 text-sm text-success">
        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
        {t('adminOps.allClear')}
      </p>
    );
  }
  return (
    <section aria-labelledby="dash-alerts" className="mt-6">
      <h2 id="dash-alerts" className="sr-only">
        {t('adminOps.alerts')}
      </h2>
      <ul className="space-y-2">
        {active.map((alert) => (
          <li
            key={alert.type}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm text-text"
          >
            <AlertTriangle aria-hidden="true" className="size-5 shrink-0 text-warning" />
            <span className="flex-1">
              {t(`adminOps.alert.${alert.type}`, { count: alert.count })}
            </span>
            {ALERT_LINKS[alert.type] && (
              <Link
                href={ALERT_LINKS[alert.type]}
                className="font-medium text-primary hover:underline"
              >
                {t('adminOps.review')}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Admin dashboard (docs/05-features/07-admin-panel.md "Dashboard"). */
export default function AdminDashboard() {
  const [query, setQuery] = useUrlQuery({ range: '7d' });
  const range = RANGES.includes(query.range) ? query.range : '7d';
  const { data, meta, loading, error, reload } = useAdminData(`/admin/dashboard?range=${range}`);
  const rangeLabel = t(`adminOps.range.${range}`);

  return (
    <section>
      <AdminPageHeader
        title={t('admin.dashboard')}
        action={
          <div className="flex items-center gap-2">
            <label htmlFor="dash-range" className="text-sm text-text-muted">
              {t('adminOps.rangeLabel')}
            </label>
            <select
              id="dash-range"
              value={range}
              onChange={(event) => setQuery({ range: event.target.value })}
              className={cn(inputClasses(false), 'w-auto')}
            >
              {RANGES.map((r) => (
                <option key={r} value={r}>
                  {t(`adminOps.range.${r}`)}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <AdminListState loading={loading} error={error} empty={!data} onRetry={reload}>
        {data && (
          <>
            <Alerts alerts={data.alerts} />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label={t('adminOps.netRevenue', { range: rangeLabel })}
                value={formatPrice(data.revenue.netInRange)}
                detail={t('adminOps.revenueDetail', {
                  captured: formatPrice(data.revenue.capturedInRange),
                  refunded: formatPrice(data.revenue.refundedInRange),
                })}
                href="/admin/payments?status=captured"
              />
              <StatCard
                label={t('adminOps.confirmedBookings', { range: rangeLabel })}
                value={data.bookings.confirmedInRange}
                detail={t('adminOps.seatsCount', { count: data.bookings.seatsConfirmedInRange })}
                href="/admin/bookings?bookingStatus=confirmed"
              />
              <StatCard
                label={t('adminOps.activeHolds')}
                value={data.holds.activePending}
                detail={t('adminOps.seatsHeld', { count: data.holds.seatsHeld })}
                href="/admin/bookings?bookingStatus=pending"
              />
              <StatCard
                label={t('adminOps.upcomingDepartures')}
                value={data.departures.upcoming}
                detail={t('adminOps.departuresDetail', {
                  full: data.departures.full,
                  soon: data.departures.nextSevenDays,
                })}
                href="/admin/tours"
              />
              <StatCard
                label={t('adminOps.usersTotal')}
                value={data.users.total}
                detail={t('adminOps.newUsers', { count: data.users.newInRange, range: rangeLabel })}
                href="/admin/users"
              />
              <StatCard
                label={t('adminOps.allTimeRevenue')}
                value={formatPrice(data.revenue.netAllTime)}
                detail={t('adminOps.revenueDetail', {
                  captured: formatPrice(data.revenue.capturedAllTime),
                  refunded: formatPrice(data.revenue.refundedAllTime),
                })}
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section
                aria-labelledby="dash-status"
                className="rounded-lg border border-border bg-surface p-4"
              >
                <h2 id="dash-status" className="font-semibold text-text">
                  {t('adminOps.bookingsByStatus')}
                </h2>
                <ul className="mt-3 divide-y divide-border text-sm">
                  {STATUS_ORDER.map((status) => (
                    <li key={status} className="flex items-center justify-between gap-3 py-2">
                      <Link
                        href={`/admin/bookings?bookingStatus=${status}`}
                        className="hover:underline"
                      >
                        <BookingStatus status={status} />
                      </Link>
                      <span className="font-semibold text-text">
                        {data.bookings.byStatus[status] ?? 0}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section
                aria-labelledby="dash-content"
                className="rounded-lg border border-border bg-surface p-4"
              >
                <h2 id="dash-content" className="font-semibold text-text">
                  {t('adminOps.content')}
                </h2>
                <dl className="mt-3 divide-y divide-border text-sm">
                  {[
                    [t('admin.temples'), data.content.templesPublished, data.content.templesDraft],
                    [t('admin.tours'), data.content.toursPublished, data.content.toursDraft],
                    [t('admin.circuits'), data.content.circuitsPublished, null],
                  ].map(([label, published, drafts]) => (
                    <div key={label} className="flex items-center justify-between gap-3 py-2">
                      <dt>{label}</dt>
                      <dd className="text-text-muted">
                        {t('adminOps.publishedCount', { count: published })}
                        {drafts !== null && ` · ${t('adminOps.draftCount', { count: drafts })}`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>

            <section aria-labelledby="dash-recent" className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h2 id="dash-recent" className="font-semibold text-text">
                  {t('adminOps.recentBookings')}
                </h2>
                <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
                  {t('adminOps.viewAll')}
                </Link>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-surface-muted text-text-muted">
                    <tr>
                      <th scope="col" className="p-3 font-medium">
                        {t('adminOps.reference')}
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        {t('adminOps.customer')}
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        {t('adminOps.trip')}
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        {t('adminOps.amount')}
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        {t('adminContent.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentBookings.map((b) => (
                      <tr key={b.id} className="border-t border-border">
                        <td className="p-3">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="font-mono font-medium whitespace-nowrap text-primary hover:underline"
                          >
                            {b.bookingReference}
                          </Link>
                        </td>
                        <td className="p-3 text-text">{b.contact.name}</td>
                        <td className="p-3 text-text-muted">
                          {b.tour.title} · {formatDate(b.departure.startDate)}
                        </td>
                        <td className="p-3 text-text">{formatPrice(b.amount)}</td>
                        <td className="p-3">
                          <BookingStatus status={b.bookingStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.recentBookings.length && (
                  <p className="p-4 text-sm text-text-muted">{t('adminOps.noBookingsYet')}</p>
                )}
              </div>
            </section>

            <section aria-labelledby="dash-audit" className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h2 id="dash-audit" className="font-semibold text-text">
                  {t('adminOps.recentActivity')}
                </h2>
                <Link href="/admin/audit" className="text-sm text-primary hover:underline">
                  {t('adminOps.viewAll')}
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
                {data.recentAudit.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3">
                    <code className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-xs">
                      {entry.action}
                    </code>
                    <span className="text-text">{entry.actorName ?? t('adminOps.system')}</span>
                    {entry.reason && <span className="text-text-muted">“{entry.reason}”</span>}
                    <time dateTime={entry.createdAt} className="ml-auto text-text-muted">
                      {formatDateTime(entry.createdAt)}
                    </time>
                  </li>
                ))}
                {!data.recentAudit.length && (
                  <li className="p-3 text-text-muted">{t('adminOps.noActivity')}</li>
                )}
              </ul>
            </section>
            <p className="mt-6 text-xs text-text-muted">
              {t('adminOps.cacheNote', {
                time: meta?.cachedAt ? formatDateTime(meta.cachedAt) : '',
              })}
            </p>
          </>
        )}
      </AdminListState>
    </section>
  );
}
