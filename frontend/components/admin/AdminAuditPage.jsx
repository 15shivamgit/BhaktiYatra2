'use client';

import { ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { AdminListState, AdminPageHeader, AdminPager } from '@/components/admin/AdminList';
import { inputClasses } from '@/components/ui/FormField';
import { formatDateTime } from '@/lib/admin/format';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiQuery, useUrlQuery } from '@/lib/admin/use-url-query';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const ACTION_PREFIXES = [
  'booking.',
  'departure.',
  'tour.',
  'temple.',
  'circuit.',
  'user.',
  'contact.',
  'auth.',
];
const ENTITY_TYPES = ['Booking', 'TourDeparture', 'Tour', 'Temple', 'Circuit', 'User', 'Contact'];

/** Where an audited entity can be opened in the admin. */
function entityHref(type, id) {
  if (type === 'Booking') return `/admin/bookings/${id}`;
  if (type === 'Tour') return `/admin/tours/${id}`;
  if (type === 'Temple') return `/admin/temples/${id}`;
  if (type === 'Circuit') return `/admin/circuits/${id}`;
  return null;
}

const show = (value) =>
  value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value);

/** Field-by-field before/after table; changed rows are marked. */
export function AuditDiff({ before, after }) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  if (!keys.length)
    return <p className="text-sm text-text-muted">{t('adminOps.noChangesRecorded')}</p>;
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-text-muted">
        <tr>
          <th scope="col" className="py-1 pr-3 font-medium">
            {t('adminOps.field')}
          </th>
          <th scope="col" className="py-1 pr-3 font-medium">
            {t('adminOps.before')}
          </th>
          <th scope="col" className="py-1 font-medium">
            {t('adminOps.after')}
          </th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => {
          const from = show(before?.[key]);
          const to = show(after?.[key]);
          const changed = from !== to;
          return (
            <tr key={key} className="border-t border-border align-top">
              <th scope="row" className="py-1 pr-3 font-mono font-normal text-text">
                {key}
                {changed && <span className="sr-only"> ({t('adminOps.changed')})</span>}
              </th>
              <td
                className={cn(
                  'py-1 pr-3 font-mono break-all',
                  changed && 'bg-danger-soft text-danger',
                )}
              >
                {from}
              </td>
              <td
                className={cn(
                  'py-1 font-mono break-all',
                  changed && 'bg-success-soft text-success',
                )}
              >
                {to}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Audit log (docs/05-features/07-admin-panel.md "Audit log"). */
export default function AdminAuditPage() {
  const [query, setQuery] = useUrlQuery({ page: '1' });
  const [open, setOpen] = useState(null);
  const { data, meta, loading, error, reload } = useAdminData(
    `/admin/audit-logs?${apiQuery({
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      actor: query.actor,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: 25,
    })}`,
  );

  return (
    <section>
      <AdminPageHeader title={t('admin.audit')} />
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="audit-action" className="sr-only">
            {t('adminOps.action')}
          </label>
          <select
            id="audit-action"
            value={query.action ?? ''}
            onChange={(event) => setQuery({ action: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          >
            <option value="">{t('adminOps.allActions')}</option>
            {ACTION_PREFIXES.map((a) => (
              <option key={a} value={a}>
                {t(`adminOps.actionGroup.${a.slice(0, -1)}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-entity" className="sr-only">
            {t('adminOps.entity')}
          </label>
          <select
            id="audit-entity"
            value={query.entityType ?? ''}
            onChange={(event) => setQuery({ entityType: event.target.value, entityId: '' })}
            className={cn(inputClasses(false), 'w-auto')}
          >
            <option value="">{t('adminOps.allEntities')}</option>
            {ENTITY_TYPES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="audit-from" className="text-sm text-text-muted">
            {t('adminOps.from')}
          </label>
          <input
            id="audit-from"
            type="date"
            value={query.from ?? ''}
            onChange={(event) => setQuery({ from: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          />
          <label htmlFor="audit-to" className="text-sm text-text-muted">
            {t('adminOps.to')}
          </label>
          <input
            id="audit-to"
            type="date"
            value={query.to ?? ''}
            onChange={(event) => setQuery({ to: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          />
        </div>
      </div>
      {(query.entityId || query.actor) && (
        <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
          {query.entityId
            ? t('adminOps.filteredByEntity', { id: query.entityId })
            : t('adminOps.filteredByActor')}
          <button
            type="button"
            onClick={() => setQuery({ entityId: '', actor: '' })}
            className="inline-flex items-center gap-1 rounded-sm px-1 font-medium text-primary hover:underline"
          >
            <X aria-hidden="true" className="size-3.5" />
            {t('adminOps.clearFilter')}
          </button>
        </p>
      )}

      <AdminListState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                {['time', 'actor', 'action', 'entity', 'reason'].map((key) => (
                  <th key={key} scope="col" className="p-3 font-medium">
                    {t(`adminOps.col.${key}`)}
                  </th>
                ))}
                <th scope="col" className="p-3 font-medium">
                  <span className="sr-only">{t('adminOps.details')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.map((entry) => {
                const expanded = open === entry.id;
                const href = entityHref(entry.entityType, entry.entityId);
                return (
                  <Fragment key={entry.id}>
                    <tr className="border-t border-border align-top">
                      <td className="p-3 whitespace-nowrap text-text-muted">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="p-3">
                        <p className="text-text">{entry.actor?.name ?? t('adminOps.system')}</p>
                        {entry.actor && (
                          <p className="break-all text-xs text-text-muted">{entry.actor.email}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <code className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-xs">
                          {entry.action}
                        </code>
                      </td>
                      <td className="p-3 text-text">
                        {href ? (
                          <Link href={href} className="text-primary hover:underline">
                            {entry.entityType}
                          </Link>
                        ) : (
                          entry.entityType
                        )}
                      </td>
                      <td className="p-3 break-words text-text-muted">{entry.reason ?? '—'}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={`audit-${entry.id}`}
                          onClick={() => setOpen(expanded ? null : entry.id)}
                          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm text-primary hover:bg-surface-muted"
                        >
                          {t('adminOps.changes')}
                          <ChevronDown
                            aria-hidden="true"
                            className={cn('size-4 transition-transform', expanded && 'rotate-180')}
                          />
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr id={`audit-${entry.id}`} className="bg-surface-muted/50">
                        <td colSpan={6} className="p-3">
                          <AuditDiff before={entry.before} after={entry.after} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminPager meta={meta} onPage={(page) => setQuery({ page })} />
      </AdminListState>
    </section>
  );
}
