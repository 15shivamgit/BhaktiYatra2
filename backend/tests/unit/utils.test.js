import { describe, expect, it } from 'vitest';
import { passwordSchema } from '../../src/modules/auth/password.js';
import { escapeRegex, pkceChallenge, safeEqual } from '../../src/utils/crypto.js';
import { maskEmail, normalizePhone } from '../../src/utils/phone.js';
import { safeNextPath } from '../../src/utils/safe-redirect.js';

describe('normalizePhone', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['98765 43210', '+919876543210'],
    ['+91 98765-43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['+447700900123', '+447700900123'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['12345', '5876543210', 'abcdefghij', '+0123456789'])('rejects %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('maskEmail', () => {
  it('hides the middle of the local part', () => {
    expect(maskEmail('sunita@example.com')).toBe('s***a@example.com');
    expect(maskEmail('ab@example.com')).toBe('a***@example.com');
  });
});

describe('safeNextPath', () => {
  it.each([
    ['/account', '/account'],
    ['/tours/char-dham?departure=1', '/tours/char-dham?departure=1'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['/ok\r\nSet-Cookie: x', '/'],
    ['', '/'],
    [undefined, '/'],
  ])('%j → %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe('crypto helpers', () => {
  it('computes the RFC 7636 example PKCE challenge', () => {
    expect(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('safeEqual compares strings in constant time and rejects non-strings', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual(undefined, 'abc')).toBe(false);
  });

  it('escapeRegex neutralises special characters', () => {
    expect(new RegExp(escapeRegex('a.*b')).test('a.*b')).toBe(true);
    expect(new RegExp(escapeRegex('a.*b')).test('axxb')).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts a reasonable password and rejects short, long and common ones', () => {
    expect(passwordSchema.safeParse('Pilgrim-2026').success).toBe(true);
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('x'.repeat(73)).success).toBe(false);
    expect(passwordSchema.safeParse('Password123').success).toBe(false);
    expect(passwordSchema.safeParse('BHAKTIYATRA').success).toBe(false);
  });
});
