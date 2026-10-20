'use client';

import { CalendarPlus, Repeat } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminListState } from '@/components/admin/AdminList';
import { describe, ErrorAlert, Field, useDialogSubmit } from '@/components/admin/dialog-form';
import Modal from '@/components/admin/Modal';
import StatusBadge from '@/components/admin/StatusBadge';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { adminErrorMessage } from '@/lib/admin/errors';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiFetch } from '@/lib/api/client';
import { formatDateRange, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

const ACTIVE = new Set(['scheduled', 'full']);

/** Today in India as "YYYY-MM-DD" (the earliest start date the API accepts). */
function todayIst() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

/* ---------- add / edit ---------- */

function DepartureForm({ tour, departure, onDone }) {
  const editing = Boolean(departure);
  const [values, setValues] = useState({
    startDate: departure?.startDate ?? '',
    endDate: departure?.endDate ?? '',
    pickupCity: departure?.pickupCity ?? '',
    price: departure ? String(departure.price) : '',
    totalSeats: '',
    bookingCutoffHours: String(departure?.bookingCutoffHours ?? 24),
    pickupInstructions: departure?.pickupInstructions ?? '',
    notes: departure?.notes ?? '',
  });
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const onSubmit = (event) => {
    event.preventDefault();
    const body = {
      startDate: values.startDate,
      pickupCity: values.pickupCity || null,
      bookingCutoffHours: Number(values.bookingCutoffHours),
      pickupInstructions: values.pickupInstructions.trim(),
      notes: values.notes.trim(),
      ...(values.endDate && { endDate: values.endDate }),
      ...(values.price && { price: Number(values.price) }),
      ...(!editing && { totalSeats: Number(values.totalSeats) }),
    };
    submit(() =>
      editing
        ? apiFetch(`/admin/departures/${departure.id}`, { method: 'PATCH', body })
        : apiFetch(`/admin/tours/${tour.id}/departures`, { method: 'POST', body }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorAlert error={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="dep-start" label={t('adminTours.startDate')} error={fields.startDate}>
          <input
            id="dep-start"
            type="date"
            required
            min={todayIst()}
            value={values.startDate}
            onChange={set('startDate')}
            aria-invalid={fields.startDate ? true : undefined}
            aria-describedby={describe('dep-start', fields.startDate)}
            className={inputClasses(Boolean(fields.startDate))}
          />
        </Field>
        <Field
          id="dep-end"
          label={t('adminTours.endDate')}
          hint={t('adminTours.endDateHint', { days: tour.durationDays })}
          error={fields.endDate}
        >
          <input
            id="dep-end"
            type="date"
            min={values.startDate || todayIst()}
            value={values.endDate}
            onChange={set('endDate')}
            aria-invalid={fields.endDate ? true : undefined}
            aria-describedby={describe('dep-end', fields.endDate, true)}
            className={inputClasses(Boolean(fields.endDate))}
          />
        </Field>
        <Field
          id="dep-price"
          label={t('adminTours.price')}
          hint={t('adminTours.priceHint', { price: formatPrice(tour.basePrice) })}
          error={fields.price}
        >
          <input
            id="dep-price"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.price}
            placeholder={String(tour.basePrice)}
            onChange={set('price')}
            aria-invalid={fields.price ? true : undefined}
            aria-describedby={describe('dep-price', fields.price, true)}
            className={inputClasses(Boolean(fields.price))}
          />
        </Field>
        {!editing && (
          <Field id="dep-seats" label={t('adminTours.totalSeats')} error={fields.totalSeats}>
            <input
              id="dep-seats"
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              required
              value={values.totalSeats}
              onChange={set('totalSeats')}
              aria-invalid={fields.totalSeats ? true : undefined}
              aria-describedby={describe('dep-seats', fields.totalSeats)}
              className={inputClasses(Boolean(fields.totalSeats))}
            />
          </Field>
        )}
        <Field id="dep-pickup" label={t('tours.pickup')} error={fields.pickupCity}>
          <select
            id="dep-pickup"
            value={values.pickupCity}
            onChange={set('pickupCity')}
            className={inputClasses(Boolean(fields.pickupCity))}
          >
            <option value="">{t('tours.allPickups')}</option>
            {tour.pickupCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="dep-cutoff"
          label={t('adminTours.cutoff')}
          hint={t('adminTours.cutoffHint')}
          error={fields.bookingCutoffHours}
        >
          <input
            id="dep-cutoff"
            type="number"
            inputMode="numeric"
            min={0}
            max={720}
            value={values.bookingCutoffHours}
            onChange={set('bookingCutoffHours')}
            aria-describedby={describe('dep-cutoff', fields.bookingCutoffHours, true)}
            className={inputClasses(Boolean(fields.bookingCutoffHours))}
          />
        </Field>
      </div>
      <Field
        id="dep-instructions"
        label={t('adminTours.pickupInstructions')}
        hint={t('adminTours.pickupInstructionsHint')}
        error={fields.pickupInstructions}
      >
        <textarea
          id="dep-instructions"
          rows={2}
          maxLength={500}
          value={values.pickupInstructions}
          onChange={set('pickupInstructions')}
          aria-describedby={describe('dep-instructions', fields.pickupInstructions, true)}
          className={inputClasses(false)}
        />
      </Field>
      <Field id="dep-notes" label={t('adminTours.internalNotes')} error={fields.notes}>
        <textarea
          id="dep-notes"
          rows={2}
          maxLength={2000}
          value={values.notes}
          onChange={set('notes')}
          className={inputClasses(false)}
        />
      </Field>
      <Button type="submit" loading={busy} loadingText={t('adminContent.saving')}>
        {editing ? t('adminContent.save') : t('adminTours.addDeparture')}
      </Button>
    </form>
  );
}

/* ---------- bulk add ---------- */

function BulkForm({ tour, onDone }) {
  const [values, setValues] = useState({
    firstDate: '',
    lastDate: '',
    every: 'week',
    totalSeats: '',
    price: '',
  });
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const onSubmit = (event) => {
    event.preventDefault();
    submit(() =>
      apiFetch(`/admin/tours/${tour.id}/departures/bulk`, {
        method: 'POST',
        body: {
          firstDate: values.firstDate,
          lastDate: values.lastDate,
          every: values.every,
          totalSeats: Number(values.totalSeats),
          ...(values.price && { price: Number(values.price) }),
        },
      }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-text-muted">{t('adminTours.bulkIntro')}</p>
      <ErrorAlert error={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="bulk-first" label={t('adminTours.firstDate')} error={fields.firstDate}>
          <input
            id="bulk-first"
            type="date"
            required
            min={todayIst()}
            value={values.firstDate}
            onChange={set('firstDate')}
            className={inputClasses(Boolean(fields.firstDate))}
          />
        </Field>
        <Field id="bulk-last" label={t('adminTours.lastDate')} error={fields.lastDate}>
          <input
            id="bulk-last"
            type="date"
            required
            min={values.firstDate || todayIst()}
            value={values.lastDate}
            onChange={set('lastDate')}
            aria-invalid={fields.lastDate ? true : undefined}
            aria-describedby={describe('bulk-last', fields.lastDate)}
            className={inputClasses(Boolean(fields.lastDate))}
          />
        </Field>
        <Field id="bulk-every" label={t('adminTours.repeat')}>
          <select
            id="bulk-every"
            value={values.every}
            onChange={set('every')}
            className={inputClasses(false)}
          >
            <option value="week">{t('adminTours.everyWeek')}</option>
            <option value="month">{t('adminTours.everyMonth')}</option>
          </select>
        </Field>
        <Field id="bulk-seats" label={t('adminTours.totalSeats')} error={fields.totalSeats}>
          <input
            id="bulk-seats"
            type="number"
            min={1}
            max={200}
            required
            value={values.totalSeats}
            onChange={set('totalSeats')}
            className={inputClasses(Boolean(fields.totalSeats))}
          />
        </Field>
        <Field
          id="bulk-price"
          label={t('adminTours.price')}
          hint={t('adminTours.priceHint', { price: formatPrice(tour.basePrice) })}
          error={fields.price}
        >
          <input
            id="bulk-price"
            type="number"
            min={1}
            placeholder={String(tour.basePrice)}
            value={values.price}
            onChange={set('price')}
            className={inputClasses(Boolean(fields.price))}
          />
        </Field>
      </div>
      <Button type="submit" loading={busy} loadingText={t('adminContent.saving')}>
        {t('adminTours.createDepartures')}
      </Button>
    </form>
  );
}

/* ---------- seats ---------- */

function InventoryForm({ departure, onDone }) {
  const committed = departure.bookedSeats + departure.heldSeats;
  const [totalSeats, setTotalSeats] = useState(String(departure.totalSeats));
  const [reason, setReason] = useState('');
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  const below = Number(totalSeats) < committed;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(() =>
          apiFetch(`/admin/departures/${departure.id}/inventory`, {
            method: 'PATCH',
            body: { totalSeats: Number(totalSeats), reason: reason.trim() },
          }),
        );
      }}
      className="space-y-4"
    >
      <dl className="grid grid-cols-3 gap-3 text-center text-sm">
        {[
          [t('adminTours.booked'), departure.bookedSeats],
          [t('adminTours.held'), departure.heldSeats],
          [t('adminTours.available'), departure.seatsAvailable],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md bg-surface-muted p-3">
            <dt className="text-text-muted">{label}</dt>
            <dd className="text-xl font-semibold text-text">{value}</dd>
          </div>
        ))}
      </dl>
      <ErrorAlert error={error} />
      <Field
        id="inv-total"
        label={t('adminTours.totalSeats')}
        hint={t('adminTours.minSeats', { count: committed })}
        error={
          fields.totalSeats ?? (below ? t('adminTours.belowCommitted', { count: committed }) : null)
        }
      >
        <input
          id="inv-total"
          type="number"
          min={Math.max(1, committed)}
          max={200}
          required
          value={totalSeats}
          onChange={(event) => setTotalSeats(event.target.value)}
          aria-invalid={below ? true : undefined}
          aria-describedby="inv-total-error inv-total-hint"
          className={inputClasses(below)}
        />
      </Field>
      <Field id="inv-reason" label={t('adminTours.reason')} error={fields.reason}>
        <input
          id="inv-reason"
          required
          minLength={3}
          maxLength={300}
          value={reason}
          placeholder={t('adminTours.reasonExample')}
          onChange={(event) => setReason(event.target.value)}
          className={inputClasses(Boolean(fields.reason))}
        />
      </Field>
      <Button type="submit" loading={busy} disabled={below} loadingText={t('adminContent.saving')}>
        {t('adminTours.updateSeats')}
      </Button>
    </form>
  );
}

/* ---------- cancel ---------- */

function CancelForm({ departure, onDone }) {
  const [reason, setReason] = useState('');
  const { busy, error, submit, fields } = useDialogSubmit(onDone);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(() =>
          apiFetch(`/admin/departures/${departure.id}/cancel`, {
            method: 'POST',
            body: { reason: reason.trim() },
          }),
        );
      }}
      className="space-y-4"
    >
      <Alert tone="warning">
        <p className="font-semibold">{t('adminTours.cancelWarning')}</p>
        <p>
          {t('adminTours.cancelImpact', {
            held: departure.heldSeats,
            booked: departure.bookedSeats,
          })}
        </p>
      </Alert>
      <ErrorAlert error={error} />
      <Field id="cancel-reason" label={t('adminTours.reason')} error={fields.reason}>
        <textarea
          id="cancel-reason"
          rows={3}
          required
          minLength={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={inputClasses(Boolean(fields.reason))}
        />
      </Field>
      <Button
        type="submit"
        variant="destructive"
        loading={busy}
        loadingText={t('adminContent.saving')}
      >
        {t('adminTours.cancelDeparture')}
      </Button>
    </form>
  );
}

/* ---------- manager ---------- */

/** Departures tab of the tour editor (docs/05-features/03-tours-catalog.md "Admin"). */
export default function DeparturesManager({ tour }) {
  const { data, loading, error, reload } = useAdminData(`/admin/tours/${tour.id}/departures`);
  const [dialog, setDialog] = useState(null); // { kind, departure? }
  const close = () => setDialog(null);
  const done = (message) => (body) => {
    close();
    toast.success(message(body));
    reload();
  };

  const remove = async (departure) => {
    if (!window.confirm(t('adminTours.confirmDeleteDeparture'))) return;
    try {
      await apiFetch(`/admin/departures/${departure.id}`, { method: 'DELETE' });
      toast.success(t('adminContent.deleted'));
      reload();
    } catch (err) {
      toast.error(adminErrorMessage(err));
    }
  };

  const titles = {
    add: t('adminTours.addDeparture'),
    bulk: t('adminTours.bulkAdd'),
    edit: t('adminTours.editDeparture'),
    seats: t('adminTours.adjustSeats'),
    cancel: t('adminTours.cancelDeparture'),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{t('adminTours.departuresIntro')}</p>
        <div className="flex flex-wrap gap-2">
          {tour.status !== 'archived' && (
            <>
              <Button size="sm" onClick={() => setDialog({ kind: 'add' })}>
                <CalendarPlus aria-hidden="true" className="size-4" />
                {t('adminTours.addDeparture')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'bulk' })}>
                <Repeat aria-hidden="true" className="size-4" />
                {t('adminTours.bulkAdd')}
              </Button>
            </>
          )}
        </div>
      </div>

      <AdminListState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">{t('adminTours.departures')}</caption>
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                {[
                  'tours.dates',
                  'tours.pickup',
                  'tours.price',
                  'adminTours.total',
                  'adminTours.held',
                  'adminTours.booked',
                  'adminTours.available',
                  'adminTours.revenue',
                  'adminContent.status',
                  'adminContent.actions',
                ].map((key) => (
                  <th key={key} scope="col" className="p-3 font-medium">
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.map((d) => {
                const active = ACTIVE.has(d.status);
                return (
                  <tr key={d.id} className="border-t border-border align-top">
                    <th scope="row" className="p-3 font-medium text-text">
                      {formatDateRange(d.startDate, d.endDate)}
                      {active && !d.isBookable && d.status === 'scheduled' && (
                        <span className="block text-xs font-normal text-warning">
                          {t('tours.statusClosed')}
                        </span>
                      )}
                    </th>
                    <td className="p-3 text-text-muted">{d.pickupCity ?? t('tours.allPickups')}</td>
                    <td className="p-3">{formatPrice(d.price)}</td>
                    <td className="p-3">{d.totalSeats}</td>
                    <td className="p-3">{d.heldSeats}</td>
                    <td className="p-3">{d.bookedSeats}</td>
                    <td className="p-3 font-semibold">{d.seatsAvailable}</td>
                    <td className="p-3">{formatPrice(d.revenue)}</td>
                    <td className="p-3">
                      <StatusBadge value={d.status} />
                    </td>
                    <td className="p-3">
                      {active ? (
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDialog({ kind: 'edit', departure: d })}
                            aria-label={`${t('adminContent.edit')}: ${d.startDate}`}
                          >
                            {t('adminContent.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDialog({ kind: 'seats', departure: d })}
                            aria-label={`${t('adminTours.seatsAction')}: ${d.startDate}`}
                          >
                            {t('adminTours.seatsAction')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger"
                            onClick={() => setDialog({ kind: 'cancel', departure: d })}
                            aria-label={`${t('adminTours.cancelAction')}: ${d.startDate}`}
                          >
                            {t('adminTours.cancelAction')}
                          </Button>
                          {d.bookedSeats + d.heldSeats === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-danger"
                              onClick={() => remove(d)}
                              aria-label={`${t('adminContent.delete')}: ${d.startDate}`}
                            >
                              {t('adminContent.delete')}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">
                          {d.cancellation?.reason ?? '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminListState>

      <Modal open={Boolean(dialog)} onClose={close} title={dialog ? titles[dialog.kind] : ''}>
        {dialog?.kind === 'add' && (
          <DepartureForm tour={tour} onDone={done(() => t('adminTours.departureAdded'))} />
        )}
        {dialog?.kind === 'edit' && (
          <DepartureForm
            tour={tour}
            departure={dialog.departure}
            onDone={done(() => t('adminContent.saved'))}
          />
        )}
        {dialog?.kind === 'bulk' && (
          <BulkForm
            tour={tour}
            onDone={done((body) => t('adminTours.departuresCreated', { count: body.data.length }))}
          />
        )}
        {dialog?.kind === 'seats' && (
          <InventoryForm
            departure={dialog.departure}
            onDone={done(() => t('adminTours.seatsUpdated'))}
          />
        )}
        {dialog?.kind === 'cancel' && (
          <CancelForm
            departure={dialog.departure}
            onDone={done((body) =>
              t('adminTours.departureCancelled', {
                pending: body.data.affected.pending,
                confirmed: body.data.affected.confirmed,
              }),
            )}
          />
        )}
      </Modal>
    </div>
  );
}
