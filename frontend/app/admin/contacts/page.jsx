'use client';

import { Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminListState, AdminPageHeader, AdminPager } from '@/components/admin/AdminList';
import StatusBadge from '@/components/admin/StatusBadge';
import Button, { buttonClasses } from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { adminErrorMessage } from '@/lib/admin/errors';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiFetch } from '@/lib/api/client';
import { t } from '@/lib/i18n';

const STATUSES = ['new', 'read', 'replied', 'spam'];

function replyHref(contact) {
  const subject = contact.subject ? `Re: ${contact.subject}` : 'Re: Your message to BhaktiYatra';
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}`;
}

export default function AdminContactsPage() {
  const [query, setQuery] = useState({ status: 'new', page: 1 });
  const [busy, setBusy] = useState(null);
  const params = new URLSearchParams({ page: String(query.page), limit: '20' });
  if (query.status) params.set('status', query.status);
  const { data, meta, loading, error, reload, setData } = useAdminData(`/admin/contacts?${params}`);

  const setStatus = async (contact, status) => {
    setBusy(`${contact.id}:${status}`);
    try {
      const body = await apiFetch(`/admin/contacts/${contact.id}`, {
        method: 'PATCH',
        body: { status },
      });
      setData(data.map((c) => (c.id === contact.id ? body.data : c)));
      toast.success(t('adminContent.statusUpdated'));
    } catch (err) {
      toast.error(adminErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section>
      <AdminPageHeader title={t('adminContent.contactsTitle')} />
      <div className="mt-6 flex flex-wrap gap-3">
        <label htmlFor="admin-contact-status" className="sr-only">
          {t('adminContent.status')}
        </label>
        <select
          id="admin-contact-status"
          value={query.status}
          onChange={(event) => setQuery({ status: event.target.value, page: 1 })}
          className={`${inputClasses(false)} max-w-48`}
        >
          <option value="">{t('adminContent.allMessages')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <AdminListState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
        <ul className="mt-6 space-y-4">
          {data?.map((contact) => (
            <li key={contact.id}>
              <article
                aria-labelledby={`contact-${contact.id}`}
                className="rounded-lg border border-border bg-surface p-4 sm:p-5"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id={`contact-${contact.id}`} className="font-semibold text-text">
                      {contact.subject || contact.name}
                    </h2>
                    <p className="mt-1 text-sm break-words text-text-muted">
                      {t('adminContent.from')}: {contact.name} ·{' '}
                      <a className="text-primary hover:underline" href={`mailto:${contact.email}`}>
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <>
                          {' · '}
                          <a className="text-primary hover:underline" href={`tel:${contact.phone}`}>
                            {contact.phone}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <StatusBadge value={contact.status} />
                    <time dateTime={contact.createdAt}>
                      {new Date(contact.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                </header>
                <p className="mt-3 whitespace-pre-line break-words text-text">{contact.message}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={replyHref(contact)} className={buttonClasses({ size: 'sm' })}>
                    <Mail aria-hidden="true" className="size-4" />
                    {t('adminContent.reply')}
                  </a>
                  {contact.status !== 'read' && contact.status !== 'replied' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === `${contact.id}:read`}
                      disabled={Boolean(busy)}
                      onClick={() => setStatus(contact, 'read')}
                    >
                      {t('adminContent.markRead')}
                    </Button>
                  )}
                  {contact.status !== 'replied' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === `${contact.id}:replied`}
                      disabled={Boolean(busy)}
                      onClick={() => setStatus(contact, 'replied')}
                    >
                      {t('adminContent.markReplied')}
                    </Button>
                  )}
                  {contact.status !== 'spam' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      loading={busy === `${contact.id}:spam`}
                      disabled={Boolean(busy)}
                      onClick={() => setStatus(contact, 'spam')}
                    >
                      {t('adminContent.markSpam')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={busy === `${contact.id}:new`}
                      disabled={Boolean(busy)}
                      onClick={() => setStatus(contact, 'new')}
                    >
                      {t('adminContent.notSpam')}
                    </Button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
        <AdminPager meta={meta} onPage={(page) => setQuery((s) => ({ ...s, page }))} />
      </AdminListState>
    </section>
  );
}
