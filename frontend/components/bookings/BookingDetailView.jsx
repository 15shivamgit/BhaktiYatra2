'use client';

import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/admin/Modal';
import BookingStatus from '@/components/bookings/BookingStatus';
import PaymentPanel from '@/components/bookings/PaymentPanel';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { errorMessage } from '@/lib/api/messages';
import { bookingsApi, clockOffset } from '@/lib/bookings';
import { formatDateRange, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

const dateTime = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));

function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <h2 className="font-display text-xl font-semibold text-accent">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CancelDialog({ booking, open, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const paid = booking.bookingStatus === 'confirmed';
  const quote = booking.cancellationQuote;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await bookingsApi.cancel(booking.bookingReference, reason.trim() || undefined);
      onDone(body.data, body.meta);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={paid ? t('booking.requestCancellation') : t('booking.cancelBooking')}
    >
      <form onSubmit={submit} className="space-y-4">
        {paid && quote ? (
          <Alert tone="warning">
            <p>
              {t('booking.quoteText', {
                pct: quote.chargePct,
                refund: formatPrice(quote.suggestedRefund),
              })}
            </p>
            <p className="mt-1">{t('booking.quoteNote')}</p>
          </Alert>
        ) : (
          <p className="text-sm text-text-muted">{t('booking.cancelPendingText')}</p>
        )}
        {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <div className="space-y-1.5">
          <label htmlFor="cancel-reason" className="block text-sm font-medium text-text">
            {t('booking.reasonOptional')}
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={inputClasses(false)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="destructive" loading={busy}>
            {paid ? t('booking.sendRequest') : t('booking.confirmCancel')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('booking.keepBooking')}
          </Button>
        </div>
        <Link
          href="/refund-policy"
          target="_blank"
          className="block text-sm font-medium text-accent underline"
        >
          {t('booking.policyLink')}
        </Link>
      </form>
    </Modal>
  );
}

/** /account/bookings/[reference] (docs/06-design/02-page-specs.md "Account"). */
export default function BookingDetailView({ reference }) {
  const [state, setState] = useState({ booking: null, meta: null, error: null });
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bookingsApi
      .get(reference)
      .then((body) => !cancelled && setState({ booking: body.data, meta: body.meta, error: null }))
      .catch((error) => !cancelled && setState({ booking: null, meta: null, error }));
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const { booking, meta, error } = state;
  if (error) {
    return (
      <Alert tone="danger">
        {error.status === 404 ? t('booking.notFound') : errorMessage(error)}{' '}
        <Link href="/account/bookings" className="font-medium underline">
          {t('booking.myBookings')}
        </Link>
      </Alert>
    );
  }
  if (!booking) {
    return (
      <p role="status" className="text-text-muted">
        {t('booking.loading')}
      </p>
    );
  }

  const offsetMs = clockOffset(meta?.serverTime);
  const canCancel = ['pending', 'confirmed'].includes(booking.bookingStatus);
  const retryHref = `/tours/${booking.tour.slug}/book?departure=${booking.departure.id}`;

  return (
    <div className="space-y-6">
      <Link
        href="/account/bookings"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('booking.myBookings')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-text-muted">{booking.bookingReference}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-accent sm:text-4xl">
            {booking.tour.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BookingStatus status={booking.bookingStatus} />
            <span className="text-sm text-text-muted">
              {t(`booking.payment.${booking.paymentStatus}`)}
            </span>
          </div>
        </div>
        {canCancel && (
          <Button variant="secondary" onClick={() => setCancelOpen(true)}>
            {booking.bookingStatus === 'confirmed'
              ? t('booking.requestCancellation')
              : t('booking.cancelBooking')}
          </Button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <PaymentPanel
            booking={booking}
            payment={meta?.payment}
            offsetMs={offsetMs}
            retryHref={retryHref}
            onChange={(updated) => setState((s) => ({ ...s, booking: updated }))}
          />

          {booking.bookingStatus === 'cancellation_requested' && booking.cancellationQuote && (
            <Alert tone="info">
              <p className="font-semibold">{t('booking.cancellationRequested')}</p>
              <p className="mt-1">
                {t('booking.quoteText', {
                  pct: booking.cancellationQuote.chargePct,
                  refund: formatPrice(booking.cancellationQuote.suggestedRefund),
                })}
              </p>
            </Alert>
          )}
          {booking.bookingStatus === 'payment_received_no_seats' && (
            <Alert tone="danger">{t('booking.noSeatsText')}</Alert>
          )}

          <Section title={t('booking.travellers')}>
            <table className="w-full text-left text-sm">
              <thead className="text-text-muted">
                <tr>
                  <th scope="col" className="py-2 font-medium">
                    {t('booking.travellerName')}
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    {t('booking.age')}
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    {t('booking.gender')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {booking.travellers.map((tr, i) => (
                  <tr key={`${tr.name}-${i}`} className="border-t border-border">
                    <td className="py-2 text-text">{tr.name}</td>
                    <td className="py-2 text-text-muted">{tr.age}</td>
                    <td className="py-2 text-text-muted">{t(`booking.${tr.gender}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title={t('booking.history')}>
            <ol className="space-y-3 border-l-2 border-border pl-4">
              {booking.timeline.map((entry, i) => (
                <li key={`${entry.event}-${i}`} className="text-sm">
                  <p className="font-medium text-text">
                    {t(`booking.event.${entry.event}`) === `booking.event.${entry.event}`
                      ? entry.event.replaceAll('_', ' ')
                      : t(`booking.event.${entry.event}`)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {dateTime(entry.at)}
                    {entry.meta?.reason ? ` · ${entry.meta.reason}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title={t('booking.trip')}>
            {booking.tour.primaryImage && (
              <div className="relative mb-3 aspect-[3/2] overflow-hidden rounded-md bg-surface-muted">
                <Image
                  src={booking.tour.primaryImage.url}
                  alt={booking.tour.primaryImage.alt || booking.tour.title}
                  fill
                  sizes="340px"
                  className="object-cover"
                />
              </div>
            )}
            <ul className="space-y-1 text-sm text-text-muted">
              <li className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-4" />
                {formatDateRange(booking.departure.startDate, booking.departure.endDate)}
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-4" />
                {booking.departure.pickupCity ?? t('tours.allPickups')}
              </li>
            </ul>
            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">
                  {t('booking.seatsTimesPrice', {
                    seats: booking.seats,
                    price: formatPrice(booking.unitPrice),
                  })}
                </dt>
                <dd className="font-semibold text-text">{formatPrice(booking.amount)}</dd>
              </div>
            </dl>
            <Link
              href={`/tours/${booking.tour.slug}`}
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              {t('booking.viewTour')}
            </Link>
          </Section>
          <Section title={t('booking.contact')}>
            <p className="text-sm text-text">{booking.contact.name}</p>
            <p className="text-sm text-text-muted">{booking.contact.email}</p>
            <p className="text-sm text-text-muted">{booking.contact.phone}</p>
          </Section>
          <p className="text-xs text-text-muted">
            {t('booking.policySummary')}{' '}
            <Link href="/refund-policy" className="font-medium text-accent underline">
              {t('booking.policyLink')}
            </Link>
          </p>
        </aside>
      </div>

      <CancelDialog
        booking={booking}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onDone={(updated, updatedMeta) => {
          setCancelOpen(false);
          setState((s) => ({ ...s, booking: updated, meta: updatedMeta ?? s.meta }));
          toast.success(
            updated.bookingStatus === 'cancelled'
              ? t('booking.cancelledToast')
              : t('booking.requestSentToast'),
          );
        }}
      />
    </div>
  );
}
