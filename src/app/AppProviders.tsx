import type { ReactNode } from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { ToastProvider } from '../components/feedback/ToastProvider';
import { SessionProvider } from '../features/auth/session/SessionProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
