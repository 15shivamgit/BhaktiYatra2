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
import { useUser } from '@/lib/auth/user-context';
import { applyServerErrors, zodResolver } from '@/lib/forms/zod-resolver';
import { t } from '@/lib/i18n';
import { safeNext } from '@/lib/navigation';
import { registerFormSchema } from '@/lib/schemas/auth';
import GoogleButton from './GoogleButton';

const FIELDS = ['name', 'email', 'phone', 'password'];

export default function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useUser();
  const next = safeNext(params.get('next'), '');
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async ({ name, email, phone, password }) => {
    setFormError(null);
    try {
      const user = await authApi.register({ name, email, password, ...(phone && { phone }) });
      setUser(user);
      toast.success(t('auth.registered', { name: user.name }));
      router.replace(next || '/');
    } catch (error) {
      if (error?.code === 'EMAIL_TAKEN') {
        setError(
          'email',
          { type: 'server', message: t('errors.EMAIL_TAKEN') },
          { shouldFocus: true },
        );
        return;
      }
      if (!applyServerErrors(setError, error?.details, FIELDS)) setFormError(errorMessage(error));
    }
  };

  return (
    <>
      <GoogleButton next={next} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <FormField
          id="name"
          label={t('auth.name')}
          error={errors.name?.message}
          inputProps={{ autoComplete: 'name', ...register('name') }}
        />
        <FormField
          id="email"
          label={t('auth.email')}
          error={errors.email?.message}
          inputProps={{ type: 'email', autoComplete: 'email', ...register('email') }}
        />
        {errors.email?.type === 'server' && (
          <p className="-mt-3 text-sm">
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
              className="text-primary hover:underline"
            >
              {t('auth.loginInstead')}
            </Link>
          </p>
        )}
        <FormField
          id="phone"
          label={t('auth.phone')}
          hint={t('auth.phoneHint')}
          error={errors.phone?.message}
          inputProps={{ type: 'tel', autoComplete: 'tel', inputMode: 'tel', ...register('phone') }}
        />
        <FormField
          id="password"
          label={t('auth.password')}
          hint={t('auth.passwordHint')}
          error={errors.password?.message}
          inputProps={{ type: 'password', autoComplete: 'new-password', ...register('password') }}
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
        <div>
          <label className="flex items-start gap-3 text-sm text-text">
            <input
              type="checkbox"
              className="mt-0.5 size-5 accent-primary"
              aria-invalid={errors.acceptTerms ? true : undefined}
              aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
              {...register('acceptTerms')}
            />
            <span>{t('auth.acceptTerms')}</span>
          </label>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="mt-1.5 text-sm text-danger">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          loadingText={t('auth.working')}
        >
          {t('auth.registerButton')}
        </Button>
      </form>
    </>
  );
}
