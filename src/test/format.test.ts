import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatHour,
  formatPercent,
  formatRelativeMinutes,
} from '../lib/format';
import { directionFor } from '../i18n/locale';

describe('locale formatting', () => {
  it('formats Egyptian pounds for English and Arabic', () => {
    const english = formatCurrency(184250, 'en');
    const arabic = formatCurrency(184250, 'ar');

    expect(english).toContain('EGP');
    expect(english).toContain('184,250');
    expect(arabic).toContain('184,250');
    expect(arabic).toContain('ج.م');
  });

  it('keeps one decimal for average order values', () => {
    const value = formatCurrency(143.5, 'en', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    expect(value).toContain('143.5');
    expect(value).toContain('EGP');
  });

  it('formats signed percentages', () => {
    expect(formatPercent(12.4, 'en')).toBe('+12.4%');
    expect(formatPercent(-2.3, 'en')).toBe('-2.3%');
    expect(formatPercent(38.2, 'en', { signDisplay: 'never' })).toBe('38.2%');
  });

  it('formats relative time and hours with the active locale', () => {
    expect(formatRelativeMinutes(8, 'en')).toContain('8');
    expect(formatRelativeMinutes(8, 'ar')).toContain('8');
    expect(formatHour(20, 'en')).toContain('8');
    expect(formatHour(20, 'en')).toContain('PM');
  });

  it('maps locale to direction', () => {
    expect(directionFor('en')).toBe('ltr');
    expect(directionFor('ar')).toBe('rtl');
  });
});
