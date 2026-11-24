import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

/** Shared theme colors keep the browser meta color and visual theme in sync. */
export const themeColors: Record<Theme, string> = {
  light: '#F6F1E7',
  dark: '#171717',
};

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
