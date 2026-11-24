import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cx } from '../../lib/cx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface ButtonProps
  extends ButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {}

function content(
  loading: boolean,
  icon: ReactNode,
  children: ReactNode,
  iconEnd: ReactNode,
) {
  return (
    <>
      {loading ? (
        <Loader2 className={styles.spinner} size={16} strokeWidth={2} aria-hidden="true" />
      ) : (
        icon && <span className={styles.icon}>{icon}</span>
      )}
      {children && <span className={styles.label}>{children}</span>}
      {!loading && iconEnd && <span className={styles.icon}>{iconEnd}</span>}
    </>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {content(loading, icon, children, iconEnd)}
    </button>
  );
}

export interface ButtonLinkProps extends ButtonBaseProps {
  to: string;
  'aria-label'?: string;
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  loading = false,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      {...rest}
      to={to}
      aria-busy={loading || undefined}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {content(loading, icon, children, iconEnd)}
    </Link>
  );
}
