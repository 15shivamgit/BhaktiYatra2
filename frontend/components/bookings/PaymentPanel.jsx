'use client';

import { CheckCircle2, Clock, Phone, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button, { buttonClasses } from '@/components/ui/Button';
import { errorMessage } from '@/lib/api/messages';
import { bookingsApi, useCountdown } from '@/lib/bookings';
import { BUSINESS } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

/**
 * Payment step for a pending booking: hold countdown and the pay controls. With the stub
 * provider (development and tests only) the API allows simulating the result; Razorpay
 * Checkout replaces those buttons in Phase 6.
 * @param {{ booking: any, payment: { provider: string, simulate: boolean }, offsetMs: number,
 *   retryHref: string, onRetry?: () => void, onChange: (booking: any) => void }} props
 *   onRetry: used on the booking page itself, where a link to the same URL would not reset it
 */
export default function PaymentPanel({ booking, payment, offsetMs, retryHref, onRetry, onChange }) {
  const { expired, label } = useCountdown(
    booking.bookingStatus === 'pending' ? booking.holdExpiresAt : null,
    offsetMs,
  );
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  if (booking.bookingStatus === 'confirmed') {
    return (
      <section
        aria-labelledby="paid-title"
        className="rounded-lg border border-success/30 bg-success-soft p-5 text-success"
      >
        <h2 id="paid-title" className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 aria-hidden="true" className="size-5" />
          {t('booking.confirmedTitle')}
        </h2>
        <p className="mt-1 text-sm">
          {t('booking.confirmedText', { reference: booking.bookingReference })}
        </p>
      </section>
    );
  }

  if (booking.bookingStatus !== 'pending') return null;

  if (expired) {
    return (
      <section
        aria-labelledby="expired-title"
        className="rounded-lg border border-border bg-surface p-5 shadow-card"
      >
        <h2 id="expired-title" className="flex items-center gap-2 text-lg font-semibold text-text">
          <XCircle aria-hidden="true" className="size-5 text-danger" />
          {t('booking.holdExpired')}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{t('booking.holdExpiredText')}</p>
        {onRetry ? (
          <Button className="mt-4" onClick={onRetry}>
            {t('booking.tryAgain')}
          </Button>
        ) : (
          <Link href={retryHref} className={buttonClasses({ className: 'mt-4' })}>
            {t('booking.tryAgain')}
          </Link>
        )}
      </section>
    );
  }

  const simulate = async (outcome) => {
    setBusy(outcome);
    setError(null);
    try {
      const body = await bookingsApi.simulate(booking.bookingReference, outcome);
      onChange(body.data.booking);
      if (outcome === 'failure') setError(t('booking.paymentFailed'));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby="pay-title"
      className="rounded-lg border border-border bg-surface p-5 shadow-card"
    >
      <h2 id="pay-title" className="text-lg font-semibold text-text">
        {t('booking.completePayment')}
      </h2>
      <p className="mt-1 flex items-center gap-2 text-sm text-warning" aria-live="off">
        <Clock aria-hidden="true" className="size-4" />
        <span>
          {t('booking.payWithin')}{' '}
          <strong className="font-mono text-base" data-testid="hold-countdown">
            {label}
          </strong>
        </span>
      </p>
      <p className="mt-3 text-2xl font-semibold text-text">{formatPrice(booking.amount)}</p>
      {booking.paymentStatus === 'failed' && !error && (
        <Alert tone="warning" className="mt-3">
          {t('booking.paymentFailed')}
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {payment?.simulate ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-text-muted">{t('booking.simulateNote')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => simulate('success')}
              loading={busy === 'success'}
              disabled={Boolean(busy)}
            >
              {t('booking.simulateSuccess')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => simulate('failure')}
              loading={busy === 'failure'}
              disabled={Boolean(busy)}
            >
              {t('booking.simulateFailure')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <Button disabled className="w-full">
            {t('booking.payNow')}
          </Button>
          <p className="text-sm text-text-muted">{t('booking.paymentSoon')}</p>
          <a
            href={BUSINESS.phoneHref}
            className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
          >
            <Phone aria-hidden="true" className="size-4" />
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      )}
    </section>
  );
}
