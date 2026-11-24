import { createContext, useContext } from 'react';
import type { TranslationKey } from './en';
import type { Locale } from './locale';

export interface I18nContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}
