'use client';

import { ArrowLeft, Copy, Download, ExternalLink, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminListState } from '@/components/admin/AdminList';
import { ConfirmActionForm } from '@/components/admin/dialog-form';
import Modal from '@/components/admin/Modal';
import StatusBadge from '@/components/admin/StatusBadge';
import BookingStatus from '@/components/bookings/BookingStatus';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { adminErrorMessage } from '@/lib/admin/errors';
import { formatDateTime, humanize } from '@/lib/admin/format';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiDownload, apiFetch } from '@/lib/api/client';
import { formatDateRange, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import {
  CancelForm,
  ConfirmSeatsForm,
  MarkPaidForm,
  RejectCancellationForm,
} from './BookingActionForms';

function Panel({ id, title, children, action }) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-lg border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="font-semibold text-text">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Facts({ rows }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
      {rows
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-text-muted">{label}</dt>
            <dd className="min-w-0 break-words text-text">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function CopyId({ value }) {
  if (!value) return <span className="text-text-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <code className="text-xs break-all">{value}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            toast.success(t('adminOps.copied'));
          } catch {
            toast.error(t('adminOps.copyFailed'));
          }
        }}
        aria-label={t('adminOps.copyValue', { value })}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted"
      >
        <Copy aria-hidden="true" className="size-3.5" />
      </button>
    </span>
  );
}

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Timeline meta as short text ("reason: Plans changed · refundAmount: 7500"). */
function metaText(meta) {
  if (!meta) return '';
  return Object.entries(meta)
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object')
    .map(([k, v]) => `${humanize(k)}: ${ISO_TIME.test(String(v)) ? formatDateTime(v) : v}`)
    .join(' · ');
}

function NotesPanel({ booking, onNotes }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const body = await apiFetch(`/admin/bookings/${booking.id}/notes`, {
        method: 'POST',
        body: { text: text.trim() },
      });
      onNotes(body.data);
      setText('');
      toast.success(t('adminOps.noteAdded'));
    } catch (err) {
      toast.error(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel id="panel-notes" title={t('adminOps.internalNotes')}>
      <p className="text-xs text-text-muted">{t('adminOps.notesPrivate')}</p>
      {booking.notes.length > 0 && (
        <ul className="mt-3 space-y-3">
          {booking.notes.map((note, index) => (
            <li key={`${note.at}-${index}`} className="rounded-md bg-surface-muted p-3 text-sm">
              <p className="whitespace-pre-line break-words text-text">{note.text}</p>
              <p className="mt-1 text-xs text-text-muted">
                {note.by ?? t('adminOps.unknown')} · {formatDateTime(note.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="mt-3 space-y-2">
        <label htmlFor="note-text" className="sr-only">
          {t('adminOps.addNote')}
        </label>
        <textarea
          id="note-text"
          rows={2}
          required
          maxLength={1000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('adminOps.notePlaceholder')}
          className={inputClasses(false)}
        />
        <Button type="submit" size="sm" variant="secondary" loading={busy}>
          {t('adminOps.addNote')}
        </Button>
      </form>
    </Panel>
  );
}

const DIALOG_TITLES = {
  markPaid: 'adminOps.markPaid',
  cancel: 'adminOps.cancelBooking',
  rejectCancellation: 'adminOps.rejectCancellation',
  confirmSeats: 'adminOps.confirmSeats',
  regenerateDocuments: 'adminOps.regenerateDocuments',
};

/** Admin booking page (docs/05-features/07-admin-panel.md "Bookings"). */
export default function AdminBookingDetail({ id }) {
  const { data: booking, loading, error, reload, setData } = useAdminData(`/admin/bookings/${id}`);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(null);
  const close = () => setDialog(null);
  const done = (message) => (body) => {
    close();
    setData(body.data);
    toast.success(message);
  };
  const can = (action) => booking?.allowedActions.includes(action);

  const resend = async () => {
    setBusy('resend');
    try {
      const body = await apiFetch(`/admin/bookings/${id}/resend-confirmation`, { method: 'POST' });
      setData(body.data);
      toast.success(t('adminOps.resendQueued', { email: body.data.contact.email }));
    } catch (err) {
      toast.error(adminErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const download = async (kind) => {
    setBusy(kind);
    try {
      await apiDownload(`/bookings/${booking.bookingReference}/${kind}`, `${kind}.pdf`);
    } catch (err) {
      toast.error(adminErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminListState loading={loading} error={error} empty={!booking} onRetry={reload}>
      {booking && (
        <article className="space-y-6">
          <div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('adminOps.allBookings')}
            </Link>
            <header className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-mono text-2xl font-semibold text-accent sm:text-3xl">
                  {booking.bookingReference}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <BookingStatus status={booking.bookingStatus} />
                  <StatusBadge value={booking.paymentStatus} />
                  <span>
                    {t('adminOps.createdAt', { time: formatDateTime(booking.createdAt) })}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {can('markPaid') && (
                  <Button size="sm" onClick={() => setDialog('markPaid')}>
                    {t('adminOps.markPaid')}
                  </Button>
                )}
                {can('confirmSeats') && (
                  <Button size="sm" onClick={() => setDialog('confirmSeats')}>
                    {t('adminOps.confirmSeats')}
                  </Button>
                )}
                {can('rejectCancellation') && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDialog('rejectCancellation')}
                  >
                    {t('adminOps.rejectCancellation')}
                  </Button>
                )}
                {can('cancel') && (
                  <Button size="sm" variant="destructive" onClick={() => setDialog('cancel')}>
                    {booking.bookingStatus === 'cancellation_requested' ||
                    booking.bookingStatus === 'payment_received_no_seats'
                      ? t('adminOps.processCancellation')
                      : t('adminOps.cancelBooking')}
                  </Button>
                )}
              </div>
            </header>
            {booking.allowedActions.length === 1 && (
              <p className="mt-2 text-sm text-text-muted">
                {t('adminOps.noActions', {
                  status: t(`booking.status.${booking.bookingStatus}`).toLowerCase(),
                })}
              </p>
            )}
          </div>

          {booking.bookingStatus === 'cancellation_requested' && (
            <Alert tone="info">
              <p className="font-semibold">
                {booking.cancellation?.departureCancelled
                  ? t('adminOps.departureCancelledBanner')
                  : t('adminOps.cancellationRequestedBanner', {
                      time: formatDateTime(booking.cancellation?.requestedAt),
                    })}
              </p>
              {booking.cancellation?.reason && <p>“{booking.cancellation.reason}”</p>}
              {booking.cancellationQuote && (
                <p>
                  {t('adminOps.suggestedRefundText', {
                    amount: formatPrice(booking.cancellationQuote.suggestedRefund),
                    pct: booking.cancellationQuote.chargePct,
                  })}
                </p>
              )}
            </Alert>
          )}
          {booking.bookingStatus === 'payment_received_no_seats' && (
            <Alert tone="danger">
              <p className="font-semibold">{t('adminOps.noSeatsBanner')}</p>
              <p>
                {t('adminOps.seatsNow', {
                  available: booking.departureLive?.seatsAvailable ?? 0,
                  needed: booking.seats,
                })}
              </p>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel id="panel-customer" title={t('adminOps.customer')}>
              <Facts
                rows={[
                  [t('adminOps.contactName'), booking.contact.name],
                  [
                    t('adminOps.email'),
                    <a
                      key="e"
                      href={`mailto:${booking.contact.email}`}
                      className="text-primary hover:underline"
                    >
                      {booking.contact.email}
                    </a>,
                  ],
                  [
                    t('adminOps.phone'),
                    <a
                      key="p"
                      href={`tel:${booking.contact.phone}`}
                      className="text-primary hover:underline"
                    >
                      {booking.contact.phone}
                    </a>,
                  ],
                  [
                    t('adminOps.account'),
                    booking.user && (
                      <Link
                        key="u"
                        href={`/admin/users?q=${encodeURIComponent(booking.user.email)}`}
                        className="text-primary hover:underline"
                      >
                        {booking.user.name} ({booking.user.email})
                      </Link>
                    ),
                  ],
                ]}
              />
            </Panel>

            <Panel
              id="panel-trip"
              title={t('adminOps.trip')}
              action={
                <Link
                  href={`/tours/${booking.tour.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {t('adminOps.publicPage')}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </Link>
              }
            >
              <Facts
                rows={[
                  [t('adminOps.tour'), booking.snapshot.tourTitle],
                  [
                    t('adminOps.dates'),
                    formatDateRange(booking.snapshot.startDate, booking.snapshot.endDate),
                  ],
                  [
                    t('adminOps.pickup'),
                    booking.snapshot.pickupCity ?? t('adminOps.asPerItinerary'),
                  ],
                  [t('adminOps.seats'), booking.seats],
                  [
                    t('adminOps.amount'),
                    `${formatPrice(booking.amount)} (${booking.seats} × ${formatPrice(booking.unitPrice)})`,
                  ],
                  [
                    t('adminOps.departureNow'),
                    booking.departureLive &&
                      t('adminOps.departureLive', {
                        status: humanize(booking.departureLive.status),
                        available: booking.departureLive.seatsAvailable,
                        total: booking.departureLive.totalSeats,
                      }),
                  ],
                ]}
              />
            </Panel>
          </div>

          <Panel
            id="panel-travellers"
            title={t('adminOps.travellers', { count: booking.travellerCount })}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-text-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      #
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t('adminOps.contactName')}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t('adminOps.age')}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t('adminOps.gender')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {booking.travellers.map((tr, index) => (
                    <tr key={`${tr.name}-${index}`} className="border-t border-border">
                      <td className="py-2 pr-3 text-text-muted">{index + 1}</td>
                      <td className="py-2 pr-3 text-text">{tr.name}</td>
                      <td className="py-2 pr-3 text-text">{tr.age}</td>
                      <td className="py-2 pr-3 text-text capitalize">{tr.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel id="panel-payments" title={t('adminOps.payments')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-text-muted">
                  <tr>
                    {[
                      'status',
                      'amount',
                      'method',
                      'verifiedVia',
                      'paymentId',
                      'orderId',
                      'date',
                    ].map((k) => (
                      <th key={k} scope="col" className="py-2 pr-3 font-medium">
                        {t(`adminOps.col.${k}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {booking.payments.map((p) => (
                    <tr key={p.id} className="border-t border-border align-top">
                      <td className="py-2 pr-3">
                        <StatusBadge value={p.status} />
                        {p.failureReason && (
                          <p className="mt-1 text-xs text-text-muted">
                            {humanize(p.failureReason)}
                          </p>
                        )}
                        {p.refund && (
                          <p className="mt-1 text-xs text-text-muted">
                            {t('adminOps.refundedAmount', { amount: formatPrice(p.refund.amount) })}
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-text">{formatPrice(p.amount)}</td>
                      <td className="py-2 pr-3 text-text">{p.method ? humanize(p.method) : '—'}</td>
                      <td className="py-2 pr-3 text-text">{p.verifiedVia ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <CopyId value={p.providerPaymentId} />
                      </td>
                      <td className="py-2 pr-3">
                        <CopyId value={p.providerOrderId} />
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-text-muted">
                        {formatDateTime(p.capturedAt ?? p.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!booking.payments.length && (
                <p className="text-sm text-text-muted">{t('adminOps.noPayments')}</p>
              )}
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel id="panel-documents" title={t('adminOps.documents')}>
              {booking.invoice || booking.ticket ? (
                <Facts
                  rows={[
                    [t('adminOps.invoiceNumber'), booking.invoice?.number],
                    [t('adminOps.ticketIssued'), formatDateTime(booking.ticket?.generatedAt)],
                  ]}
                />
              ) : (
                <p className="text-sm text-text-muted">{t('adminOps.noDocuments')}</p>
              )}
              {can('regenerateDocuments') && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {booking.ticket && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === 'ticket'}
                      onClick={() => download('ticket')}
                    >
                      <Download aria-hidden="true" className="size-4" />
                      {t('adminOps.downloadTicket')}
                    </Button>
                  )}
                  {booking.invoice && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === 'invoice'}
                      onClick={() => download('invoice')}
                    >
                      <Download aria-hidden="true" className="size-4" />
                      {t('adminOps.downloadInvoice')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDialog('regenerateDocuments')}
                  >
                    <RefreshCw aria-hidden="true" className="size-4" />
                    {t('adminOps.regenerateDocuments')}
                  </Button>
                  <Button size="sm" variant="ghost" loading={busy === 'resend'} onClick={resend}>
                    <Mail aria-hidden="true" className="size-4" />
                    {t('adminOps.resendConfirmation')}
                  </Button>
                </div>
              )}
              {booking.cancellation && (
                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-text">{t('adminOps.cancellation')}</h3>
                  <div className="mt-2">
                    <Facts
                      rows={[
                        [t('adminOps.requested'), formatDateTime(booking.cancellation.requestedAt)],
                        [t('adminOps.reason'), booking.cancellation.reason],
                        [
                          t('adminOps.refund'),
                          booking.cancellation.refundAmount !== null &&
                            `${formatPrice(booking.cancellation.refundAmount)}${
                              booking.cancellation.refundMethod &&
                              booking.cancellation.refundMethod !== 'none'
                                ? ` · ${t(`adminOps.refundMethodName.${booking.cancellation.refundMethod}`)}`
                                : ''
                            }`,
                        ],
                        [t('adminOps.refundReference'), booking.cancellation.refundReference],
                        [t('adminOps.processedBy'), booking.cancellation.processedBy],
                      ]}
                    />
                  </div>
                </div>
              )}
            </Panel>

            <NotesPanel booking={booking} onNotes={(notes) => setData({ ...booking, notes })} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel id="panel-timeline" title={t('adminOps.timeline')}>
              <ol className="space-y-3 text-sm">
                {[...booking.timeline].reverse().map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="border-l-2 border-border pl-3">
                    <p className="font-medium text-text">{humanize(entry.event)}</p>
                    <p className="text-xs text-text-muted">
                      {formatDateTime(entry.at)} · {entry.by}
                    </p>
                    {metaText(entry.meta) && (
                      <p className="mt-0.5 break-words text-xs text-text-muted">
                        {metaText(entry.meta)}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel id="panel-emails" title={t('adminOps.emails')}>
              {booking.notifications.length ? (
                <ul className="space-y-3 text-sm">
                  {booking.notifications.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-text">{humanize(n.type)}</p>
                        <p className="break-all text-xs text-text-muted">
                          {n.to} · {formatDateTime(n.sentAt ?? n.createdAt)}
                        </p>
                        {n.lastError && (
                          <p className="break-words text-xs text-danger">{n.lastError}</p>
                        )}
                      </div>
                      <StatusBadge value={n.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">{t('adminOps.noEmails')}</p>
              )}
            </Panel>
          </div>

          <Panel
            id="panel-audit"
            title={t('adminOps.auditEntries')}
            action={
              <Link
                href={`/admin/audit?entityType=Booking&entityId=${booking.id}`}
                className="text-sm text-primary hover:underline"
              >
                {t('adminOps.openInAudit')}
              </Link>
            }
          >
            {booking.auditLogs.length ? (
              <ul className="divide-y divide-border text-sm">
                {booking.auditLogs.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <code className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-xs">
                      {entry.action}
                    </code>
                    <span className="text-text">{entry.actor?.name ?? t('adminOps.system')}</span>
                    {entry.reason && <span className="text-text-muted">“{entry.reason}”</span>}
                    <time dateTime={entry.createdAt} className="ml-auto text-text-muted">
                      {formatDateTime(entry.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">{t('adminOps.noActivity')}</p>
            )}
          </Panel>

          <Modal
            open={Boolean(dialog)}
            onClose={close}
            title={dialog ? t(DIALOG_TITLES[dialog]) : ''}
          >
            {dialog === 'markPaid' && (
              <MarkPaidForm booking={booking} onDone={done(t('adminOps.paymentRecorded'))} />
            )}
            {dialog === 'cancel' && (
              <CancelForm booking={booking} onDone={done(t('adminOps.bookingCancelled'))} />
            )}
            {dialog === 'rejectCancellation' && (
              <RejectCancellationForm
                booking={booking}
                onDone={done(t('adminOps.requestRejected'))}
              />
            )}
            {dialog === 'confirmSeats' && (
              <ConfirmSeatsForm booking={booking} onDone={done(t('adminOps.bookingConfirmed'))} />
            )}
            {dialog === 'regenerateDocuments' && (
              <ConfirmActionForm
                message={t('adminOps.regenerateWarning')}
                confirmLabel={t('adminOps.regenerateDocuments')}
                request={() =>
                  apiFetch(`/admin/bookings/${booking.id}/regenerate-documents`, { method: 'POST' })
                }
                onDone={done(t('adminOps.documentsRegenerated'))}
              />
            )}
          </Modal>
        </article>
      )}
    </AdminListState>
  );
}
