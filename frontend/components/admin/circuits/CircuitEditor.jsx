'use client';

import { ArrowLeft, ExternalLink, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import TemplePicker from '@/components/admin/circuits/TemplePicker';
import { AdminPageHeader } from '@/components/admin/AdminList';
import { Checkbox, TextArea, TextInput } from '@/components/admin/fields';
import RichTextEditor from '@/components/admin/RichTextEditor';
import StatusBadge from '@/components/admin/StatusBadge';
import Tabs, { tabPanelProps } from '@/components/admin/Tabs';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { adminErrorMessage, applyApiErrors, errorCountsByTab } from '@/lib/admin/errors';
import { useAdminData } from '@/lib/admin/use-admin-data';
import { apiFetch, apiUpload } from '@/lib/api/client';
import { t } from '@/lib/i18n';

const EMPTY = {
  name: '',
  slug: '',
  region: '',
  shortDescription: '',
  description: '',
  featured: false,
  temples: [],
  seo: { title: '', description: '' },
  notes: '',
};
const FIELDS = Object.keys(EMPTY);
const FIELD_TABS = {
  name: 'basics',
  slug: 'basics',
  region: 'basics',
  shortDescription: 'basics',
  description: 'basics',
  featured: 'basics',
  temples: 'temples',
  image: 'media',
  seo: 'seo',
  notes: 'seo',
};

const toValues = (c) => ({
  name: c.name ?? '',
  slug: c.slug ?? '',
  region: c.region ?? '',
  shortDescription: c.shortDescription ?? '',
  description: c.description ?? '',
  featured: Boolean(c.featured),
  temples: c.temples ?? [],
  seo: { title: c.seo?.title ?? '', description: c.seo?.description ?? '' },
  notes: c.notes ?? '',
});

function toPayload(values, { mode, originalSlug }) {
  const payload = {
    name: values.name.trim(),
    shortDescription: values.shortDescription.trim(),
    description: values.description,
    region: values.region.trim(),
    featured: Boolean(values.featured),
    temples: values.temples.map((temple) => temple.id),
    seo: { title: values.seo.title.trim(), description: values.seo.description.trim() },
    notes: values.notes,
  };
  const slug = values.slug.trim();
  if (slug && (mode === 'create' || slug !== originalSlug)) payload.slug = slug;
  return payload;
}

/** Loads a circuit (or starts a new one) and renders the editor. */
export default function CircuitEditor({ id }) {
  const loaded = useAdminData(id ? `/admin/circuits/${id}` : null);
  if (!id) return <CircuitForm initial={null} initialProblems={[]} />;
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
    <CircuitForm
      key={loaded.data.id}
      initial={loaded.data}
      initialProblems={loaded.meta?.publishProblems ?? []}
    />
  );
}

function CircuitForm({ initial, initialProblems }) {
  const router = useRouter();
  const isNew = !initial;
  const [circuit, setCircuit] = useState(initial);
  const [problems, setProblems] = useState(initialProblems);
  const [tab, setTab] = useState('basics');
  const [formError, setFormError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const form = useForm({ defaultValues: initial ? toValues(initial) : EMPTY, mode: 'onTouched' });
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  const templesError = useFieldErrorOutside(errors);

  const adopt = (body) => {
    setCircuit(body.data);
    setProblems(body.meta?.publishProblems ?? []);
    reset(toValues(body.data));
  };

  const onSave = handleSubmit(
    async (values) => {
      setFormError(null);
      try {
        if (isNew) {
          const body = await apiFetch('/admin/circuits', {
            method: 'POST',
            body: toPayload(values, { mode: 'create' }),
          });
          toast.success(t('adminContent.saved'));
          router.push(`/admin/circuits/${body.data.id}`);
          return;
        }
        const body = await apiFetch(`/admin/circuits/${circuit.id}`, {
          method: 'PATCH',
          body: toPayload(values, { mode: 'update', originalSlug: circuit.slug }),
        });
        adopt(body);
        toast.success(t('adminContent.saved'));
      } catch (error) {
        if (error.code === 'SLUG_TAKEN') {
          setTab('basics');
          setError('slug', { type: 'server', message: error.message }, { shouldFocus: true });
          return;
        }
        const unmatched =
          error.code === 'VALIDATION_ERROR'
            ? applyApiErrors(setError, error.details, FIELDS)
            : null;
        if (unmatched && unmatched.length === 0) {
          setTab(
            FIELD_TABS[error.details[0].path.replace(/^body\./, '').split('.')[0]] ?? 'basics',
          );
          return;
        }
        setFormError(
          unmatched?.length ? unmatched.map((d) => d.message).join(' ') : adminErrorMessage(error),
        );
      }
    },
    (invalid) => setTab(FIELD_TABS[Object.keys(invalid)[0]] ?? 'basics'),
  );

  const runAction = async (action, confirmKey) => {
    if (confirmKey && !window.confirm(t(confirmKey))) return;
    setBusyAction(action);
    setFormError(null);
    try {
      if (action === 'delete') {
        await apiFetch(`/admin/circuits/${circuit.id}`, { method: 'DELETE' });
        toast.success(t('adminContent.deleted'));
        router.push('/admin/circuits');
        return;
      }
      const body = await apiFetch(`/admin/circuits/${circuit.id}/${action}`, { method: 'POST' });
      setCircuit(body.data);
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

  const counts = errorCountsByTab(errors, FIELD_TABS);
  const tabKeys = isNew ? ['basics', 'temples', 'seo'] : ['basics', 'temples', 'media', 'seo'];
  const labels = { basics: 'tabBasics', temples: 'tabTemples', media: 'coverImage', seo: 'tabSeo' };
  const tabs = tabKeys.map((key) => ({
    key,
    label: t(`adminContent.${labels[key]}`),
    errors: counts[key] ?? 0,
  }));
  const busy = Boolean(busyAction) || isSubmitting;

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        <Link
          href="/admin/circuits"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('adminContent.circuitsTitle')}
        </Link>

        {isNew ? (
          <AdminPageHeader title={t('adminContent.newCircuit')} />
        ) : (
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold break-words text-accent">
                {circuit.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                <StatusBadge value={circuit.status} />
                <span>/circuits/{circuit.slug}</span>
                {circuit.status === 'published' && (
                  <a
                    href={`/circuits/${circuit.slug}`}
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
              {circuit.status !== 'published' && (
                <Button
                  onClick={() => runAction('publish')}
                  loading={busyAction === 'publish'}
                  disabled={busy || isDirty}
                >
                  {t('adminContent.publish')}
                </Button>
              )}
              {circuit.status === 'published' && (
                <Button
                  variant="secondary"
                  onClick={() => runAction('unpublish', 'adminContent.confirmUnpublish')}
                  loading={busyAction === 'unpublish'}
                  disabled={busy}
                >
                  {t('adminContent.unpublish')}
                </Button>
              )}
              {circuit.status === 'archived' && (
                <Button
                  variant="secondary"
                  onClick={() => runAction('unpublish')}
                  loading={busyAction === 'unpublish'}
                  disabled={busy}
                >
                  {t('adminContent.restore')}
                </Button>
              )}
              {circuit.status !== 'archived' && (
                <Button
                  variant="ghost"
                  onClick={() => runAction('archive', 'adminContent.confirmArchive')}
                  loading={busyAction === 'archive'}
                  disabled={busy}
                >
                  {t('adminContent.archive')}
                </Button>
              )}
              {circuit.status === 'draft' && (
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
        )}

        {!isNew && circuit.status !== 'published' && problems.length > 0 && (
          <Alert tone="warning">
            <p className="font-semibold">{t('adminContent.notReady')}</p>
            <ul className="mt-1 list-disc pl-5">
              {problems.map((p) => (
                <li key={p.message}>{p.message}</li>
              ))}
            </ul>
          </Alert>
        )}
        {!isNew && isDirty && circuit.status !== 'published' && (
          <p className="text-sm text-warning">{t('adminContent.saveBeforePublish')}</p>
        )}
        {formError && <Alert tone="danger">{formError}</Alert>}

        <form onSubmit={onSave} noValidate className="space-y-6">
          <Tabs
            tabs={tabs}
            active={tab}
            onChange={setTab}
            label={t('adminContent.circuitSections')}
            idPrefix="circuit"
          />

          <div
            {...tabPanelProps('circuit', 'basics', tab)}
            className="space-y-4 focus:outline-none"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                name="name"
                label={t('adminContent.name')}
                rules={{ required: 'Name is required' }}
                maxLength={120}
              />
              <TextInput name="region" label={t('adminContent.region')} maxLength={80} />
            </div>
            <TextInput
              name="slug"
              label={t('adminContent.slug')}
              hint={t('adminContent.slugHint')}
              maxLength={100}
              autoCapitalize="none"
              spellCheck={false}
            />
            <TextArea
              name="shortDescription"
              label={t('adminContent.shortDescription')}
              hint={t('adminContent.shortHint')}
              rows={3}
              maxLength={300}
              rules={{
                required: 'Short description is required',
                minLength: { value: 10, message: 'Write at least a sentence' },
              }}
            />
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  id="f-circuit-description"
                  label={t('adminContent.description')}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Checkbox name="featured" label={t('adminContent.featured')} />
          </div>

          <div {...tabPanelProps('circuit', 'temples', tab)} className="focus:outline-none">
            <Controller
              control={control}
              name="temples"
              render={({ field }) => (
                <TemplePicker value={field.value} onChange={field.onChange} error={templesError} />
              )}
            />
          </div>

          {!isNew && (
            <div {...tabPanelProps('circuit', 'media', tab)} className="focus:outline-none">
              <CoverImage circuit={circuit} onChange={adopt} />
            </div>
          )}

          <div {...tabPanelProps('circuit', 'seo', tab)} className="space-y-4 focus:outline-none">
            <TextInput name="seo.title" label={t('adminContent.seoTitle')} maxLength={60} />
            <TextArea
              name="seo.description"
              label={t('adminContent.seoDescription')}
              rows={3}
              maxLength={160}
            />
            <TextArea name="notes" label={t('adminContent.notes')} rows={5} maxLength={4000} />
          </div>

          {tab !== 'media' && (
            <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0">
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText={t('adminContent.saving')}
                disabled={busy || (!isNew && !isDirty)}
              >
                {isNew ? t('adminContent.create') : t('adminContent.save')}
              </Button>
              {!isNew && isDirty && (
                <Button variant="ghost" onClick={() => reset()} disabled={busy}>
                  {t('adminContent.discard')}
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </FormProvider>
  );
}

/** The temples array error can sit on the array itself or its root. */
function useFieldErrorOutside(errors) {
  return errors.temples?.message ?? errors.temples?.root?.message;
}

function CoverImage({ circuit, onChange }) {
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState(circuit.image?.alt ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const upload = async () => {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    form.append('alt', alt.trim());
    try {
      const body = await apiUpload(`/admin/circuits/${circuit.id}/image`, form);
      toast.success(t('adminContent.coverUploaded'));
      setFile(null);
      onChange(body);
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}
      {circuit.image && (
        <div className="relative aspect-[16/9] max-w-xl overflow-hidden rounded-md bg-surface-muted">
          <Image
            src={circuit.image.url}
            alt={circuit.image.alt || ''}
            fill
            sizes="576px"
            className="object-cover"
          />
        </div>
      )}
      <div className="max-w-xl space-y-3 rounded-md border border-dashed border-border bg-surface p-4">
        <p className="font-medium text-text">
          {circuit.image ? t('adminContent.replaceCover') : t('adminContent.uploadCover')}
        </p>
        <p className="text-sm text-text-muted">{t('adminContent.coverHint')}</p>
        <input
          id="circuit-cover-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            event.target.value = '';
          }}
        />
        <label
          htmlFor="circuit-cover-input"
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-accent px-4 text-sm font-medium text-accent hover:bg-accent-soft"
        >
          <Upload aria-hidden="true" className="size-4" />
          {t('adminContent.chooseFiles')}
        </label>
        {file && <p className="text-sm text-text">{file.name}</p>}
        <div className="space-y-1.5">
          <label htmlFor="circuit-cover-alt" className="block text-sm font-medium text-text">
            {t('adminContent.altText')}
          </label>
          <input
            id="circuit-cover-alt"
            value={alt}
            maxLength={200}
            onChange={(event) => setAlt(event.target.value)}
            className={inputClasses(false)}
          />
        </div>
        <Button
          onClick={upload}
          disabled={!file || !alt.trim()}
          loading={busy}
          loadingText={t('adminContent.saving')}
        >
          {t('adminContent.uploadCover')}
        </Button>
      </div>
    </div>
  );
}
