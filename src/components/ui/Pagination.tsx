import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { formatNumber } from '../../lib/format';
import { Button } from './Button';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  from: number;
  to: number;
  total: number;
}

export function Pagination({ page, pageCount, onPageChange, from, to, total }: PaginationProps) {
  const { t, locale } = useI18n();

  return (
    <nav className={styles.pagination} aria-label={t('common.page')}>
      <p className={styles.summary}>
        {t('common.showing', {
          from: formatNumber(from, locale),
          to: formatNumber(to, locale),
          total: formatNumber(total, locale),
        })}
      </p>
      <div className={styles.controls}>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={
            <ChevronLeft
              className="icon-directional"
              size={14}
              strokeWidth={2}
              aria-hidden="true"
            />
          }
        >
          {t('common.previous')}
        </Button>
        <span className={styles.pageIndicator}>
          {t('common.page')} {formatNumber(page, locale)} / {formatNumber(pageCount, locale)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          iconEnd={
            <ChevronRight
              className="icon-directional"
              size={14}
              strokeWidth={2}
              aria-hidden="true"
            />
          }
        >
          {t('common.next')}
        </Button>
      </div>
    </nav>
  );
}
