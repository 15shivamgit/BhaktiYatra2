import { z } from 'zod';
import { normalizePhone } from '../../utils/phone.js';
import { passwordSchema } from './password.js';

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(80);
const emailSchema = z.email('Enter a valid email address').trim().toLowerCase().max(254);

const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .transform((value, ctx) => {
    const normalised = normalizePhone(value);
    if (!normalised) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid phone number' });
      return z.NEVER;
    }
    return normalised;
  });

export const registerSchema = {
  body: z
    .object({
      name: nameSchema,
      email: emailSchema,
      password: passwordSchema,
      phone: phoneSchema.optional(),
    })
    .strict(),
};

export const loginSchema = {
  body: z
    .object({
      email: emailSchema,
      password: z.string().min(1, 'Enter your password').max(200),
    })
    .strict(),
};

export const updateMeSchema = {
  body: z
    .object({
      name: nameSchema.optional(),
      // An empty string removes the phone number.
      phone: z.union([z.literal(''), phoneSchema]).optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update'),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().max(200).optional(),
      newPassword: passwordSchema,
    })
    .strict(),
};

export const forgotPasswordSchema = {
  body: z.object({ email: emailSchema }).strict(),
};

export const resetPasswordSchema = {
  body: z
    .object({
      token: z.string().regex(/^[A-Za-z0-9_-]{20,128}$/, 'Invalid reset link'),
      newPassword: passwordSchema,
    })
    .strict(),
};

export const googleStartSchema = {
  query: z.object({ next: z.string().max(512).optional() }),
};

// Google adds extra parameters (scope, authuser, prompt); unknown keys are stripped.
export const googleCallbackSchema = {
  query: z.object({
    code: z.string().max(2048).optional(),
    state: z.string().max(256).optional(),
    error: z.string().max(256).optional(),
  }),
};
