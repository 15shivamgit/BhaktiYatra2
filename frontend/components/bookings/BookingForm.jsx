'use client';

import { CalendarDays, MapPin, Minus, Plus, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import PaymentPanel from '@/components/bookings/PaymentPanel';
import Alert from '@/components/ui/Alert';
import Button, { buttonClasses } from '@/components/ui/Button';
import FormField, { inputClasses } from '@/components/ui/FormField';
import { errorMessage } from '@/lib/api/messages';
import { useUser } from '@/lib/auth/user-context';
import { bookingsApi, clockOffset } from '@/lib/bookings';
import { formatDateRange, formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';

const MAX_SEATS = 10;
const emptyTraveller = () => ({ name: '', age: '', gender: '' });

function newKey() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function Summary({ departure, seats }) {
  const total = departure.price * seats;
  return (
    <aside
      aria-labelledby="summary-title"
      className="rounded-lg border border-border bg-surface p-5 shadow-card lg:sticky lg:top-24"
    >
      <h2 id="summary-title" className="font-display text-2xl font-semibold text-accent">
        {t('booking.summary')}
      </h2>
      {departure.tour.primaryImage && (
        <div className="relative mt-4 aspect-[3/2] overflow-hidden rounded-md bg-surface-muted">
          <Image
            src={departure.tour.primaryImage.url}
            alt={departure.tour.primaryImage.alt || departure.tour.title}
            fill
            sizes="360px"
            className="object-cover"
          />
        </div>
      )}
      <p className="mt-4 font-semibold text-text">{departure.tour.title}</p>
      <ul className="mt-2 space-y-1 text-sm text-text-muted">
        <li className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-4" />
          {formatDateRange(departure.startDate, departure.endDate)}
        </li>
        <li className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-4" />
          {departure.pickupCity ?? t('tours.allPickups')}
        </li>
      </ul>
      {departure.pickupInstructions && (
        <p className="mt-2 text-xs text-text-muted">{departure.pickupInstructions}</p>
      )}
      <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-muted">
            {t('booking.seatsTimesPrice', { seats, price: formatPrice(departure.price) })}
          </dt>
          <dd className="text-text">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>{t('booking.total')}</dt>
          <dd data-testid="booking-total">{formatPrice(total)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-text-muted">{t('booking.holdNote')}</p>
    </aside>
  );
}

/**
 * Booking page body (docs/06-design/02-page-specs.md "Booking"). Availability is read live from
 * GET /departures/:id; the API re-checks everything when the booking is created.
 * @param {{ slug: string, departureId: string }} props
 */
export default function BookingForm({ slug, departureId }) {
  const { user } = useUser();
  const [departure, setDeparture] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [created, setCreated] = useState(null); // { booking, payment, offsetMs }
  const attempt = useRef({ key: null, payload: null });

  const loadDeparture = useCallback(async () => {
    try {
      const body = await bookingsApi.departure(departureId);
      setDeparture(body.data);
      setLoadError(null);
      return body.data;
    } catch (error) {
      setLoadError(error);
      return null;
    }
  }, [departureId]);

  useEffect(() => {
    // Fetch on mount; the state updates happen after the request resolves.
    loadDeparture();
  }, [loadDeparture]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      seats: 1,
      contact: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
      travellers: [{ name: user?.name ?? '', age: '', gender: '' }],
      acceptedTerms: false,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'travellers' });
  const seats = Number(watch('seats')) || 1;
  const maxSeats = Math.max(1, Math.min(MAX_SEATS, departure?.seatsAvailable ?? 1));

  const changeSeats = (next) => {
    const value = Math.min(maxSeats, Math.max(1, next));
    setValue('seats', value);
    if (value > fields.length) {
      for (let i = fields.length; i < value; i += 1)
        append(emptyTraveller(), { shouldFocus: false });
    } else if (value < fields.length) {
      remove(Array.from({ length: fields.length - value }, (_, i) => value + i));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const payload = {
      departureId,
      seats: values.seats,
      contact: {
        name: values.contact.name.trim(),
        email: values.contact.email.trim(),
        phone: values.contact.phone.trim(),
      },
      travellers: values.travellers.map((tr) => ({
        name: tr.name.trim(),
        age: Number(tr.age),
        gender: tr.gender,
      })),
      acceptedTerms: values.acceptedTerms,
    };
    // Same payload → same key, so a retry after a network error cannot hold seats twice.
    const serialized = JSON.stringify(payload);
    if (attempt.current.payload !== serialized)
      attempt.current = { key: newKey(), payload: serialized };

    try {
      const body = await bookingsApi.create(payload, attempt.current.key);
      setCreated({
        booking: body.data.booking,
        payment: body.data.payment,
        offsetMs: clockOffset(body.meta?.serverTime),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error.code === 'SEATS_UNAVAILABLE') {
        const fresh = await loadDeparture();
        setFormError(
          fresh?.seatsAvailable
            ? t('booking.onlyLeft', { count: fresh.seatsAvailable })
            : t('errors.SEATS_UNAVAILABLE'),
        );
        if (fresh?.seatsAvailable && values.seats > fresh.seatsAvailable)
          changeSeats(fresh.seatsAvailable);
        return;
      }
      if (error.code === 'VALIDATION_ERROR') {
        let applied = false;
        for (const { path, message } of error.details ?? []) {
          const field = path.replace(/^body\./, '');
          if (/^(contact|travellers|seats|acceptedTerms)/.test(field)) {
            setError(field, { type: 'server', message }, { shouldFocus: !applied });
            applied = true;
          }
        }
        if (applied) return;
      }
      setFormError(error);
    }
  });

  if (loadError) {
    return (
      <Alert tone="danger">
        {loadError.status === 404 ? t('booking.departureMissing') : errorMessage(loadError)}{' '}
        <Link href={`/tours/${slug}`} className="font-medium underline">
          {t('booking.backToTour')}
        </Link>
      </Alert>
    );
  }
  if (!departure) {
    return (
      <p role="status" className="text-text-muted">
        {t('booking.loading')}
      </p>
    );
  }
  if (departure.tour.slug !== slug) {
    return (
      <Alert tone="danger">
        {t('booking.departureMissing')}{' '}
        <Link href={`/tours/${slug}`} className="font-medium underline">
          {t('booking.backToTour')}
        </Link>
      </Alert>
    );
  }

  const retryHref = `/tours/${slug}/book?departure=${departureId}`;

  if (created) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            {t('booking.reference')}:{' '}
            <strong className="font-mono text-text">{created.booking.bookingReference}</strong>
          </p>
          <PaymentPanel
            booking={created.booking}
            payment={created.payment}
            offsetMs={created.offsetMs}
            retryHref={retryHref}
            onRetry={() => {
              attempt.current = { key: null, payload: null };
              setCreated(null);
              loadDeparture();
            }}
            onChange={(booking) => setCreated((c) => ({ ...c, booking }))}
          />
          <Link
            href={`/account/bookings/${created.booking.bookingReference}`}
            className="inline-block text-sm font-medium text-accent hover:underline"
          >
            {t('booking.viewBooking')}
          </Link>
        </div>
        <Summary departure={departure} seats={created.booking.seats} />
      </div>
    );
  }

  if (!departure.isBookable) {
    return (
      <Alert tone="warning">
        {departure.seatsAvailable === 0 || departure.status === 'full'
          ? t('errors.SEATS_UNAVAILABLE')
          : t('errors.DEPARTURE_CLOSED')}{' '}
        <Link href={`/tours/${slug}`} className="font-medium underline">
          {t('booking.chooseAnother')}
        </Link>
      </Alert>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        {formError && (
          <Alert tone="danger">
            {typeof formError === 'string' ? formError : errorMessage(formError)}
            {formError?.code === 'TOO_MANY_PENDING' && (
              <>
                {' '}
                <Link href="/account/bookings" className="font-medium underline">
                  {t('booking.myBookings')}
                </Link>
              </>
            )}
          </Alert>
        )}

        <fieldset className="rounded-lg border border-border bg-surface p-5 sm:p-6">
          <legend className="px-1 font-display text-xl font-semibold text-accent">
            {t('booking.contact')}
          </legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <FormField
              id="contact-name"
              label={t('booking.contactName')}
              error={errors.contact?.name?.message}
              inputProps={{
                autoComplete: 'name',
                ...register('contact.name', { required: t('booking.required') }),
              }}
              className="sm:col-span-2"
            />
            <FormField
              id="contact-email"
              label={t('booking.contactEmail')}
              error={errors.contact?.email?.message}
              inputProps={{
                type: 'email',
                autoComplete: 'email',
                ...register('contact.email', { required: t('booking.required') }),
              }}
            />
            <FormField
              id="contact-phone"
              label={t('booking.contactPhone')}
              hint={t('booking.phoneHint')}
              error={errors.contact?.phone?.message}
              inputProps={{
                type: 'tel',
                autoComplete: 'tel',
                inputMode: 'tel',
                ...register('contact.phone', { required: t('booking.required') }),
              }}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-border bg-surface p-5 sm:p-6">
          <legend className="px-1 font-display text-xl font-semibold text-accent">
            {t('booking.travellers')}
          </legend>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span id="seats-label" className="text-sm font-medium text-text">
              <Users aria-hidden="true" className="mr-1 inline size-4" />
              {t('booking.seats')}
            </span>
            <div
              className="inline-flex items-center rounded-md border border-border"
              role="group"
              aria-labelledby="seats-label"
            >
              <button
                type="button"
                onClick={() => changeSeats(seats - 1)}
                disabled={seats <= 1}
                aria-label={t('booking.fewerSeats')}
                className="flex size-11 items-center justify-center text-text disabled:opacity-40"
              >
                <Minus aria-hidden="true" className="size-4" />
              </button>
              <output
                aria-live="polite"
                className="w-10 text-center font-semibold"
                data-testid="seat-count"
              >
                {seats}
              </output>
              <button
                type="button"
                onClick={() => changeSeats(seats + 1)}
                disabled={seats >= maxSeats}
                aria-label={t('booking.moreSeats')}
                className="flex size-11 items-center justify-center text-text disabled:opacity-40"
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>
            <span className="text-xs text-text-muted">
              {t('booking.seatsAvailable', { count: departure.seatsAvailable })}
            </span>
          </div>
          {errors.travellers?.message && (
            <p className="mt-2 text-sm text-danger">{errors.travellers.message}</p>
          )}

          <ol className="mt-4 space-y-4">
            {fields.map((field, index) => {
              const err = errors.travellers?.[index] ?? {};
              const id = `traveller-${index}`;
              return (
                <li key={field.id}>
                  <fieldset className="rounded-md border border-border p-4">
                    <legend className="px-1 text-sm font-semibold text-text">
                      {t('booking.travellerN', { n: index + 1 })}
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem_9rem]">
                      <FormField
                        id={`${id}-name`}
                        label={t('booking.travellerName')}
                        error={err.name?.message}
                        inputProps={register(`travellers.${index}.name`, {
                          required: t('booking.required'),
                          minLength: { value: 2, message: t('booking.required') },
                        })}
                      />
                      <FormField
                        id={`${id}-age`}
                        label={t('booking.age')}
                        error={err.age?.message}
                        inputProps={{
                          type: 'number',
                          inputMode: 'numeric',
                          min: 1,
                          max: 120,
                          ...register(`travellers.${index}.age`, {
                            required: t('booking.required'),
                            validate: (v) =>
                              (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 120) ||
                              t('booking.ageRange'),
                          }),
                        }}
                      />
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`${id}-gender`}
                          className="block text-sm font-medium text-text"
                        >
                          {t('booking.gender')}
                        </label>
                        <select
                          id={`${id}-gender`}
                          aria-invalid={err.gender ? true : undefined}
                          aria-describedby={err.gender ? `${id}-gender-error` : undefined}
                          className={inputClasses(Boolean(err.gender))}
                          {...register(`travellers.${index}.gender`, {
                            required: t('booking.required'),
                          })}
                        >
                          <option value="">{t('booking.choose')}</option>
                          <option value="female">{t('booking.female')}</option>
                          <option value="male">{t('booking.male')}</option>
                          <option value="other">{t('booking.other')}</option>
                        </select>
                        {err.gender && (
                          <p id={`${id}-gender-error`} className="text-sm text-danger">
                            {err.gender.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ol>
        </fieldset>

        <div className="space-y-2">
          <label className="flex items-start gap-3 text-sm text-text">
            <input
              type="checkbox"
              className="mt-0.5 size-5 accent-primary"
              aria-invalid={errors.acceptedTerms ? true : undefined}
              aria-describedby={errors.acceptedTerms ? 'terms-error' : undefined}
              {...register('acceptedTerms', { required: t('booking.termsRequired') })}
            />
            <span>
              {t('booking.acceptTerms')}{' '}
              <Link
                href="/refund-policy"
                target="_blank"
                className="font-medium text-accent underline"
              >
                {t('booking.policyLink')}
              </Link>
            </span>
          </label>
          {errors.acceptedTerms && (
            <p id="terms-error" className="text-sm text-danger">
              {errors.acceptedTerms.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} loadingText={t('booking.holding')}>
          {t('booking.continue', { total: formatPrice(departure.price * seats) })}
        </Button>
      </form>

      <Summary departure={departure} seats={seats} />
      <Link
        href={`/tours/${slug}`}
        className={buttonClasses({ variant: 'ghost', className: 'lg:hidden' })}
      >
        {t('booking.backToTour')}
      </Link>
    </div>
  );
}
