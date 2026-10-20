'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import TemplePicker from '@/components/admin/circuits/TemplePicker';
import ImageManager from '@/components/admin/ImageManager';
import StatusBadge from '@/components/admin/StatusBadge';
import Tabs, { tabPanelProps } from '@/components/admin/Tabs';
import DeparturesManager from '@/components/admin/tours/DeparturesManager';
import {
  FaqFields,
  InclusionFields,
  ItineraryFields,
  TourBasicsFields,
  TourContentFields,
  TourSeoFields,
} from '@/components/admin/tours/TourFields';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { adminErrorMessage, applyApiErrors, errorCountsByTab } from '@/lib/admin/errors';
import {
  emptyTourValues,
  resizeItinerary,
  toFormValues,
  toPayload,
  TOUR_FIELD_TABS,
  tourFieldFor,
} from '@/lib/admin/tour-form';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiFetch } from '@/lib/api/client';
import { t } from '@/lib/i18n';

const TABS = [
  ['basics', 'adminContent.tabBasics'],
  ['content', 'adminContent.tabContent'],
  ['itinerary', 'tours.itinerary'],
  ['inclusions', 'adminTours.tabInclusions'],
  ['temples', 'adminContent.tabTemples'],
  ['media', 'adminContent.tabMedia'],
  ['faqs', 'tours.faqs'],
  ['seo', 'adminContent.tabSeo'],
  ['departures', 'adminTours.departures'],
];
const FORM_FIELDS = Object.keys(emptyTourValues());
/** Tabs whose content saves on its own (no "Save changes" bar). */
const SELF_SAVING = new Set(['media', 'departures']);

/** Form defaults; a tour without an itinerary starts with one blank row per day. */
function defaultsFor(tour) {
  const values = toFormValues(tour);
  if (!values.itinerary.length) values.itinerary = resizeItinerary([], tour.durationDays);
  return values;
}

function useLeaveGuard(active) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}

export default function TourEditor({ id }) {
  const loaded = useAdminData(`/admin/tours/${id}`);
  if (loaded.error) {
    return (
      <Alert tone="danger">
        {adminErrorMessage(loaded.error)}{' '}
        <button type="button" className="font-medium underline" onClick={loaded.reload}>
          {t('adminContent.retry')}
        </button>
      </Alert>
    );
  }
  if (!loaded.data) {
    return (
      <p role="status" className="text-sm text-text-muted">
        {t('adminContent.loading')}
      </p>
    );
  }
  return (
    <TourEditorForm
      key={loaded.data.id}
      initial={loaded.data}
      initialProblems={loaded.meta?.publishProblems ?? []}
    />
  );
}

function TourEditorForm({ initial, initialProblems }) {
  const router = useRouter();
  const [tour, setTour] = useState(initial);
  const [problems, setProblems] = useState(initialProblems);
  const [tab, setTab] = useState('basics');
  const [formError, setFormError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const form = useForm({ defaultValues: defaultsFor(initial), mode: 'onTouched' });
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  useLeaveGuard(isDirty);
  const counts = errorCountsByTab(errors, TOUR_FIELD_TABS);

  const adopt = (body) => {
    setTour(body.data);
    setProblems(body.meta?.publishProblems ?? []);
    reset(defaultsFor(body.data));
  };

  const refreshProblems = useCallback(async () => {
    try {
      const body = await apiFetch(`/admin/tours/${initial.id}`);
      setTour((current) => ({ ...current, images: body.data.images, status: body.data.status }));
      setProblems(body.meta?.publishProblems ?? []);
    } catch {
      // The next save shows the current state.
    }
  }, [initial.id]);

  const onSave = handleSubmit(
    async (values) => {
      setFormError(null);
      try {
        const body = await apiFetch(`/admin/tours/${tour.id}`, {
          method: 'PATCH',
          body: toPayload(values, { mode: 'update', originalSlug: tour.slug }),
        });
        adopt(body);
        toast.success(t('adminContent.saved'));
        for (const warning of body.meta?.warnings ?? []) toast.warning(warning);
      } catch (error) {
        if (error.code === 'SLUG_TAKEN') {
          setTab('basics');
          setError('slug', { type: 'server', message: error.message }, { shouldFocus: true });
          return;
        }
        const unmatched =
          error.code === 'VALIDATION_ERROR'
            ? applyApiErrors(setError, error.details, FORM_FIELDS, tourFieldFor)
            : null;
        if (unmatched && unmatched.length === 0) {
          const first = tourFieldFor(error.details[0].path).split('.')[0];
          setTab(TOUR_FIELD_TABS[first] ?? 'basics');
          return;
        }
        setFormError(
          unmatched?.length ? unmatched.map((d) => d.message).join(' ') : adminErrorMessage(error),
        );
      }
    },
    (invalid) => setTab(TOUR_FIELD_TABS[Object.keys(invalid)[0]] ?? 'basics'),
  );

  const runAction = async (action, confirmKey) => {
    if (confirmKey && !window.confirm(t(confirmKey))) return;
    setBusyAction(action);
    setFormError(null);
    try {
      if (action === 'delete') {
        await apiFetch(`/admin/tours/${tour.id}`, { method: 'DELETE' });
        toast.success(t('adminContent.deleted'));
        router.push('/admin/tours');
        return;
      }
      const body = await apiFetch(`/admin/tours/${tour.id}/${action}`, { method: 'POST' });
      setTour((current) => ({
        ...current,
        status: body.data.status,
        publishedAt: body.data.publishedAt,
      }));
      setProblems(body.meta?.publishProblems ?? []);
      toast.success(
        t(
          `adminContent.${{ publish: 'published', unpublish: 'unpublished', archive: 'archived' }[action]}`,
        ),
      );
    } catch (error) {
      if (error.code === 'PUBLISH_PREREQUISITES') setProblems(error.details ?? []);
      else setFormError(adminErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  };

  const tabs = TABS.map(([key, label]) => ({ key, label: t(label), errors: counts[key] ?? 0 }));
  const busy = Boolean(busyAction) || isSubmitting;

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        <Link
          href="/admin/tours"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('adminTours.title')}
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold break-words text-accent">
              {tour.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-muted">
              <StatusBadge value={tour.status} />
              <span>/tours/{tour.slug}</span>
              {tour.status === 'published' && (
                <a
                  href={`/tours/${tour.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {t('adminContent.view')}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tour.status !== 'published' && (
              <Button
                onClick={() => runAction('publish')}
                loading={busyAction === 'publish'}
                disabled={busy || isDirty}
              >
                {t('adminContent.publish')}
              </Button>
            )}
            {tour.status === 'published' && (
              <Button
                variant="secondary"
                onClick={() => runAction('unpublish', 'adminContent.confirmUnpublish')}
                loading={busyAction === 'unpublish'}
                disabled={busy}
              >
                {t('adminContent.unpublish')}
              </Button>
            )}
            {tour.status === 'archived' && (
              <Button
                variant="secondary"
                onClick={() => runAction('unpublish')}
                loading={busyAction === 'unpublish'}
                disabled={busy}
              >
                {t('adminContent.restore')}
              </Button>
            )}
            {tour.status !== 'archived' && (
              <Button
                variant="ghost"
                onClick={() => runAction('archive', 'adminContent.confirmArchive')}
                loading={busyAction === 'archive'}
                disabled={busy}
              >
                {t('adminContent.archive')}
              </Button>
            )}
            {tour.status === 'draft' && (
              <Button
                variant="ghost"
                className="text-danger"
                onClick={() => runAction('delete', 'adminContent.confirmDelete')}
                loading={busyAction === 'delete'}
                disabled={busy}
              >
                {t('adminContent.delete')}
              </Button>
            )}
          </div>
        </header>

        {tour.status !== 'published' && problems.length > 0 && (
          <Alert tone="warning">
            <p className="font-semibold">{t('adminContent.notReady')}</p>
            <p>{t('adminContent.notReadyText')}</p>
            <ul className="mt-1 list-disc pl-5">
              {problems.map((p) => (
                <li key={`${p.path}-${p.message}`}>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setTab(TOUR_FIELD_TABS[p.path] ?? 'basics')}
                  >
                    {p.message}
                  </button>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        {isDirty && tour.status !== 'published' && (
          <p className="text-sm text-warning">{t('adminContent.saveBeforePublish')}</p>
        )}
        {formError && <Alert tone="danger">{formError}</Alert>}

        <form onSubmit={onSave} noValidate className="space-y-6">
          <Tabs
            tabs={tabs}
            active={tab}
            onChange={setTab}
            label={t('adminTours.sections')}
            idPrefix="tour"
          />

          <div {...tabPanelProps('tour', 'basics', tab)} className="focus:outline-none">
            <TourBasicsFields published={Boolean(tour.publishedAt)} />
          </div>
          <div {...tabPanelProps('tour', 'content', tab)} className="focus:outline-none">
            <TourContentFields />
          </div>
          <div {...tabPanelProps('tour', 'itinerary', tab)} className="focus:outline-none">
            <ItineraryFields />
          </div>
          <div {...tabPanelProps('tour', 'inclusions', tab)} className="focus:outline-none">
            <InclusionFields />
          </div>
          <div {...tabPanelProps('tour', 'temples', tab)} className="focus:outline-none">
            <Controller
              control={control}
              name="temples"
              render={({ field }) => (
                <TemplePicker
                  value={field.value}
                  onChange={field.onChange}
                  title={t('tours.temples')}
                  error={errors.temples?.message}
                />
              )}
            />
          </div>
          <div {...tabPanelProps('tour', 'media', tab)} className="focus:outline-none">
            <p className="mb-4 text-sm text-text-muted">{t('adminContent.mediaNote')}</p>
            <ImageManager
              endpoint={`/admin/tours/${tour.id}/images`}
              images={tour.images}
              maxImages={12}
              onChange={(images) => {
                setTour((current) => ({ ...current, images }));
                refreshProblems();
              }}
            />
          </div>
          <div {...tabPanelProps('tour', 'faqs', tab)} className="focus:outline-none">
            <FaqFields />
          </div>
          <div {...tabPanelProps('tour', 'seo', tab)} className="focus:outline-none">
            <TourSeoFields />
          </div>

          {!SELF_SAVING.has(tab) && (
            <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0">
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText={t('adminContent.saving')}
                disabled={busy || !isDirty}
              >
                {t('adminContent.save')}
              </Button>
              {isDirty && (
                <Button variant="ghost" onClick={() => reset()} disabled={busy}>
                  {t('adminContent.discard')}
                </Button>
              )}
              {isDirty && (
                <span className="text-sm text-text-muted">{t('adminContent.unsaved')}</span>
              )}
            </div>
          )}
        </form>

        {/* Outside the main form: the departure dialogs contain forms of their own. */}
        <div {...tabPanelProps('tour', 'departures', tab)} className="focus:outline-none">
          {tab === 'departures' && <DeparturesManager tour={tour} />}
        </div>
      </div>
    </FormProvider>
  );
}
