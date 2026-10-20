import { z } from 'zod';
import { t } from '@/lib/i18n';

/*
 * Client-side mirrors of the API rules (backend/src/modules/auth/auth.schemas.js) for instant
 * feedback. The API stays the authority: it also rejects common passwords and normalises phones.
 */

const name = z.string().trim().min(2, t('validation.nameShort')).max(80);
const email = z.email(t('validation.email')).trim().toLowerCase();
const password = z
  .string()
  .min(8, t('validation.passwordShort'))
  .max(72, t('validation.passwordLong'));
const phone = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\+?[\d\s()-]{10,20}$/.test(value), t('validation.phone'));

const matchPasswords = (field) => (data) => data[field] === data.confirmPassword;

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, t('validation.passwordRequired')),
});

export const registerFormSchema = z
  .object({
    name,
    email,
    phone,
    password,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { error: t('validation.terms') }),
  })
  .refine(matchPasswords('password'), {
    path: ['confirmPassword'],
    message: t('validation.passwordsDiffer'),
  });

export const forgotFormSchema = z.object({ email });

export const resetFormSchema = z
  .object({ newPassword: password, confirmPassword: z.string() })
  .refine(matchPasswords('newPassword'), {
    path: ['confirmPassword'],
    message: t('validation.passwordsDiffer'),
  });

export const profileFormSchema = z.object({ name, phone });

/** @param {boolean} hasPassword whether a current password must be entered */
export function passwordFormSchema(hasPassword) {
  return z
    .object({
      currentPassword: hasPassword
        ? z.string().min(1, t('validation.currentPasswordRequired'))
        : z.string().optional(),
      newPassword: password,
      confirmPassword: z.string(),
    })
    .refine(matchPasswords('newPassword'), {
      path: ['confirmPassword'],
      message: t('validation.passwordsDiffer'),
    });
}
