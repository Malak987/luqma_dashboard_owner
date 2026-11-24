import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cx } from '../../lib/cx';
import styles from './Form.module.css';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string;
  startIcon?: ReactNode;
  endAdornment?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    startIcon,
    endAdornment,
    containerClassName,
    id,
    required,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, containerClassName)}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div
        className={cx(
          styles.control,
          startIcon ? styles.hasStartIcon : undefined,
          endAdornment ? styles.hasEndAdornment : undefined,
          error ? styles.invalid : undefined,
        )}
      >
        {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
        <input
          {...rest}
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(styles.input, className)}
        />
        {endAdornment && <span className={styles.endAdornment}>{endAdornment}</span>}
      </div>
      {error ? (
        <p className={styles.error} id={errorId}>
          <AlertCircle size={13} strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p className={styles.hint} id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> {
  label: string;
  options: SelectOption[];
  containerClassName?: string;
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, containerClassName, hideLabel = false, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cx(styles.field, containerClassName)}>
      <label className={hideLabel ? 'sr-only' : styles.label} htmlFor={selectId}>
        {label}
      </label>
      <div className={cx(styles.control, styles.selectControl)}>
        <select {...rest} ref={ref} id={selectId} className={cx(styles.select, className)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cx(styles.selectChevron, 'icon-directional')}
          size={15}
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </div>
  );
});
