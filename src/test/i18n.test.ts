import { describe, expect, it } from 'vitest';
import { ar } from '../i18n/ar';
import { en } from '../i18n/en';

function placeholders(value: string): string[] {
  return Array.from(value.matchAll(/\{(\w+)\}/g), (match) => match[1]).sort();
}

describe('translation dictionaries', () => {
  it('have exactly the same keys in English and Arabic', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it('have no empty translations', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim().length, `English key ${key}`).toBeGreaterThan(0);
    }
    for (const [key, value] of Object.entries(ar)) {
      expect(value.trim().length, `Arabic key ${key}`).toBeGreaterThan(0);
    }
  });

  it('preserve the same placeholder names in both languages', () => {
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(placeholders(ar[key]), `Placeholders for ${key}`).toEqual(placeholders(en[key]));
    }
  });

  it('do not contain hardcoded English UI copy in the Arabic dictionary', () => {
    for (const [key, value] of Object.entries(ar)) {
      if (
        key === 'settings.languageEnglish' ||
        key === 'login.emailPlaceholder' ||
        value.includes('English')
      ) {
        continue;
      }
      const isAscii = [...value].every((character) => character.charCodeAt(0) <= 127);
      expect(isAscii, `Arabic key ${key} should not be plain ASCII`).toBe(false);
    }
  });
});
