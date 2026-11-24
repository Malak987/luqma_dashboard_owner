import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '../../lib/cx';
import { useBodyScrollLock, useEscapeKey } from '../../lib/hooks';
import styles from './Dialog.module.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  placement?: 'center' | 'end';
  size?: 'sm' | 'md' | 'lg';
  closeLabel: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  placement = 'center',
  size = 'sm',
  closeLabel,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useBodyScrollLock(open);
  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      '[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panel) {
        return;
      }

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((item) => item.offsetParent !== null);

      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className={cx(styles.overlay, placement === 'end' && styles.overlayEnd)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className={cx(styles.panel, styles[`panel_${size}`], placement === 'end' && styles.drawer)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            {description && (
              <p className={styles.description} id={descriptionId}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
