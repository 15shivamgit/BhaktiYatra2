'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import Form from 'next/form';
import Link from 'next/link';
import { useRef } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { BUDGETS, TOUR_FILTER_KEYS } from '@/lib/tours';

const SORTS = [
  ['default', 'tours.sortDefault'],
  ['nextDeparture', 'tours.sortNext'],
  ['price', 'tours.sortPrice'],
  ['-price', 'tours.sortPriceDesc'],
  ['durationDays', 'tours.sortDuration'],
];

const selectClasses = `mt-1.5 ${inputClasses(false)} pr-8`;

/**
 * GET form for /tours (works without JavaScript; with it, changes submit at once). The URL holds
 * every filter, so results are shareable (docs/05-features/03-tours-catalog.md).
 * @param {{ facets: { destinations: string[], pickupCities: string[] },
 *   months: { value: string, label: string }[], current: Record<string, string> }} props
 */
export default function TourFilters({ facets, months, current }) {
  const form = useRef(null);
  const submit = () => form.current?.requestSubmit();
  const active = TOUR_FILTER_KEYS.some((key) => current[key]);

  return (
    <Form
      ref={form}
      action="/tours"
      aria-label={t('tours.filters')}
      className="rounded-lg border border-border bg-surface p-4 shadow-card"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-text">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {t('tours.filters')}
      </h2>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="tour-q" className="block text-sm font-medium text-text">
            {t('tours.search')}
          </label>
          <div className="relative mt-1.5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            />
            <input
              id="tour-q"
              name="q"
              type="search"
              defaultValue={current.q ?? ''}
              placeholder={t('tours.searchPlaceholder')}
              className={`${inputClasses(false)} pl-9`}
            />
          </div>
        </div>

        <Select
          id="tour-sort"
          name="sort"
          label={t('tours.sort')}
          value={current.sort ?? 'default'}
          onChange={submit}
          options={SORTS.map(([value, key]) => ({ value, label: t(key) }))}
          withAny={false}
        />
        <Select
          id="tour-destination"
          name="destination"
          label={t('tours.destination')}
          value={current.destination}
          onChange={submit}
          options={facets.destinations.map((d) => ({ value: d, label: d }))}
        />
        <Select
          id="tour-month"
          name="month"
          label={t('tours.month')}
          value={current.month}
          onChange={submit}
          options={months}
        />

        <fieldset>
          <legend className="text-sm font-medium text-text">{t('tours.duration')}</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[
              ['', t('tours.any')],
              ['1-3', t('tours.days1to3')],
              ['4-7', t('tours.days4to7')],
              ['8+', t('tours.days8plus')],
            ].map(([value, label]) => (
              <label
                key={value || 'any'}
                className="inline-flex min-h-10 cursor-pointer items-center rounded-full border border-border px-3 text-sm text-text has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-saffron"
              >
                <input
                  type="radio"
                  name="days"
                  value={value}
                  defaultChecked={(current.days ?? '') === value}
                  onChange={submit}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <Select
          id="tour-budget"
          name="maxPrice"
          label={t('tours.maxPrice')}
          value={current.maxPrice}
          onChange={submit}
          options={BUDGETS.map((b) => ({
            value: String(b),
            label: t('tours.under', { price: formatPrice(b) }),
          }))}
        />
        <Select
          id="tour-pickup"
          name="pickupCity"
          label={t('tours.pickupCity')}
          value={current.pickupCity}
          onChange={submit}
          options={facets.pickupCities.map((c) => ({ value: c, label: c }))}
        />

        <label className="flex items-center gap-3 text-sm text-text">
          <input
            type="checkbox"
            name="bookable"
            value="true"
            defaultChecked={current.bookable === 'true'}
            onChange={submit}
            className="size-5 accent-primary"
          />
          {t('tours.bookableOnly')}
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" className={buttonClasses({ size: 'sm', className: 'flex-1' })}>
          {t('tours.apply')}
        </button>
        {active && (
          <Link href="/tours" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            <X aria-hidden="true" className="size-4" />
            {t('tours.clear')}
          </Link>
        )}
      </div>
    </Form>
  );
}

function Select({ id, name, label, value, options, onChange, withAny = true }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ''}
        onChange={onChange}
        className={selectClasses}
      >
        {withAny && <option value="">{t('tours.any')}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
