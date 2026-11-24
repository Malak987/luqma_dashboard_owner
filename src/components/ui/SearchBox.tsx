import { Search, X } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { cx } from '../../lib/cx';
import styles from './SearchBox.module.css';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: SearchBoxProps) {
  const { t } = useI18n();

  return (
    <div className={cx(styles.box, className)}>
      <Search className={styles.icon} size={16} strokeWidth={1.8} aria-hidden="true" />
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        dir="auto"
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label={t('common.clear')}
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
