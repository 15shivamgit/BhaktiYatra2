'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField, { inputClasses } from '@/components/ui/FormField';
import { apiFetch } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/messages';
import { applyServerErrors, zodResolver } from '@/lib/forms/zod-resolver';
import { t } from '@/lib/i18n';

const schema = z.object({
  name: z.string().trim().min(2, t('validation.nameShort')).max(80),
  email: z.email(t('validation.email')).trim(),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Write at least 10 characters').max(2000),
  website: z.string().optional(),
});

/** Contact form; `website` is a hidden honeypot that only bots fill in. */
export default function ContactForm({ defaultSubject = '' }) {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { subject: defaultSubject },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    const body = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined),
    );
    try {
      await apiFetch('/contact', { method: 'POST', body });
      reset();
      setSent(true);
    } catch (error) {
      if (
        !applyServerErrors(setError, error?.details, [
          'name',
          'email',
          'phone',
          'subject',
          'message',
        ])
      ) {
        setFormError(errorMessage(error));
      }
    }
  };

  if (sent) return <Alert tone="success">{t('contact.sent')}</Alert>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="contact-name"
          label={t('contact.name')}
          error={errors.name?.message}
          inputProps={{ autoComplete: 'name', ...register('name') }}
        />
        <FormField
          id="contact-email"
          label={t('contact.email')}
          error={errors.email?.message}
          inputProps={{ type: 'email', autoComplete: 'email', ...register('email') }}
        />
        <FormField
          id="contact-phone"
          label={t('contact.phone')}
          error={errors.phone?.message}
          inputProps={{ type: 'tel', autoComplete: 'tel', ...register('phone') }}
        />
        <FormField
          id="contact-subject"
          label={t('contact.subject')}
          error={errors.subject?.message}
          inputProps={register('subject')}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="block text-sm font-medium text-text">
          {t('contact.message')}
        </label>
        <textarea
          id="contact-message"
          rows={6}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={`${inputClasses(Boolean(errors.message))} min-h-36`}
          {...register('message')}
        />
        {errors.message && (
          <p id="contact-message-error" className="text-sm text-danger">
            {errors.message.message}
          </p>
        )}
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>
      <Button type="submit" loading={isSubmitting} loadingText={t('auth.working')}>
        {t('contact.send')}
      </Button>
    </form>
  );
}
