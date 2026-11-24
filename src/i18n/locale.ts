export type Locale = 'en' | 'ar';

export const locales: Locale[] = ['en', 'ar'];

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ar';
}

export function localeTag(locale: Locale): string {
  return locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG';
}

export function directionFor(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
