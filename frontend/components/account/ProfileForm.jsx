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
import { profileFormSchema } from '@/lib/schemas/auth';

export default function ProfileForm() {
  const { user, setUser } = useUser();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileFormSchema),
    mode: 'onTouched',
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const updated = await authApi.updateMe(values);
      setUser(updated);
      reset({ name: updated.name, phone: updated.phone ?? '' });
      toast.success(t('account.saved'));
    } catch (error) {
      if (!applyServerErrors(setError, error?.details, ['name', 'phone'])) {
        setFormError(errorMessage(error));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField
        id="profile-name"
        label={t('auth.name')}
        error={errors.name?.message}
        inputProps={{ autoComplete: 'name', ...register('name') }}
      />
      <FormField
        id="profile-email"
        label={t('auth.email')}
        hint={t('account.emailReadOnly')}
        inputProps={{ type: 'email', value: user.email, readOnly: true }}
      />
      <FormField
        id="profile-phone"
        label={t('auth.phone')}
        hint={t('auth.phoneHint')}
        error={errors.phone?.message}
        inputProps={{ type: 'tel', autoComplete: 'tel', inputMode: 'tel', ...register('phone') }}
      />
      <Button
        type="submit"
        loading={isSubmitting}
        loadingText={t('auth.working')}
        disabled={!isDirty}
      >
        {t('account.save')}
      </Button>
    </form>
  );
}
