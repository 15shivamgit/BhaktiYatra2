'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Checkbox, Fieldset, TextArea, TextInput, useFieldError } from '@/components/admin/fields';
import RichTextEditor from '@/components/admin/RichTextEditor';
import Button from '@/components/ui/Button';
import { resizeItinerary } from '@/lib/admin/tour-form';
import { t } from '@/lib/i18n';

const MEALS = ['breakfast', 'lunch', 'dinner'];
const required = (label) => ({ required: `${label} is required` });
const wholeNumber = (label, min, max) => ({
  required: `${label} is required`,
  validate: (value) => {
    const n = Number(value);
    if (!Number.isInteger(n)) return `${label} must be a whole number`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
    return true;
  },
});

function RichField({ name, label, hint }) {
  const { control } = useFormContext();
  const error = useFieldError(name);
  const id = `f-${name.replaceAll('.', '-')}`;
  return (
    <div className="space-y-1.5">
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RichTextEditor
            id={id}
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

/** Fields needed to create a draft; also the first tab of the editor. */
export function TourBasicsFields({ showSlug = true, published = false }) {
  return (
    <div className="space-y-4">
      <TextInput
        name="title"
        label={t('adminTours.titleField')}
        rules={{
          ...required('Title'),
          minLength: { value: 4, message: 'Use at least 4 characters' },
        }}
        maxLength={120}
      />
      {showSlug && (
        <TextInput
          name="slug"
          label={t('adminContent.slug')}
          hint={
            published
              ? `${t('adminContent.slugHint')} ${t('adminTours.slugRedirect')}`
              : t('adminContent.slugHint')
          }
          maxLength={100}
          autoCapitalize="none"
          spellCheck={false}
        />
      )}
      <TextArea
        name="summary"
        label={t('adminTours.summary')}
        hint={t('adminTours.summaryHint')}
        rows={3}
        maxLength={300}
        rules={{
          ...required('Summary'),
          minLength: { value: 10, message: 'Write at least a sentence' },
        }}
      />
      <TextInput
        name="destinationsText"
        label={t('adminTours.destinations')}
        hint={t('adminTours.commaHint')}
        rules={required('Destinations')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          name="durationDays"
          label={t('adminTours.durationDays')}
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          rules={wholeNumber('Days', 1, 30)}
        />
        <TextInput
          name="durationNights"
          label={t('adminTours.durationNights')}
          type="number"
          inputMode="numeric"
          min={0}
          max={30}
          rules={{
            validate: (value, all) =>
              value === '' ||
              (Number.isInteger(Number(value)) &&
                Number(value) >= 0 &&
                Number(value) <= Number(all.durationDays)) ||
              'Nights must be between 0 and the number of days',
          }}
        />
        <TextInput
          name="basePrice"
          label={t('adminTours.basePriceField')}
          hint={t('adminTours.basePriceHint')}
          type="number"
          inputMode="numeric"
          min={1}
          rules={wholeNumber('Base price', 1, 10_000_000)}
        />
      </div>
      <TextInput
        name="pickupCitiesText"
        label={t('adminTours.pickupCities')}
        hint={t('adminTours.commaHint')}
        rules={required('Pickup cities')}
      />
    </div>
  );
}

export function TourContentFields({ includeHighlights = true }) {
  return (
    <div className="space-y-6">
      <RichField name="description" label={t('adminContent.description')} />
      {includeHighlights && (
        <TextArea
          name="highlightsText"
          label={t('adminTours.highlights')}
          hint={t('adminTours.linesHint', { max: 8 })}
          rows={5}
        />
      )}
    </div>
  );
}

/** One row per day; "Match the duration" adds blank days or drops extra ones. */
export function ItineraryFields() {
  const { control, watch, setValue, getValues, register } = useFormContext();
  const { fields, remove } = useFieldArray({ control, name: 'itinerary' });
  const days = Number(watch('durationDays')) || 0;
  const mismatch = fields.length !== days;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className={mismatch ? 'text-sm text-warning' : 'text-sm text-text-muted'}>
          {t('adminTours.itineraryCount', { count: fields.length, days })}
        </p>
        {mismatch && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setValue('itinerary', resizeItinerary(getValues('itinerary'), days), {
                shouldDirty: true,
              })
            }
          >
            {t('adminTours.matchDuration', { days })}
          </Button>
        )}
      </div>
      <ol className="space-y-4">
        {fields.map((field, index) => (
          <li key={field.id}>
            <Fieldset legend={t('tours.day', { n: index + 1 })}>
              <TextInput
                name={`itinerary.${index}.title`}
                label={t('adminTours.dayTitle')}
                placeholder="Haridwar to Barkot"
                maxLength={120}
              />
              <RichField
                name={`itinerary.${index}.description`}
                label={t('adminContent.description')}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <fieldset>
                  <legend className="text-sm font-medium text-text">{t('tours.meals')}</legend>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {MEALS.map((meal) => (
                      <label key={meal} className="flex min-h-11 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          value={meal}
                          className="size-5 accent-primary"
                          {...register(`itinerary.${index}.meals`)}
                        />
                        {t(`tours.${meal}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <TextInput
                  name={`itinerary.${index}.stay`}
                  label={t('tours.stay')}
                  placeholder="Barkot"
                  maxLength={120}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => remove(index)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                {t('adminTours.removeDay', { n: index + 1 })}
              </Button>
            </Fieldset>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function InclusionFields() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TextArea
        name="inclusionsText"
        label={t('tours.inclusions')}
        hint={t('adminTours.linesHint', { max: 30 })}
        rows={8}
      />
      <TextArea
        name="exclusionsText"
        label={t('tours.exclusions')}
        hint={t('adminTours.linesHint', { max: 30 })}
        rows={8}
      />
    </div>
  );
}

export function FaqFields() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'faqs' });
  return (
    <div className="space-y-4">
      {fields.length === 0 && <p className="text-sm text-text-muted">{t('adminContent.none')}</p>}
      {fields.map((field, index) => (
        <Fieldset key={field.id} legend={t('adminTours.faqN', { n: index + 1 })}>
          <TextInput
            name={`faqs.${index}.question`}
            label={t('adminTours.question')}
            maxLength={200}
          />
          <TextArea
            name={`faqs.${index}.answer`}
            label={t('adminTours.answer')}
            rows={3}
            maxLength={1000}
          />
          <Button variant="ghost" size="sm" className="text-danger" onClick={() => remove(index)}>
            <Trash2 aria-hidden="true" className="size-4" />
            {t('adminContent.remove')}
          </Button>
        </Fieldset>
      ))}
      {fields.length < 20 && (
        <Button variant="secondary" size="sm" onClick={() => append({ question: '', answer: '' })}>
          <Plus aria-hidden="true" className="size-4" />
          {t('adminTours.addFaq')}
        </Button>
      )}
    </div>
  );
}

export function TourSeoFields() {
  const { watch } = useFormContext();
  return (
    <div className="space-y-4">
      <Checkbox name="featured" label={t('adminTours.featured')} />
      <TextInput
        name="seo.title"
        label={t('adminContent.seoTitle')}
        hint={t('adminTours.seoTitleHint', { count: watch('seo.title')?.length ?? 0 })}
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
      <TextArea name="notes" label={t('adminContent.notes')} rows={6} maxLength={4000} />
    </div>
  );
}
