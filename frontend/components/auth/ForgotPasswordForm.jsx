'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { authApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/messages';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { t } from '@/lib/i18n';
import { forgotFormSchema } from '@/lib/schemas/auth';

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotFormSchema), mode: 'onTouched' });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await authApi.forgotPassword(values);
      setSent(true);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  if (sent) return <Alert tone="success">{t('auth.resetSent')}</Alert>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField
        id="email"
        label={t('auth.email')}
        error={errors.email?.message}
        inputProps={{ type: 'email', autoComplete: 'email', ...register('email') }}
      />
      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        loadingText={t('auth.working')}
      >
        {t('auth.sendResetLink')}
      </Button>
    </form>
  );
}
