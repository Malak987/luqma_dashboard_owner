import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import iconStyles from './IconButton.module.css';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  children: ReactNode;
  variant?: 'ghost' | 'surface';
  size?: 'sm' | 'md';
  badge?: number;
}

export function IconButton({
  label,
  children,
  variant = 'ghost',
  size = 'md',
  badge,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        iconStyles.iconButton,
        iconStyles[variant],
        iconStyles[size],
        className,
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className={iconStyles.badge} aria-hidden="true">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
