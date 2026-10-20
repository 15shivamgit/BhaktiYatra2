'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { authApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/messages';
import { useUser } from '@/lib/auth/user-context';
import { zodResolver } from '@/lib/forms/zod-resolver';
import { t } from '@/lib/i18n';
import { safeNext } from '@/lib/navigation';
import { loginFormSchema } from '@/lib/schemas/auth';
import GoogleButton from './GoogleButton';

const MAX_FAILURES = 5;
const COOLDOWN_SECONDS = 30;
const GOOGLE_ERRORS = ['google_cancelled', 'google_failed', 'account_disabled'];

/** Message for the `?error=` value the API puts on the login URL after Google sign-in. */
function googleErrorMessage(code) {
  if (!code) return null;
  return t(`auth.googleError.${GOOGLE_ERRORS.includes(code) ? code : 'google_failed'}`);
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useUser();
  const next = safeNext(params.get('next'), '');
  const [formError, setFormError] = useState(() => googleErrorMessage(params.get('error')));
  const [failures, setFailures] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginFormSchema), mode: 'onTouched' });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const user = await authApi.login(values);
      setUser(user);
      toast.success(t('auth.welcome', { name: user.name }));
      router.replace(next || (user.role === 'admin' ? '/admin' : '/'));
    } catch (error) {
      setFormError(errorMessage(error));
      const count = failures + 1;
      setFailures(count);
      if (count >= MAX_FAILURES) {
        setCooldown(COOLDOWN_SECONDS);
        setFailures(0);
      }
    }
  };

  return (
    <>
      <GoogleButton next={next} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <FormField
          id="email"
          label={t('auth.email')}
          error={errors.email?.message}
          inputProps={{ type: 'email', autoComplete: 'email', ...register('email') }}
        />
        <div>
          <FormField
            id="password"
            label={t('auth.password')}
            error={errors.password?.message}
            inputProps={{
              type: 'password',
              autoComplete: 'current-password',
              ...register('password'),
            }}
          />
          <Link
            href="/forgot-password"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            {t('auth.forgotLink')}
          </Link>
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          loadingText={t('auth.working')}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? t('auth.cooldown', { seconds: cooldown }) : t('auth.loginButton')}
        </Button>
      </form>
    </>
  );
}
