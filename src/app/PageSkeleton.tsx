import { useI18n } from '../i18n/context';
import styles from './PageSkeleton.module.css';

export function PageSkeleton() {
  const { t } = useI18n();

  return (
    <div className={styles.wrap} aria-busy="true" aria-label={t('common.loading')}>
      <div className={styles.header}>
        <span className={styles.eyebrow} />
        <span className={styles.title} />
        <span className={styles.subtitle} />
      </div>
      <div className={styles.stats}>
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className={styles.stat} />
        ))}
      </div>
      <div className={styles.mainGrid}>
        <span className={styles.chart} />
        <span className={styles.side} />
      </div>
      <span className={styles.table} />
    </div>
  );
}
