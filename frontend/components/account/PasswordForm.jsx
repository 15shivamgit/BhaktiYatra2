'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { authApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/messages';
import { useUser } from '@/lib/auth/user-context';
import { applyServerErrors, zodResolver } from '@/lib/forms/zod-resolver';
import { t } from '@/lib/i18n';
import { passwordFormSchema } from '@/lib/schemas/auth';

/** Change the password, or set a first one for accounts created with Google. */
export default function PasswordForm() {
  const { user, refresh } = useUser();
  const hasPassword = user.hasPassword;
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordFormSchema(hasPassword)),
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setFormError(null);
    try {
      await authApi.changePassword({ ...(hasPassword && { currentPassword }), newPassword });
      reset();
      await refresh();
      toast.success(t('account.passwordUpdated'));
    } catch (error) {
      if (error?.code === 'INVALID_CREDENTIALS') {
        setError(
          'currentPassword',
          { type: 'server', message: error.message },
          { shouldFocus: true },
        );
        return;
      }
      if (!applyServerErrors(setError, error?.details, ['currentPassword', 'newPassword'])) {
        setFormError(errorMessage(error));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {!hasPassword && <p className="text-sm text-text-muted">{t('account.setPasswordHint')}</p>}
      {formError && <Alert tone="danger">{formError}</Alert>}
      {hasPassword && (
        <FormField
          id="currentPassword"
          label={t('auth.currentPassword')}
          error={errors.currentPassword?.message}
          inputProps={{
            type: 'password',
            autoComplete: 'current-password',
            ...register('currentPassword'),
          }}
        />
      )}
      <FormField
        id="newPassword"
        label={t('auth.newPassword')}
        hint={t('auth.passwordHint')}
        error={errors.newPassword?.message}
        inputProps={{ type: 'password', autoComplete: 'new-password', ...register('newPassword') }}
      />
      <FormField
        id="confirmNewPassword"
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
        variant="secondary"
        loading={isSubmitting}
        loadingText={t('auth.working')}
      >
        {t('account.updatePassword')}
      </Button>
    </form>
  );
}
