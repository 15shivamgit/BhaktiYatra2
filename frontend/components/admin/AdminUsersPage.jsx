'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminListState, AdminPageHeader, AdminPager } from '@/components/admin/AdminList';
import { ConfirmActionForm } from '@/components/admin/dialog-form';
import Modal from '@/components/admin/Modal';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { formatDateTime } from '@/lib/admin/format';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiQuery, useUrlQuery } from '@/lib/admin/use-url-query';
import { apiFetch } from '@/lib/api/client';
import { useUser } from '@/lib/auth/user-context';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** What each confirm dialog changes. */
function changeFor(kind, target) {
  if (kind === 'role') {
    const role = target.role === 'admin' ? 'user' : 'admin';
    return {
      body: { role },
      title: role === 'admin' ? t('adminOps.makeAdmin') : t('adminOps.removeAdmin'),
      message: t(role === 'admin' ? 'adminOps.makeAdminWarning' : 'adminOps.removeAdminWarning', {
        name: target.name,
      }),
    };
  }
  const isActive = !target.isActive;
  return {
    body: { isActive },
    title: isActive ? t('adminOps.activate') : t('adminOps.deactivate'),
    message: t(isActive ? 'adminOps.activateWarning' : 'adminOps.deactivateWarning', {
      name: target.name,
    }),
  };
}

/** Users (docs/05-features/07-admin-panel.md "Users"). Admins cannot change their own account. */
export default function AdminUsersPage() {
  const { user: me } = useUser();
  const [query, setQuery] = useUrlQuery({ page: '1' });
  const [q, setQ] = useState(query.q ?? '');
  const [dialog, setDialog] = useState(null); // { kind: 'role' | 'active', target }
  const { data, meta, loading, error, reload, setData } = useAdminData(
    `/admin/users?${apiQuery({
      q: query.q,
      role: query.role,
      isActive: query.isActive,
      page: query.page,
      limit: 20,
    })}`,
  );
  const change = dialog ? changeFor(dialog.kind, dialog.target) : null;

  return (
    <section>
      <AdminPageHeader title={t('admin.users')} />
      <form
        role="search"
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery({ q: q.trim() });
        }}
      >
        <div className="w-full sm:w-80">
          <label htmlFor="user-search" className="sr-only">
            {t('adminOps.searchUsers')}
          </label>
          <input
            id="user-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t('adminOps.searchUsers')}
            className={inputClasses(false)}
          />
        </div>
        <div>
          <label htmlFor="user-role" className="sr-only">
            {t('adminOps.role')}
          </label>
          <select
            id="user-role"
            value={query.role ?? ''}
            onChange={(event) => setQuery({ role: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          >
            <option value="">{t('adminOps.allRoles')}</option>
            <option value="admin">{t('adminOps.roleName.admin')}</option>
            <option value="user">{t('adminOps.roleName.user')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="user-active" className="sr-only">
            {t('adminContent.status')}
          </label>
          <select
            id="user-active"
            value={query.isActive ?? ''}
            onChange={(event) => setQuery({ isActive: event.target.value })}
            className={cn(inputClasses(false), 'w-auto')}
          >
            <option value="">{t('adminOps.allUsers')}</option>
            <option value="true">{t('adminOps.activeOnly')}</option>
            <option value="false">{t('adminOps.inactiveOnly')}</option>
          </select>
        </div>
        <Button type="submit" variant="secondary">
          {t('adminContent.search')}
        </Button>
      </form>

      <AdminListState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                {['name', 'role', 'status', 'lastLogin', 'joined', 'actions'].map((key) => (
                  <th key={key} scope="col" className="p-3 font-medium">
                    {t(`adminOps.col.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-t border-border align-top">
                    <td className="p-3">
                      <p className="font-medium text-text">
                        {u.name}
                        {self && (
                          <span className="ml-2 text-xs text-text-muted">
                            ({t('adminOps.you')})
                          </span>
                        )}
                      </p>
                      <p className="break-all text-text-muted">{u.email}</p>
                      {u.phone && <p className="text-text-muted">{u.phone}</p>}
                    </td>
                    <td className="p-3">
                      <StatusBadge value={u.role} />
                    </td>
                    <td className="p-3">
                      <StatusBadge value={u.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="p-3 whitespace-nowrap text-text-muted">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-text-muted">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/bookings?user=${u.id}`}
                          className="inline-flex min-h-9 items-center rounded-md px-2 text-primary hover:bg-surface-muted"
                        >
                          {t('adminOps.bookingsLink')}
                        </Link>
                        {self ? (
                          <span className="inline-flex min-h-9 items-center text-xs text-text-muted">
                            {t('adminOps.cannotChangeSelf')}
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setDialog({ kind: 'role', target: u })}
                            >
                              {u.role === 'admin'
                                ? t('adminOps.removeAdmin')
                                : t('adminOps.makeAdmin')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={u.isActive ? 'text-danger' : undefined}
                              onClick={() => setDialog({ kind: 'active', target: u })}
                            >
                              {u.isActive ? t('adminOps.deactivate') : t('adminOps.activate')}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminPager meta={meta} onPage={(page) => setQuery({ page })} />
      </AdminListState>

      <Modal open={Boolean(dialog)} onClose={() => setDialog(null)} title={change?.title ?? ''}>
        {dialog && (
          <ConfirmActionForm
            message={change.message}
            confirmLabel={change.title}
            request={() =>
              apiFetch(`/admin/users/${dialog.target.id}`, { method: 'PATCH', body: change.body })
            }
            onDone={(body) => {
              setData(data.map((u) => (u.id === body.data.id ? body.data : u)));
              setDialog(null);
              toast.success(t('adminOps.userUpdated', { name: body.data.name }));
            }}
          />
        )}
      </Modal>
    </section>
  );
}
