import { describe, expect, it } from 'vitest';
import { t } from '@/lib/i18n';

describe('t()', () => {
  it('returns the English string for a dotted key', () => {
    expect(t('nav.temples')).toBe('Temples');
  });

  it('fills placeholders', () => {
    expect(t('status.version', { version: '1.2.3' })).toBe('Version 1.2.3');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(t('status.version', {})).toBe('Version {version}');
  });

  it('returns the key when the string is missing so gaps are visible', () => {
    expect(t('nope.missing')).toBe('nope.missing');
    expect(t('nav')).toBe('nav');
  });
});
