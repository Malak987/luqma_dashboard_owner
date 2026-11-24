import {
  Boxes,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { categories, topCategories } from '../../data/mock';
import type { Category } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { useToast } from '../../components/feedback/ToastContext';
import { formatNumber, formatPercent, localized } from '../../lib/format';
import { categoryIconMap } from '../../lib/categoryIcons';
import { Badge } from '../../components/ui/Primitives';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { CompactStats } from '../../components/ui/CompactStats';
import { PageHeader, SectionCard } from '../../components/ui/Panel';
import { HorizontalBars } from '../../components/charts/HorizontalBars';
import styles from './CategoriesPage.module.css';

const toneColor: Record<Category['tone'], string> = {
  0: 'var(--primary)',
  1: 'var(--accent)',
  2: 'var(--status-preparing)',
  3: 'var(--status-on-the-way)',
};

export default function CategoriesPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const totalItems = categories.reduce((sum, category) => sum + category.items, 0);
  const activeCount = categories.filter((category) => category.status === 'active').length;

  return (
    <div>
      <PageHeader
        eyebrow={t('categories.eyebrow')}
        title={t('categories.title')}
        description={t('categories.subtitle')}
        actions={
          <Button
            icon={<Plus size={16} strokeWidth={2} aria-hidden="true" />}
            onClick={() => toast(t('categories.newToast'))}
          >
            {t('categories.newCategory')}
          </Button>
        }
      />

      <CompactStats
        items={[
          {
            icon: <Boxes size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('nav.categories'),
            value: formatNumber(categories.length, locale),
          },
          {
            icon: <CheckCircle2 size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('categories.statusActive'),
            value: formatNumber(activeCount, locale),
            tone: 'success',
          },
          {
            icon: <UtensilsCrossed size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('categories.totalItems'),
            value: formatNumber(totalItems, locale),
            tone: 'accent',
          },
        ]}
      />

      <SectionCard
        title={t('categories.performanceTitle')}
        subtitle={t('categories.performanceSubtitle')}
        className={styles.performance}
        action={
          <Badge tone="neutral">
            {t('reports.totalOrders')} · {formatNumber(1284, locale)}
          </Badge>
        }
      >
        <HorizontalBars
          locale={locale}
          items={topCategories.map((category) => ({
            label: localized(category.name, locale),
            value: category.orders,
            share: category.share,
            color: toneColor[category.tone],
          }))}
          formatValue={(item) =>
            formatPercent(item.share, locale, { signDisplay: 'never' })
          }
        />
      </SectionCard>

      <div className={styles.grid}>
        {categories.map((category) => {
          const Icon = categoryIconMap[category.icon];
          const active = category.status === 'active';
          return (
            <article className={styles.card} key={category.id}>
              <div className={styles.cardTop}>
                <span className={styles.iconTile} data-tone={category.tone} aria-hidden="true">
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <Badge tone={active ? 'success' : 'neutral'} dot>
                  {active ? t('categories.statusActive') : t('categories.statusHidden')}
                </Badge>
              </div>
              <h3 className={styles.name}>{localized(category.name, locale)}</h3>
              <p className={styles.items}>{t('categories.itemsCount', { count: category.items })}</p>
              <div className={styles.shareRow}>
                <span className={styles.shareLabel}>{t('categories.ofTotal')}</span>
                <span className={styles.shareValue}>
                  {formatPercent(category.share, locale, { signDisplay: 'never' })}
                </span>
              </div>
              <div className={styles.track}>
                <span
                  className={styles.fill}
                  style={{
                    width: `${category.share}%`,
                    background: toneColor[category.tone],
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.actions}>
                  <IconButton
                    label={t('categories.edit')}
                    size="sm"
                    onClick={() => toast(t('common.previewAction'))}
                  >
                    <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={t('categories.delete')}
                    size="sm"
                    onClick={() => toast(t('categories.deleteToast'))}
                  >
                    <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                  </IconButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
