import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
