'use client';

import dynamic from 'next/dynamic';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import {
  Checkbox,
  Fieldset,
  SelectInput,
  TextArea,
  TextInput,
  useFieldError,
} from '@/components/admin/fields';
import RichTextEditor from '@/components/admin/RichTextEditor';
import Button from '@/components/ui/Button';
import { monthName } from '@/lib/format';
import { t } from '@/lib/i18n';

const MapPicker = dynamic(() => import('@/components/admin/MapPicker'), {
  ssr: false,
  loading: () => (
    <div aria-hidden="true" className="h-[360px] animate-pulse rounded-lg bg-surface-muted" />
  ),
});

const MIN_DESCRIPTION_CHARS = 200;
const required = (label) => ({ required: `${label} is required` });
const plainLength = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;

function RichField({ name, label, hint }) {
  const { control } = useFormContext();
  const error = useFieldError(name);
  return (
    <div className="space-y-1.5">
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RichTextEditor
            id={`f-${name}`}
            label={label}
            value={field.value}
            onChange={field.onChange}
            error={error}
          />
        )}
      />
      {hint && <p className="text-sm text-text-muted">{hint}</p>}
    </div>
  );
}

/** Fields needed to create a draft; also the first tab of the edit form. */
export function BasicsFields({ options, showSlug = true, slugLocked = false }) {
  const religions = (options?.religions ?? ['hindu']).map((r) => ({
    value: r,
    label: r[0].toUpperCase() + r.slice(1),
  }));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          name="name"
          label={t('adminContent.name')}
          rules={required('Name')}
          maxLength={120}
        />
        <TextInput
          name="deity"
          label={t('adminContent.deity')}
          rules={required('Deity')}
          list="deity-suggestions"
          maxLength={60}
        />
        <datalist id="deity-suggestions">
          {(options?.deities ?? []).map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
        <SelectInput name="religion" label={t('adminContent.religion')} options={religions} />
        <SelectInput
          name="state"
          label={t('adminContent.state')}
          options={options?.states ?? []}
          placeholder="Choose a state"
          rules={required('State')}
        />
        <TextInput
          name="city"
          label={t('adminContent.city')}
          rules={required('City')}
          maxLength={80}
        />
      </div>
      {showSlug && (
        <TextInput
          name="slug"
          label={t('adminContent.slug')}
          hint={
            slugLocked
              ? `${t('adminContent.slugHint')} Changing it keeps the old address working.`
              : t('adminContent.slugHint')
          }
          maxLength={100}
          autoCapitalize="none"
          spellCheck={false}
        />
      )}
    </div>
  );
}

export function PlaceFields() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="district" label={t('adminContent.district')} maxLength={80} />
        <TextInput
          name="pincode"
          label={t('adminContent.pincode')}
          inputMode="numeric"
          maxLength={6}
          rules={{ pattern: { value: /^(\d{6})?$/, message: 'Pincode has 6 digits' } }}
        />
      </div>
      <TextInput name="address" label={t('adminContent.address')} maxLength={300} />
      <Checkbox name="featured" label={t('adminContent.featured')} />
    </div>
  );
}

export function ContentFields({ includeLongForm = true }) {
  const { watch } = useFormContext();
  const length = plainLength(watch('description'));
  return (
    <div className="space-y-6">
      <TextArea
        name="shortDescription"
        label={t('adminContent.shortDescription')}
        hint={t('adminContent.shortHint')}
        rows={3}
        maxLength={300}
        rules={{
          ...required('Short description'),
          minLength: { value: 10, message: 'Write at least a sentence' },
        }}
      />
      <RichField
        name="description"
        label={t('adminContent.description')}
        hint={t('adminContent.descriptionCount', { count: length, min: MIN_DESCRIPTION_CHARS })}
      />
      {includeLongForm && (
        <>
          <RichField name="history" label={t('adminContent.history')} />
          <RichField name="significance" label={t('adminContent.significance')} />
        </>
      )}
    </div>
  );
}

function RowList({ name, legend, emptyRow, columns }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <Fieldset legend={legend}>
      {fields.length === 0 && <p className="text-sm text-text-muted">{t('adminContent.none')}</p>}
      <ul className="space-y-4">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))_auto] sm:items-end"
          >
            {columns(index)}
            <Button
              variant="ghost"
              className="justify-self-start text-danger"
              onClick={() => remove(index)}
              aria-label={`${t('adminContent.remove')} ${legend} ${index + 1}`}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      {fields.length < 12 && (
        <Button variant="secondary" size="sm" onClick={() => append(emptyRow)}>
          <Plus aria-hidden="true" className="size-4" />
          {t('adminContent.addRow')}
        </Button>
      )}
    </Fieldset>
  );
}

export function TimingsFields() {
  const months = [
    { value: '', label: t('adminContent.monthVaries') },
    ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(i + 1) })),
  ];
  return (
    <div className="space-y-6">
      <RowList
        name="timings"
        legend={t('adminContent.timings')}
        emptyRow={{ label: '', open: '', close: '', note: '' }}
        columns={(i) => (
          <>
            <TextInput
              name={`timings.${i}.label`}
              label={t('adminContent.label')}
              placeholder="Morning darshan"
              maxLength={60}
              rules={required('Label')}
            />
            <TextInput name={`timings.${i}.open`} label={t('adminContent.open')} type="time" />
            <TextInput name={`timings.${i}.close`} label={t('adminContent.close')} type="time" />
            <TextInput name={`timings.${i}.note`} label={t('adminContent.note')} maxLength={200} />
          </>
        )}
      />
      <RowList
        name="aartiSchedule"
        legend={t('adminContent.aarti')}
        emptyRow={{ name: '', time: '', note: '' }}
        columns={(i) => (
          <>
            <TextInput
              name={`aartiSchedule.${i}.name`}
              label={t('adminContent.name')}
              placeholder="Mangala aarti"
              maxLength={80}
              rules={required('Name')}
            />
            <TextInput
              name={`aartiSchedule.${i}.time`}
              label={t('adminContent.time')}
              type="time"
            />
            <TextInput
              name={`aartiSchedule.${i}.note`}
              label={t('adminContent.note')}
              maxLength={200}
            />
          </>
        )}
      />
      <RowList
        name="festivals"
        legend={t('adminContent.festivals')}
        emptyRow={{ name: '', month: '', description: '' }}
        columns={(i) => (
          <>
            <TextInput
              name={`festivals.${i}.name`}
              label={t('adminContent.name')}
              maxLength={80}
              rules={required('Name')}
            />
            <SelectInput
              name={`festivals.${i}.month`}
              label={t('adminContent.month')}
              options={months}
            />
            <TextInput
              name={`festivals.${i}.description`}
              label={t('adminContent.description')}
              maxLength={500}
            />
          </>
        )}
      />
    </div>
  );
}

export function ReachFields() {
  return (
    <div className="space-y-6">
      <Fieldset legend={t('temple.reach')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            name="howToReach.nearestAirport"
            label={t('adminContent.airport')}
            maxLength={300}
          />
          <TextInput
            name="howToReach.nearestRailway"
            label={t('adminContent.railway')}
            maxLength={300}
          />
          <TextInput
            name="howToReach.nearestBusStand"
            label={t('adminContent.busStand')}
            maxLength={300}
          />
          <TextInput name="howToReach.byRoad" label={t('adminContent.byRoad')} maxLength={300} />
        </div>
      </Fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="bestTimeToVisit" label={t('adminContent.bestTime')} maxLength={300} />
        <TextInput name="entryFee" label={t('adminContent.entryFee')} maxLength={200} />
        <TextInput
          name="officialWebsite"
          label={t('adminContent.officialWebsite')}
          type="url"
          placeholder="https://"
        />
        <TextInput
          name="darshanBookingUrl"
          label={t('adminContent.darshanBookingUrl')}
          type="url"
          placeholder="https://"
        />
        <TextInput
          name="contactPhone"
          label={t('adminContent.contactPhone')}
          type="tel"
          maxLength={40}
        />
      </div>
      <TextArea name="rulesText" label={t('adminContent.rules')} rows={5} />
    </div>
  );
}

const coordinate = (max, label) => ({
  validate: (value, all) => {
    const other = label === 'Latitude' ? all.lng : all.lat;
    if (value === '' && other === '') return true;
    const n = Number(value);
    if (value === '' || !Number.isFinite(n))
      return `${label} is required with the other coordinate`;
    return Math.abs(n) <= max || `${label} must be between -${max} and ${max}`;
  },
});

export function LocationFields({ active }) {
  const { watch, setValue } = useFormContext();
  const lat = watch('lat');
  const lng = watch('lng');
  const value =
    lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? { lat: Number(lat), lng: Number(lng) }
      : null;
  const set = (next) => {
    const opts = { shouldDirty: true, shouldValidate: true };
    setValue('lat', next ? String(next.lat) : '', opts);
    setValue('lng', next ? String(next.lng) : '', opts);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">{t('adminContent.mapHint')}</p>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <TextInput
          name="lat"
          label={t('adminContent.lat')}
          inputMode="decimal"
          rules={coordinate(90, 'Latitude')}
        />
        <TextInput
          name="lng"
          label={t('adminContent.lng')}
          inputMode="decimal"
          rules={coordinate(180, 'Longitude')}
        />
        <Button variant="ghost" onClick={() => set(null)} disabled={!value}>
          {t('adminContent.clearLocation')}
        </Button>
      </div>
      {/* Leaflet cannot size itself inside a hidden panel, so mount it only when the tab is open. */}
      {active && <MapPicker value={value} onChange={set} label={t('adminContent.tabLocation')} />}
    </div>
  );
}

export function SeoFields() {
  const { watch } = useFormContext();
  return (
    <div className="space-y-4">
      <TextInput
        name="seo.title"
        label={t('adminContent.seoTitle')}
        hint={t('adminContent.seoTitleHint', { count: watch('seo.title')?.length ?? 0 })}
        maxLength={60}
      />
      <TextArea
        name="seo.description"
        label={t('adminContent.seoDescription')}
        hint={t('adminContent.seoDescriptionHint', {
          count: watch('seo.description')?.length ?? 0,
        })}
        rows={3}
        maxLength={160}
      />
      <TextInput name="tagsText" label={t('adminContent.tags')} />
      <TextArea name="notes" label={t('adminContent.notes')} rows={6} maxLength={4000} />
    </div>
  );
}
