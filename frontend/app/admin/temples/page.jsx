'use client';

import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AdminListState, AdminPageHeader, AdminPager } from '@/components/admin/AdminList';
import StatusBadge from '@/components/admin/StatusBadge';
import { buttonClasses } from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { t } from '@/lib/i18n';

const STATUSES = ['draft', 'published', 'archived'];

export default function AdminTemplesPage() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState({ q: '', status: '', page: 1 });
  const params = new URLSearchParams({ page: String(query.page), limit: '20' });
  if (query.q) params.set('q', query.q);
  if (query.status) params.set('status', query.status);
  const { data, meta, loading, error, reload } = useAdminData(`/admin/temples?${params}`);

  return (
    <section>
      <AdminPageHeader
        title={t('adminContent.templesTitle')}
        action={
          <Link href="/admin/temples/new" className={buttonClasses()}>
            <Plus aria-hidden="true" className="size-4" />
            {t('adminContent.newTemple')}
          </Link>
        }
      />
      <form
        role="search"
        className="mt-6 flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery((s) => ({ ...s, q: q.trim(), page: 1 }));
        }}
      >
        <label htmlFor="admin-temple-search" className="sr-only">
          {t('adminContent.searchTemples')}
        </label>
        <input
          id="admin-temple-search"
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t('adminContent.searchTemples')}
          className={`${inputClasses(false)} max-w-xs`}
        />
        <label htmlFor="admin-temple-status" className="sr-only">
          {t('adminContent.status')}
        </label>
        <select
          id="admin-temple-status"
          value={query.status}
          onChange={(event) => setQuery((s) => ({ ...s, status: event.target.value, page: 1 }))}
          className={`${inputClasses(false)} max-w-48`}
        >
          <option value="">{t('adminContent.allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClasses({ variant: 'secondary' })}>
          {t('adminContent.search')}
        </button>
      </form>

      <AdminListState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">
                  {t('adminContent.name')}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {t('adminContent.place')}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {t('adminContent.status')}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {t('adminContent.images')}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {t('adminContent.updated')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.map((temple) => (
                <tr key={temple.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
                        {temple.primaryImage && (
                          <Image
                            src={temple.primaryImage.url}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <Link
                        href={`/admin/temples/${temple.id}`}
                        className="font-medium text-text hover:text-primary"
                      >
                        {temple.name}
                      </Link>
                    </div>
                  </td>
                  <td className="p-3 text-text-muted">
                    {temple.city}, {temple.state}
                  </td>
                  <td className="p-3">
                    <StatusBadge value={temple.status} />
                  </td>
                  <td className="p-3 text-text-muted">{temple.imageCount}</td>
                  <td className="p-3 text-text-muted">
                    {new Date(temple.updatedAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPager meta={meta} onPage={(page) => setQuery((s) => ({ ...s, page }))} />
      </AdminListState>
    </section>
  );
}
