import { describe, expect, it } from 'vitest';
import { t } from '@/lib/i18n';

describe('t()', () => {
  it('returns the English string for a dotted key', () => {
    expect(t('nav.temples')).toBe('Temples');
  });

  it('fills placeholders', () => {
    expect(t('temples.page', { page: 2, total: 5 })).toBe('Page 2 of 5');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(t('temples.page', { page: 2 })).toBe('Page 2 of {total}');
  });

  it('returns the key when the string is missing so gaps are visible', () => {
    expect(t('nope.missing')).toBe('nope.missing');
    expect(t('nav')).toBe('nav');
  });
});
