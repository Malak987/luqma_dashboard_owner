import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ar } from './ar';
import { I18nContext, type I18nContextValue } from './context';
import { en, type TranslationKey } from './en';
import { directionFor, isLocale, type Locale } from './locale';

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const fromQuery = new URLSearchParams(window.location.search).get('lang');
  if (isLocale(fromQuery)) {
    return fromQuery;
  }

  const stored = window.localStorage.getItem('luqma.lang');
  if (isLocale(stored)) {
    return stored;
  }

  return 'en';
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => (current === 'ar' ? 'en' : 'ar'));
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dictionary = locale === 'ar' ? ar : en;
      return interpolate(dictionary[key], vars);
    },
    [locale],
  );

  useEffect(() => {
    const dir = directionFor(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.title = t('app.documentTitle');
    window.localStorage.setItem('luqma.lang', locale);
  }, [locale, t]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: directionFor(locale),
      t,
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, t, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
