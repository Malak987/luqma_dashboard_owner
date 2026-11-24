import { formatNumber } from '../../lib/format';
import type { Locale } from '../../i18n/locale';
import styles from './HorizontalBars.module.css';

export interface HorizontalBarItem {
  label: string;
  value: number;
  share: number;
  color?: string;
}

interface HorizontalBarsProps {
  items: HorizontalBarItem[];
  locale: Locale;
  formatValue?: (item: HorizontalBarItem) => string;
}

export function HorizontalBars({ items, locale, formatValue }: HorizontalBarsProps) {
  return (
    <ul className={styles.list}>
      {items.map((item, index) => (
        <li key={item.label} className={styles.row}>
          <div className={styles.meta}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>
              {formatValue ? formatValue(item) : formatNumber(item.value, locale)}
            </span>
          </div>
          <div className={styles.track}>
            <span
              className={styles.fill}
              style={{
                width: `${Math.max(0, Math.min(100, item.share))}%`,
                background: item.color ?? `var(--chart-${index === 0 ? 'primary' : 'accent'})`,
              }}
              aria-hidden="true"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
