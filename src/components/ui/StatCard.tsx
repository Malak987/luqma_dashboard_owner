import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { formatPercent } from '../../lib/format';
import { cx } from '../../lib/cx';
import { Sparkline } from '../charts/Sparkline';
import styles from './StatCard.module.css';

type StatTone = 'primary' | 'accent' | 'success' | 'info';

interface StatCardProps {
  label: string;
  value: string;
  delta: number;
  icon: ReactNode;
  tone?: StatTone;
  spark?: number[];
  sparkTone?: 'primary' | 'success' | 'accent' | 'danger' | 'info';
  hint?: string;
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = 'primary',
  spark,
  sparkTone = 'primary',
  hint,
}: StatCardProps) {
  const { locale, t } = useI18n();
  const positive = delta >= 0;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <p className={styles.label}>{label}</p>
        <span className={cx(styles.iconTile, styles[`tile_${tone}`])} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className={styles.value}>{value}</p>
      <div className={styles.footer}>
        <div className={styles.deltaWrap}>
          <span className={cx(styles.delta, positive ? styles.up : styles.down)}>
            <DeltaIcon size={13} strokeWidth={2.2} aria-hidden="true" />
            {formatPercent(delta, locale)}
          </span>
          <span className={styles.hint}>{hint ?? t('overview.vsPrevious')}</span>
        </div>
        {spark && spark.length > 1 && (
          <div className={styles.spark}>
            <Sparkline values={spark} tone={sparkTone} />
          </div>
        )}
      </div>
    </article>
  );
}
