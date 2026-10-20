'use client';

import { useState } from 'react';
import { describe, ErrorAlert, Field, useDialogSubmit } from '@/components/admin/dialog-form';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { apiFetch } from '@/lib/api/client';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

const MANUAL_METHODS = ['upi', 'bank_transfer', 'cash', 'card', 'other'];
const REFUND_METHODS = ['razorpay', 'bank'];

/** Required reason (the API answers REASON_REQUIRED without one; this catches it first). */
function ReasonField({ id, value, onChange, error, hint }) {
  return (
    <Field id={id} label={t('adminOps.reason')} hint={hint} error={error}>
      <textarea
        id={id}
        rows={3}
        required
        minLength={3}
        maxLength={500}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(id, error, hint)}
        className={inputClasses(Boolean(error))}
      />
    </Field>
  );
}

const statusRequest = (booking, body) =>
  apiFetch(`/admin/bookings/${booking.id}/status`, { method: 'PATCH', body });

/** pending → confirmed with a payment received outside Razorpay (bank, UPI, cash). */
export function MarkPaidForm({ booking, onDone }) {
  const [values, setValues] = useState({
    reference: '',
    method: 'bank_transfer',
    amount: String(booking.amount),
    reason: '',
  });
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(() =>
          statusRequest(booking, {
            to: 'confirmed',
            reason: values.reason.trim(),
            manualPayment: {
              reference: values.reference.trim(),
              method: values.method,
              amount: Number(values.amount),
            },
          }),
        );
      }}
    >
      <p className="text-sm text-text-muted">{t('adminOps.markPaidIntro')}</p>
      <ErrorAlert error={error} />
      <Field
        id="paid-reference"
        label={t('adminOps.paymentReference')}
        hint={t('adminOps.paymentReferenceHint')}
        error={fields['manualPayment.reference'] ?? fields.manualPayment}
      >
        <input
          id="paid-reference"
          required
          minLength={3}
          maxLength={100}
          value={values.reference}
          onChange={set('reference')}
          aria-describedby="paid-reference-hint"
          className={inputClasses(Boolean(fields.manualPayment))}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="paid-method" label={t('adminOps.method')}>
          <select
            id="paid-method"
            value={values.method}
            onChange={set('method')}
            className={inputClasses(false)}
          >
            {MANUAL_METHODS.map((m) => (
              <option key={m} value={m}>
                {t(`adminOps.manualMethod.${m}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="paid-amount"
          label={t('adminOps.amountReceived')}
          hint={t('adminOps.mustEqual', { amount: formatPrice(booking.amount) })}
          error={fields['manualPayment.amount']}
        >
          <input
            id="paid-amount"
            type="number"
            required
            min={booking.amount}
            max={booking.amount}
            value={values.amount}
            onChange={set('amount')}
            aria-describedby={describe('paid-amount', fields['manualPayment.amount'], true)}
            className={inputClasses(Boolean(fields['manualPayment.amount']))}
          />
        </Field>
      </div>
      <ReasonField
        id="paid-reason"
        value={values.reason}
        onChange={(reason) => setValues((v) => ({ ...v, reason }))}
        error={fields.reason}
      />
      <Button type="submit" loading={busy} loadingText={t('adminContent.saving')}>
        {t('adminOps.confirmPayment')}
      </Button>
    </form>
  );
}

/** Cancel with a refund record (or no refund). Suggests the policy amount. */
export function CancelForm({ booking, onDone }) {
  const paid = booking.paymentStatus === 'paid';
  const quote = booking.cancellationQuote;
  const [values, setValues] = useState({
    amount: paid ? String(quote?.suggestedRefund ?? booking.amount) : '0',
    method: 'razorpay',
    reference: '',
    reason: '',
  });
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));
  const amount = Number(values.amount) || 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(() =>
          apiFetch(`/admin/bookings/${booking.id}/cancel`, {
            method: 'POST',
            body: {
              reason: values.reason.trim(),
              refund:
                amount > 0
                  ? {
                      amount,
                      method: values.method,
                      ...(values.reference.trim() && { reference: values.reference.trim() }),
                    }
                  : { amount: 0, method: 'none' },
            },
          }),
        );
      }}
    >
      <Alert tone="warning">
        {booking.bookingStatus === 'pending'
          ? t('adminOps.cancelPendingWarning', { seats: booking.seats })
          : t('adminOps.cancelWarning', { seats: booking.seats })}
      </Alert>
      {paid && quote && (
        <dl className="grid grid-cols-3 gap-3 text-center text-sm">
          {[
            [t('adminOps.paid'), formatPrice(booking.amount)],
            [
              t('adminOps.charge'),
              quote.departureCancelled
                ? t('adminOps.departureCancelledShort')
                : `${quote.chargePct}%`,
            ],
            [t('adminOps.suggestedRefund'), formatPrice(quote.suggestedRefund)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-surface-muted p-3">
              <dt className="text-text-muted">{label}</dt>
              <dd className="font-semibold text-text">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {paid && quote?.daysBefore !== null && quote?.daysBefore !== undefined && (
        <p className="text-sm text-text-muted">
          {t('adminOps.quoteBasis', { days: quote.daysBefore })}
        </p>
      )}
      <ErrorAlert error={error} />
      {paid && (
        <>
          <Field
            id="refund-amount"
            label={t('adminOps.refundAmount')}
            hint={t('adminOps.refundAmountHint', { amount: formatPrice(booking.amount) })}
            error={fields['refund.amount']}
          >
            <input
              id="refund-amount"
              type="number"
              required
              min={0}
              max={booking.amount}
              value={values.amount}
              onChange={set('amount')}
              aria-describedby={describe('refund-amount', fields['refund.amount'], true)}
              className={inputClasses(Boolean(fields['refund.amount']))}
            />
          </Field>
          {amount > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="refund-method"
                label={t('adminOps.refundMethod')}
                error={fields['refund.method']}
              >
                <select
                  id="refund-method"
                  value={values.method}
                  onChange={set('method')}
                  className={inputClasses(Boolean(fields['refund.method']))}
                >
                  {REFUND_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(`adminOps.refundMethodName.${m}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="refund-reference"
                label={t('adminOps.refundReference')}
                hint={t('adminOps.refundReferenceHint')}
                error={fields['refund.reference']}
              >
                <input
                  id="refund-reference"
                  maxLength={100}
                  value={values.reference}
                  onChange={set('reference')}
                  aria-describedby="refund-reference-hint"
                  className={inputClasses(Boolean(fields['refund.reference']))}
                />
              </Field>
            </div>
          )}
        </>
      )}
      <ReasonField
        id="cancel-reason"
        value={values.reason}
        onChange={(reason) => setValues((v) => ({ ...v, reason }))}
        error={fields.reason}
      />
      <Button
        type="submit"
        variant="destructive"
        loading={busy}
        loadingText={t('adminContent.saving')}
      >
        {amount > 0
          ? t('adminOps.cancelAndRefund', { amount: formatPrice(amount) })
          : t('adminOps.cancelBooking')}
      </Button>
    </form>
  );
}

/** cancellation_requested → confirmed. */
export function RejectCancellationForm({ booking, onDone }) {
  const [reason, setReason] = useState('');
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(() => statusRequest(booking, { to: 'confirmed', reason: reason.trim() }));
      }}
    >
      <p className="text-sm text-text-muted">{t('adminOps.rejectIntro')}</p>
      {booking.cancellation?.reason && (
        <p className="rounded-md bg-surface-muted p-3 text-sm text-text">
          {t('adminOps.travellerReason')}: “{booking.cancellation.reason}”
        </p>
      )}
      <ErrorAlert error={error} />
      <ReasonField id="reject-reason" value={reason} onChange={setReason} error={fields.reason} />
      <Button type="submit" loading={busy} loadingText={t('adminContent.saving')}>
        {t('adminOps.keepBooking')}
      </Button>
    </form>
  );
}

/** payment_received_no_seats → confirmed once the departure has room. */
export function ConfirmSeatsForm({ booking, onDone }) {
  const [reason, setReason] = useState('');
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  const live = booking.departureLive;
  const enough = live && live.seatsAvailable >= booking.seats;
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(() => statusRequest(booking, { to: 'confirmed', reason: reason.trim() }));
      }}
    >
      <Alert tone={enough ? 'info' : 'warning'}>
        {t('adminOps.seatsNow', {
          available: live?.seatsAvailable ?? 0,
          needed: booking.seats,
        })}{' '}
        {!enough && t('adminOps.raiseSeatsFirst')}
      </Alert>
      <ErrorAlert error={error} />
      <ReasonField id="seats-reason" value={reason} onChange={setReason} error={fields.reason} />
      <Button type="submit" loading={busy} loadingText={t('adminContent.saving')}>
        {t('adminOps.confirmBooking')}
      </Button>
    </form>
  );
}
