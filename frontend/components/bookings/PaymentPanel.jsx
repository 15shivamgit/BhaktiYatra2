'use client';

import { CheckCircle2, Clock, Loader2, Phone, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button, { buttonClasses } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/messages';
import { bookingsApi, useCountdown } from '@/lib/bookings';
import { BUSINESS } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { CHECKOUT_THEME, loadRazorpay } from '@/lib/razorpay';

const VERIFY_TIMEOUT_MS = 20_000;
const POLL_EVERY_MS = 5_000;
/** The UI never waits on a spinner longer than this (FR-PAY-06). */
const MAX_WAIT_MS = 60_000;
const CONFIRMED = new Set(['confirmed', 'already_confirmed', 'confirmed_late']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Provider messages often lack a final full stop; add one before the next sentence. */
const sentence = (text) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/**
 * Payment step for an unpaid booking (docs/05-features/05-payments.md "UI states"):
 * awaiting_payment → checkout_open → verifying → confirmed, or failed / cancelled_by_user /
 * expired / pending_confirmation / payment_received_no_seats. Razorpay Checkout when the API
 * uses Razorpay; "simulate" buttons with the dev stub.
 * @param {{ booking: any, payment: any, offsetMs: number, retryHref: string,
 *   onRetry?: () => void, onChange: (booking: any) => void }} props
 */
export default function PaymentPanel({ booking, payment, offsetMs, retryHref, onRetry, onChange }) {
  const pending = booking.bookingStatus === 'pending';
  const { expired, label } = useCountdown(pending ? booking.holdExpiresAt : null, offsetMs);
  const [phase, setPhase] = useState('awaiting_payment');
  const [message, setMessage] = useState(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const settle = (state, updated) => {
    if (!alive.current) return;
    if (updated) onChange(updated);
    if (CONFIRMED.has(state)) setPhase('confirmed');
    else if (state === 'payment_received_no_seats') setPhase('payment_received_no_seats');
    else setPhase(state);
  };

  /** Poll the booking until it is confirmed, or stop at the deadline with a calm message. */
  const pollUntil = async (deadline) => {
    while (alive.current && Date.now() < deadline) {
      await sleep(Math.min(POLL_EVERY_MS, Math.max(0, deadline - Date.now())));
      try {
        const body = await bookingsApi.get(booking.bookingReference);
        const status = body.data.bookingStatus;
        if (status === 'confirmed' || status === 'payment_received_no_seats') {
          settle(status, body.data);
          return;
        }
      } catch {
        // Keep polling until the deadline.
      }
    }
    if (alive.current) setPhase('pending_confirmation');
  };

  const verify = async (response) => {
    const deadline = Date.now() + MAX_WAIT_MS;
    setPhase('verifying');
    setMessage(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
    try {
      const body = await apiFetch('/payments/verify', {
        method: 'POST',
        body: response,
        signal: controller.signal,
      });
      const { state, booking: updated } = body.data;
      if (state === 'pending_confirmation') {
        await pollUntil(deadline);
      } else if (state === 'failed') {
        setMessage(t('booking.paymentFailed'));
        settle('failed', updated);
      } else {
        settle(state, updated);
      }
    } catch (error) {
      if (error?.code === 'SIGNATURE_INVALID' || error?.code === 'AMOUNT_MISMATCH') {
        setMessage(errorMessage(error));
        setPhase('failed');
      } else {
        // Network error or timeout: the webhook may still confirm it.
        await pollUntil(deadline);
      }
    } finally {
      clearTimeout(timer);
    }
  };

  const openCheckout = async () => {
    setMessage(null);
    setPhase('checkout_open');
    try {
      const Razorpay = await loadRazorpay();
      const checkout = new Razorpay({
        key: payment.keyId,
        order_id: payment.orderId,
        amount: payment.amountPaise,
        currency: payment.currency ?? 'INR',
        name: payment.checkout?.name ?? 'BhaktiYatra',
        description: payment.checkout?.description,
        prefill: payment.checkout?.prefill,
        notes: { bookingReference: booking.bookingReference },
        theme: { color: CHECKOUT_THEME },
        retry: { enabled: false },
        modal: { ondismiss: () => alive.current && setPhase('cancelled_by_user') },
        handler: (response) => verify(response),
      });
      checkout.on('payment.failed', (response) => {
        if (!alive.current) return;
        setMessage(response?.error?.description ?? t('booking.paymentFailed'));
        setPhase('failed');
      });
      checkout.open();
    } catch (error) {
      setMessage(error.message);
      setPhase('failed');
    }
  };

  const simulate = async (outcome) => {
    setPhase('verifying');
    setMessage(null);
    try {
      const body = await bookingsApi.simulate(booking.bookingReference, outcome);
      if (outcome === 'failure') {
        onChange(body.data.booking);
        setMessage(t('booking.paymentFailed'));
        setPhase('failed');
      } else {
        settle(body.data.state, body.data.booking);
      }
    } catch (error) {
      setMessage(errorMessage(error));
      setPhase('failed');
    }
  };

  /* ---------- final states ---------- */

  if (booking.bookingStatus === 'confirmed' || phase === 'confirmed') {
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
        <Link
          href="/account/bookings"
          className="mt-3 inline-block text-sm font-semibold underline"
        >
          {t('booking.myBookings')}
        </Link>
      </section>
    );
  }

  if (
    booking.bookingStatus === 'payment_received_no_seats' ||
    phase === 'payment_received_no_seats'
  ) {
    return (
      <Alert tone="danger">
        <p className="font-semibold">{t('booking.status.payment_received_no_seats')}</p>
        <p className="mt-1">{t('booking.noSeatsText')}</p>
        <a href={BUSINESS.phoneHref} className="mt-2 inline-block font-semibold underline">
          {BUSINESS.phoneDisplay}
        </a>
      </Alert>
    );
  }

  if (phase === 'pending_confirmation') {
    return (
      <section
        role="status"
        className="rounded-lg border border-info/30 bg-info-soft p-5 text-info"
      >
        <h2 className="text-lg font-semibold">{t('booking.pendingConfirmationTitle')}</h2>
        <p className="mt-1 text-sm">{t('booking.pendingConfirmationText')}</p>
        <Link
          href="/account/bookings"
          className="mt-3 inline-block text-sm font-semibold underline"
        >
          {t('booking.myBookings')}
        </Link>
      </section>
    );
  }

  if (phase === 'verifying') {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-5 shadow-card"
      >
        <Loader2 aria-hidden="true" className="size-5 animate-spin text-primary" />
        <p className="font-medium text-text">{t('booking.verifying')}</p>
      </section>
    );
  }

  if (!pending) return null;

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

  /* ---------- awaiting payment, failed, cancelled ---------- */

  const retrying = phase === 'failed' || phase === 'cancelled_by_user';
  const payLabel = retrying
    ? t('booking.retryPayment')
    : t('booking.payAmount', { amount: formatPrice(booking.amount) });

  return (
    <section
      aria-labelledby="pay-title"
      className="rounded-lg border border-border bg-surface p-5 shadow-card"
    >
      <h2 id="pay-title" className="text-lg font-semibold text-text">
        {t('booking.completePayment')}
      </h2>
      <p className="mt-1 flex items-center gap-2 text-sm text-warning">
        <Clock aria-hidden="true" className="size-4" />
        <span>
          {t('booking.payWithin')}{' '}
          <strong className="font-mono text-base" data-testid="hold-countdown">
            {label}
          </strong>
        </span>
      </p>
      <p className="mt-3 text-2xl font-semibold text-text">{formatPrice(booking.amount)}</p>

      {phase === 'cancelled_by_user' && (
        <Alert tone="info" className="mt-3">
          {t('booking.checkoutDismissed')}
        </Alert>
      )}
      {phase === 'failed' && (
        <Alert tone="danger" className="mt-3">
          {sentence(message ?? t('booking.paymentFailed'))}{' '}
          {t('booking.stillHeld', { time: label })}
        </Alert>
      )}
      {phase === 'awaiting_payment' && booking.paymentStatus === 'failed' && (
        <Alert tone="warning" className="mt-3">
          {t('booking.paymentFailed')}
        </Alert>
      )}

      {payment?.provider === 'razorpay' && payment.orderId ? (
        <div className="mt-4 space-y-2">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={openCheckout}
            loading={phase === 'checkout_open'}
            loadingText={t('booking.openingCheckout')}
          >
            {payLabel}
          </Button>
          <p className="text-xs text-text-muted">{t('booking.securePayment')}</p>
        </div>
      ) : payment?.simulate ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-text-muted">{t('booking.simulateNote')}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => simulate('success')}>{t('booking.simulateSuccess')}</Button>
            <Button variant="secondary" onClick={() => simulate('failure')}>
              {t('booking.simulateFailure')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
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
