import bcrypt from 'bcryptjs';
import { z } from 'zod';

/** Common passwords refused at registration and password change. */
const DENY_LIST = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  '11111111',
  '00000000',
  'qwerty123',
  'qwertyuiop',
  'abcd1234',
  'iloveyou',
  'bhaktiyatra',
  'bhaktiyatra123',
]);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .refine((value) => !DENY_LIST.has(value.toLowerCase()), 'This password is too common');

export function hashPassword(plain, rounds) {
  return bcrypt.hash(plain, rounds);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

let dummyHash;
/**
 * Compare against a throwaway hash when the account does not exist (or has no password), so
 * response time does not reveal which emails are registered.
 */
export async function burnPasswordCheck(plain, rounds) {
  dummyHash ??= await bcrypt.hash('bhaktiyatra-timing-equaliser', rounds);
  await bcrypt.compare(plain, dummyHash);
}
