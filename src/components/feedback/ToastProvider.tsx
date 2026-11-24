import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { ToastContext, type ToastContextValue, type ToastTone } from './ToastContext';
import styles from './Toast.module.css';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: number) => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const { t } = useI18n();

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 4800);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? AlertCircle : Info;

  return (
    <div className={styles.toast} data-tone={item.tone} role="status">
      <Icon className={styles.icon} size={18} strokeWidth={1.8} aria-hidden="true" />
      <p className={styles.message}>{item.message}</p>
      <button
        type="button"
        className={styles.close}
        onClick={() => onDismiss(item.id)}
        aria-label={t('common.dismiss')}
      >
        <X size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((current) => [...current.slice(-3), { id, message, tone }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const value: ToastContextValue = { toast, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport} aria-live="polite" aria-atomic="false">
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
