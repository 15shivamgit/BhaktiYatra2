'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { authApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/messages';
import { applyServerErrors, zodResolver } from '@/lib/forms/zod-resolver';
import { t } from '@/lib/i18n';
import { resetFormSchema } from '@/lib/schemas/auth';

export default function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetFormSchema), mode: 'onTouched' });

  if (!token) {
    return (
      <Alert tone="danger">
        {t('auth.resetMissingToken')}{' '}
        <Link href="/forgot-password" className="font-medium underline">
          {t('auth.sendResetLink')}
        </Link>
      </Alert>
    );
  }

  const onSubmit = async ({ newPassword }) => {
    setFormError(null);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast.success(t('auth.resetDone'));
      router.replace('/login');
    } catch (error) {
      if (!applyServerErrors(setError, error?.details, ['newPassword'])) {
        setFormError(errorMessage(error));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && (
        <Alert tone="danger">
          {formError}{' '}
          {formError === t('errors.INVALID_OR_EXPIRED_TOKEN') && (
            <Link href="/forgot-password" className="font-medium underline">
              {t('auth.sendResetLink')}
            </Link>
          )}
        </Alert>
      )}
      <FormField
        id="newPassword"
        label={t('auth.newPassword')}
        hint={t('auth.passwordHint')}
        error={errors.newPassword?.message}
        inputProps={{ type: 'password', autoComplete: 'new-password', ...register('newPassword') }}
      />
      <FormField
        id="confirmPassword"
        label={t('auth.confirmPassword')}
        error={errors.confirmPassword?.message}
        inputProps={{
          type: 'password',
          autoComplete: 'new-password',
          ...register('confirmPassword'),
        }}
      />
      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        loadingText={t('auth.working')}
      >
        {t('auth.resetButton')}
      </Button>
    </form>
  );
}
