import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './CompactStats.module.css';

export type CompactStatTone = 'primary' | 'warning' | 'accent' | 'success' | 'info';

export interface CompactStatItem {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: CompactStatTone;
}

interface CompactStatsProps {
  items: CompactStatItem[];
  className?: string;
}

export function CompactStats({ items, className }: CompactStatsProps) {
  return (
    <div className={cx(styles.strip, className)}>
      {items.map((item) => (
        <div className={styles.item} key={item.label}>
          <span
            className={styles.icon}
            data-tone={item.tone ?? 'primary'}
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <div>
            <p className={styles.label}>{item.label}</p>
            <p className={styles.value}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
