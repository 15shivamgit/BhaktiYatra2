import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { errorMessage } from '@/lib/api/messages';
import { applyServerErrors, zodResolver } from '@/lib/forms/zod-resolver';
import { loginUrl, safeNext } from '@/lib/navigation';
import { passwordFormSchema, registerFormSchema } from '@/lib/schemas/auth';

describe('zodResolver', () => {
  it('returns parsed values on success and field errors on failure', async () => {
    const resolve = zodResolver(passwordFormSchema(true));
    const ok = await resolve({
      currentPassword: 'old',
      newPassword: 'New-Pass-123',
      confirmPassword: 'New-Pass-123',
    });
    expect(ok.errors).toEqual({});
    expect(ok.values.newPassword).toBe('New-Pass-123');

    const bad = await resolve({ currentPassword: '', newPassword: 'short', confirmPassword: 'x' });
    expect(Object.keys(bad.errors)).toEqual(
      expect.arrayContaining(['currentPassword', 'newPassword']),
    );
  });

  it('flags mismatched confirmation on the confirm field', async () => {
    const resolve = zodResolver(passwordFormSchema(false));
    const result = await resolve({
      newPassword: 'New-Pass-123',
      confirmPassword: 'Other-Pass-123',
    });
    expect(result.errors.confirmPassword.message).toBe('Passwords do not match');
  });
});

describe('registerFormSchema', () => {
  const valid = {
    name: 'Sunita Sharma',
    email: 'Sunita@Example.com',
    phone: '',
    password: 'Strong-Pass-1',
    confirmPassword: 'Strong-Pass-1',
    acceptTerms: true,
  };

  it('accepts a valid form and lower-cases the email', () => {
    const result = registerFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('sunita@example.com');
  });

  it('requires accepting the terms and a sensible phone', () => {
    const result = registerFormSchema.safeParse({ ...valid, acceptTerms: false, phone: 'abc' });
    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['acceptTerms', 'phone']));
  });
});

describe('applyServerErrors', () => {
  it('maps API detail paths onto known fields and focuses the first', () => {
    const setError = vi.fn();
    const applied = applyServerErrors(
      setError,
      [
        { path: 'body.email', message: 'Taken' },
        { path: 'body.password', message: 'Too common' },
        { path: 'body.unknown', message: 'ignored' },
      ],
      ['email', 'password'],
    );
    expect(applied).toBe(true);
    expect(setError).toHaveBeenNthCalledWith(
      1,
      'email',
      { type: 'server', message: 'Taken' },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenNthCalledWith(
      2,
      'password',
      { type: 'server', message: 'Too common' },
      { shouldFocus: false },
    );
    expect(setError).toHaveBeenCalledTimes(2);
  });

  it('returns false when nothing matched', () => {
    expect(applyServerErrors(vi.fn(), undefined, ['email'])).toBe(false);
  });
});

describe('safeNext / loginUrl', () => {
  it.each([
    ['/account', '/account'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil', '/'],
    [null, '/'],
  ])('safeNext(%j) → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it('builds a login URL with an encoded return path', () => {
    expect(loginUrl('/account/bookings')).toBe('/login?next=%2Faccount%2Fbookings');
    expect(loginUrl('/')).toBe('/login');
    expect(loginUrl('https://evil.example')).toBe('/login');
  });
});

describe('errorMessage', () => {
  const err = (code, extra = {}) => new ApiError({ status: 400, code, message: 'raw', ...extra });

  it('uses friendly text for known codes', () => {
    expect(errorMessage(err('INVALID_CREDENTIALS'))).toBe('Invalid email or password.');
    expect(errorMessage(err('NETWORK_ERROR'))).toMatch(/could not reach the server/i);
  });

  it('falls back to a generic message with the request id', () => {
    expect(errorMessage(err('SOMETHING_NEW', { requestId: 'req-9' }))).toBe(
      'Something went wrong. Reference: req-9',
    );
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
