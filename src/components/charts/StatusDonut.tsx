import { useI18n } from '../../i18n/context';
import { formatNumber, formatPercent } from '../../lib/format';
import styles from './StatusDonut.module.css';

export interface DonutSlice {
  label: string;
  count: number;
  color: string;
}

interface StatusDonutProps {
  slices: DonutSlice[];
  centerLabel: string;
  ariaLabel: string;
}

export function StatusDonut({ slices, centerLabel, ariaLabel }: StatusDonutProps) {
  const { locale } = useI18n();
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  let cursor = 0;
  const stops = slices.map((slice) => {
    const start = cursor;
    const share = total > 0 ? (slice.count / total) * 100 : 0;
    cursor += share;
    return `${slice.color} ${start}% ${cursor}%`;
  });

  const background =
    total > 0 ? `conic-gradient(${stops.join(', ')})` : 'var(--neutral-soft)';

  return (
    <div className={styles.wrap}>
      <div
        className={styles.donut}
        style={{ background }}
        role="img"
        aria-label={ariaLabel}
      >
        <div className={styles.hole}>
          <span className={styles.total}>{formatNumber(total, locale)}</span>
          <span className={styles.totalLabel}>{centerLabel}</span>
        </div>
      </div>
      <ul className={styles.legend}>
        {slices.map((slice) => (
          <li key={slice.label} className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: slice.color }} aria-hidden="true" />
            <span className={styles.legendLabel}>{slice.label}</span>
            <span className={styles.legendCount}>{formatNumber(slice.count, locale)}</span>
            <span className={styles.legendShare}>
              {total > 0 ? formatPercent((slice.count / total) * 100, locale) : formatPercent(0, locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
