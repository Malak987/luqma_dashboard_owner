import { localeTag, type Locale } from '../i18n/locale';

type NumberOptions = Intl.NumberFormatOptions;

function makeNumberFormat(locale: Locale, options: NumberOptions): Intl.NumberFormat {
  return new Intl.NumberFormat(localeTag(locale), options);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options: NumberOptions = {},
): string {
  return makeNumberFormat(locale, {
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}

export function formatCompactNumber(value: number, locale: Locale): string {
  return makeNumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(
  value: number,
  locale: Locale,
  options: NumberOptions = {},
): string {
  return makeNumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    currencyDisplay: locale === 'ar' ? 'symbol' : 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatPercent(
  value: number,
  locale: Locale,
  options: NumberOptions = {},
): string {
  return makeNumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
    ...options,
  }).format(value / 100);
}

export function formatRating(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatDate(
  iso: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  return new Intl.DateTimeFormat(localeTag(locale), options).format(new Date(`${iso}T00:00:00Z`));
}

export function formatShortDate(iso: string, locale: Locale): string {
  return formatDate(iso, locale, { day: 'numeric', month: 'short' });
}

export function formatChartDay(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatHour(hour: number, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: 'numeric',
  }).format(new Date(2026, 10, 23, hour));
}

export function formatRelativeMinutes(minutes: number, locale: Locale): string {
  const formatter = new Intl.RelativeTimeFormat(localeTag(locale), { numeric: 'auto' });

  if (minutes < 60) {
    return formatter.format(-minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return formatter.format(-hours, 'hour');
  }

  const days = Math.round(hours / 24);
  return formatter.format(-days, 'day');
}

export function localized(
  value: { en: string; ar: string },
  locale: Locale,
): string {
  return value[locale];
}
