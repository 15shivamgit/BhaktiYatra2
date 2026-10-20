'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import ImageManager from '@/components/admin/ImageManager';
import StatusBadge from '@/components/admin/StatusBadge';
import Tabs, { tabPanelProps } from '@/components/admin/Tabs';
import {
  BasicsFields,
  ContentFields,
  LocationFields,
  PlaceFields,
  ReachFields,
  SeoFields,
  TimingsFields,
} from '@/components/admin/temples/TempleFields';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { applyApiErrors, adminErrorMessage, errorCountsByTab } from '@/lib/admin/errors';
import { emptyTempleValues, FIELD_TABS, toFormValues, toPayload } from '@/lib/admin/temple-form';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiFetch } from '@/lib/api/client';
import { t } from '@/lib/i18n';

const TABS = ['basics', 'content', 'timings', 'reach', 'location', 'media', 'seo'];
const TAB_LABELS = {
  basics: 'tabBasics',
  content: 'tabContent',
  timings: 'tabTimings',
  reach: 'tabReach',
  location: 'tabLocation',
  media: 'tabMedia',
  seo: 'tabSeo',
};
const FORM_FIELDS = Object.keys(emptyTempleValues());

/** Warn before leaving the page with unsaved edits. */
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

/** Loads a temple and its form options, then renders the editor. */
export default function TempleEditor({ id }) {
  const temple = useAdminData(`/admin/temples/${id}`);
  const options = useAdminData('/admin/temples/options');

  if (temple.error || options.error) {
    return (
      <Alert tone="danger">
        {adminErrorMessage(temple.error ?? options.error)}{' '}
        <button
          type="button"
          className="font-medium underline"
          onClick={() => (temple.error ? temple.reload() : options.reload())}
        >
          {t('adminContent.retry')}
        </button>
      </Alert>
    );
  }
  if (!temple.data || !options.data) {
    return (
      <p role="status" className="text-sm text-text-muted">
        {t('adminContent.loading')}
      </p>
    );
  }
  return (
    <TempleEditorForm
      key={temple.data.id}
      initial={temple.data}
      initialProblems={temple.meta?.publishProblems ?? []}
      options={options.data}
    />
  );
}

function TempleEditorForm({ initial, initialProblems, options }) {
  const router = useRouter();
  const [temple, setTemple] = useState(initial);
  const [problems, setProblems] = useState(initialProblems);
  const [tab, setTab] = useState('basics');
  const [formError, setFormError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const form = useForm({ defaultValues: toFormValues(initial), mode: 'onTouched' });
  const {
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  useLeaveGuard(isDirty);

  const counts = errorCountsByTab(errors, FIELD_TABS);

  const adopt = useCallback(
    (data, meta) => {
      setTemple(data);
      if (meta?.publishProblems) setProblems(meta.publishProblems);
      reset(toFormValues(data));
    },
    [reset],
  );

  const refreshProblems = useCallback(async () => {
    try {
      const body = await apiFetch(`/admin/temples/${initial.id}`);
      setTemple((current) => ({ ...current, status: body.data.status, images: body.data.images }));
      setProblems(body.meta?.publishProblems ?? []);
    } catch {
      // The next save or reload shows the current state; nothing to do here.
    }
  }, [initial.id]);

  const onSave = handleSubmit(
    async (values) => {
      setFormError(null);
      try {
        const body = await apiFetch(`/admin/temples/${temple.id}`, {
          method: 'PATCH',
          body: toPayload(values, { mode: 'update', originalSlug: temple.slug }),
        });
        adopt(body.data, body.meta);
        toast.success(t('adminContent.saved'));
      } catch (error) {
        if (error.code === 'SLUG_TAKEN') {
          setError('slug', { type: 'server', message: error.message }, { shouldFocus: true });
          setTab('basics');
          return;
        }
        const unmatched =
          error.code === 'VALIDATION_ERROR'
            ? applyApiErrors(setError, error.details, FORM_FIELDS)
            : null;
        if (unmatched && unmatched.length === 0) {
          const first = error.details[0];
          setTab(FIELD_TABS[first.path.replace(/^body\./, '').split('.')[0]] ?? 'basics');
          return;
        }
        setFormError(
          unmatched?.length ? unmatched.map((d) => d.message).join(' ') : adminErrorMessage(error),
        );
      }
    },
    (invalid) => {
      const firstField = Object.keys(invalid)[0];
      setTab(FIELD_TABS[firstField] ?? 'basics');
    },
  );

  const runAction = async (action, confirmKey) => {
    if (confirmKey && !window.confirm(t(confirmKey))) return;
    setBusyAction(action);
    setFormError(null);
    try {
      if (action === 'delete') {
        await apiFetch(`/admin/temples/${temple.id}`, { method: 'DELETE' });
        toast.success(t('adminContent.deleted'));
        router.push('/admin/temples');
        return;
      }
      const body = await apiFetch(`/admin/temples/${temple.id}/${action}`, { method: 'POST' });
      setTemple((current) => ({
        ...current,
        status: body.data.status,
        publishedAt: body.data.publishedAt,
      }));
      toast.success(
        t(
          `adminContent.${{ publish: 'published', unpublish: 'unpublished', archive: 'archived' }[action]}`,
        ),
      );
      await refreshProblems();
    } catch (error) {
      if (error.code === 'PUBLISH_PREREQUISITES') setProblems(error.details ?? []);
      else setFormError(adminErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  };

  const tabs = TABS.map((key) => ({
    key,
    label: t(`adminContent.${TAB_LABELS[key]}`),
    errors: counts[key] ?? 0,
  }));
  const busy = Boolean(busyAction) || isSubmitting;

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        <Link
          href="/admin/temples"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('adminContent.templesTitle')}
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold break-words text-accent">
              {temple.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-muted">
              <StatusBadge value={temple.status} />
              <span>/temples/{temple.slug}</span>
              {temple.status === 'published' && (
                <a
                  href={`/temples/${temple.slug}`}
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
            {temple.status !== 'published' && (
              <Button
                onClick={() => runAction('publish')}
                loading={busyAction === 'publish'}
                disabled={busy || isDirty}
              >
                {t('adminContent.publish')}
              </Button>
            )}
            {temple.status === 'published' && (
              <Button
                variant="secondary"
                onClick={() => runAction('unpublish', 'adminContent.confirmUnpublish')}
                loading={busyAction === 'unpublish'}
                disabled={busy}
              >
                {t('adminContent.unpublish')}
              </Button>
            )}
            {temple.status === 'archived' && (
              <Button
                variant="secondary"
                onClick={() => runAction('unpublish')}
                loading={busyAction === 'unpublish'}
                disabled={busy}
              >
                {t('adminContent.restore')}
              </Button>
            )}
            {temple.status !== 'archived' && (
              <Button
                variant="ghost"
                onClick={() => runAction('archive', 'adminContent.confirmArchive')}
                loading={busyAction === 'archive'}
                disabled={busy}
              >
                {t('adminContent.archive')}
              </Button>
            )}
            {temple.status === 'draft' && (
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

        {temple.status !== 'published' && problems.length > 0 && (
          <Alert tone="warning">
            <p className="font-semibold">{t('adminContent.notReady')}</p>
            <p>{t('adminContent.notReadyText')}</p>
            <ul className="mt-1 list-disc pl-5">
              {problems.map((p) => (
                <li key={`${p.path}-${p.message}`}>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setTab(FIELD_TABS[p.path] ?? 'basics')}
                  >
                    {p.message}
                  </button>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        {isDirty && temple.status !== 'published' && (
          <p className="text-sm text-warning">{t('adminContent.saveBeforePublish')}</p>
        )}
        {formError && <Alert tone="danger">{formError}</Alert>}

        <form onSubmit={onSave} noValidate className="space-y-6">
          <Tabs
            tabs={tabs}
            active={tab}
            onChange={setTab}
            label={t('adminContent.sections')}
            idPrefix="temple"
          />

          <div {...tabPanelProps('temple', 'basics', tab)} className="space-y-6 focus:outline-none">
            <BasicsFields options={options} slugLocked={Boolean(temple.publishedAt)} />
            <PlaceFields />
          </div>
          <div {...tabPanelProps('temple', 'content', tab)} className="focus:outline-none">
            <ContentFields />
          </div>
          <div {...tabPanelProps('temple', 'timings', tab)} className="focus:outline-none">
            <TimingsFields />
          </div>
          <div {...tabPanelProps('temple', 'reach', tab)} className="focus:outline-none">
            <ReachFields />
          </div>
          <div {...tabPanelProps('temple', 'location', tab)} className="focus:outline-none">
            <LocationFields active={tab === 'location'} />
          </div>
          <div {...tabPanelProps('temple', 'media', tab)} className="focus:outline-none">
            <p className="mb-4 text-sm text-text-muted">{t('adminContent.mediaNote')}</p>
            <ImageManager
              endpoint={`/admin/temples/${temple.id}/images`}
              images={temple.images}
              maxImages={options.maxImages}
              onChange={(images) => {
                setTemple((current) => ({ ...current, images }));
                refreshProblems();
              }}
            />
          </div>
          <div {...tabPanelProps('temple', 'seo', tab)} className="focus:outline-none">
            <SeoFields />
          </div>

          {tab !== 'media' && (
            <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-b-lg">
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
      </div>
    </FormProvider>
  );
}
