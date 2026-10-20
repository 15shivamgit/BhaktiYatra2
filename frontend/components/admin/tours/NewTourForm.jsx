'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminList';
import { TourBasicsFields, TourContentFields } from '@/components/admin/tours/TourFields';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { adminErrorMessage, applyApiErrors } from '@/lib/admin/errors';
import { emptyTourValues, toPayload, tourFieldFor } from '@/lib/admin/tour-form';
import { apiFetch } from '@/lib/api/client';
import { t } from '@/lib/i18n';

const FORM_FIELDS = Object.keys(emptyTourValues());

/** Create a draft tour with the required fields, then continue in the full editor. */
export default function NewTourForm() {
  const router = useRouter();
  const [formError, setFormError] = useState(null);
  const form = useForm({ defaultValues: emptyTourValues(), mode: 'onTouched' });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const body = await apiFetch('/admin/tours', {
        method: 'POST',
        body: toPayload(values, { mode: 'create' }),
      });
      toast.success(t('adminContent.created'));
      router.push(`/admin/tours/${body.data.id}`);
    } catch (error) {
      if (error.code === 'SLUG_TAKEN') {
        setError('slug', { type: 'server', message: error.message }, { shouldFocus: true });
        return;
      }
      const unmatched =
        error.code === 'VALIDATION_ERROR'
          ? applyApiErrors(setError, error.details, FORM_FIELDS, tourFieldFor)
          : null;
      if (unmatched && unmatched.length === 0) return;
      setFormError(
        unmatched?.length ? unmatched.map((d) => d.message).join(' ') : adminErrorMessage(error),
      );
    }
  });

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
        <AdminPageHeader title={t('adminTours.newTour')} />
        <p className="max-w-prose text-text-muted">{t('adminTours.newIntro')}</p>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-6 rounded-lg border border-border bg-surface p-4 sm:p-6"
        >
          <TourBasicsFields />
          <TourContentFields includeHighlights={false} />
          <Button type="submit" loading={isSubmitting} loadingText={t('adminContent.saving')}>
            {t('adminContent.create')}
          </Button>
        </form>
      </div>
    </FormProvider>
  );
}
