'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import Form from 'next/form';
import Link from 'next/link';
import { useRef } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { t } from '@/lib/i18n';

const selectClasses = `${inputClasses(false)} pr-8`;

/**
 * Filter form for /temples. A plain GET form (works without JavaScript); with JavaScript,
 * changing a select submits immediately and next/form navigates client-side. The URL always
 * holds the filters, so results are shareable and indexable (FR-TEMPLE-03, FR-TEMPLE-11).
 * @param {{ facets: { states: any[], deities: any[], circuits: any[] },
 *   current: { q?: string, state?: string, deity?: string, circuit?: string, featured?: string, view?: string } }} props
 */
export default function TempleFilters({ facets, current }) {
  const form = useRef(null);
  const submit = () => form.current?.requestSubmit();
  const active = ['q', 'state', 'deity', 'circuit', 'featured'].some((key) => current[key]);

  return (
    <Form
      ref={form}
      action="/temples"
      aria-label={t('temples.filters')}
      className="rounded-lg border border-border bg-surface p-4 shadow-card"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-text">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {t('temples.filters')}
      </h2>
      {current.view === 'map' && <input type="hidden" name="view" value="map" />}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="filter-q" className="block text-sm font-medium text-text">
            {t('temples.search')}
          </label>
          <div className="relative mt-1.5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            />
            <input
              id="filter-q"
              name="q"
              type="search"
              defaultValue={current.q ?? ''}
              placeholder={t('temples.searchPlaceholder')}
              className={`${inputClasses(false)} pl-9`}
            />
          </div>
        </div>

        <Select
          id="filter-state"
          name="state"
          label={t('temples.state')}
          value={current.state}
          onChange={submit}
          options={facets.states.map((s) => ({ value: s.value, label: `${s.value} (${s.count})` }))}
        />
        <Select
          id="filter-deity"
          name="deity"
          label={t('temples.deity')}
          value={current.deity}
          onChange={submit}
          options={facets.deities.map((d) => ({
            value: d.value,
            label: `${d.value} (${d.count})`,
          }))}
        />
        <Select
          id="filter-circuit"
          name="circuit"
          label={t('temples.circuit')}
          value={current.circuit}
          onChange={submit}
          options={facets.circuits.map((c) => ({ value: c.slug, label: `${c.name} (${c.count})` }))}
        />

        <label className="flex items-center gap-3 text-sm text-text">
          <input
            type="checkbox"
            name="featured"
            value="true"
            defaultChecked={current.featured === 'true'}
            onChange={submit}
            className="size-5 accent-primary"
          />
          {t('temples.featuredOnly')}
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" className={buttonClasses({ size: 'sm', className: 'flex-1' })}>
          {t('temples.apply')}
        </button>
        {active && (
          <Link
            href={current.view === 'map' ? '/temples?view=map' : '/temples'}
            className={buttonClasses({ variant: 'ghost', size: 'sm' })}
          >
            <X aria-hidden="true" className="size-4" />
            {t('temples.clear')}
          </Link>
        )}
      </div>
    </Form>
  );
}

function Select({ id, name, label, value, options, onChange }) {
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
        className={`mt-1.5 ${selectClasses}`}
      >
        <option value="">{t('temples.any')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
