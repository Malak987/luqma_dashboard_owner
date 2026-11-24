import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Primitives.module.css';
import type { BadgeTone, StatusMeta } from '../../lib/status';
import { useI18n } from '../../i18n/context';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[`badge_${tone}`], className)}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  const { t } = useI18n();
  return (
    <Badge tone={meta.tone} dot className={className}>
      {t(meta.labelKey)}
    </Badge>
  );
}

interface AvatarProps {
  name: string;
  tone?: 0 | 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, 2).join('');
  }
  return `${Array.from(parts[0])[0] ?? ''}${Array.from(parts[1])[0] ?? ''}`;
}

export function Avatar({ name, tone = 0, size = 'md', className, label }: AvatarProps) {
  return (
    <span
      className={cx(styles.avatar, styles[`avatar_${tone}`], styles[`avatar_${size}`], className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {initialsFor(name)}
    </span>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cx(styles.segmented, styles[`segmented_${size}`], className)}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cx(styles.segment, active && styles.segmentActive)}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className={styles.segmentCount}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={cx(styles.checkbox, className)} htmlFor={inputId}>
      <input {...rest} id={inputId} type="checkbox" className={styles.checkboxInput} />
      <span className={styles.checkboxBox} aria-hidden="true">
        <svg viewBox="0 0 12 10" fill="none">
          <path d="M1 5.2 4.3 8.5 11 1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={styles.checkboxLabel}>{label}</span>
    </label>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cx(styles.switch, checked && styles.switchOn)}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} aria-hidden="true" />
    </button>
  );
}
