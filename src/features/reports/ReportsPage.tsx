import { useState } from 'react';
import { Clock3, Download, Flame, Leaf, ReceiptText, Repeat2, ShoppingBag, Wallet } from 'lucide-react';
import {
  revenueSeries,
  statusDistribution,
  topCategories,
  weeklyOrders,
} from '../../data/mock';
import { useI18n } from '../../i18n/context';
import { useToast } from '../../components/feedback/ToastContext';
import {
  formatChartDay,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatShortDate,
  localized,
} from '../../lib/format';
import { orderStatusMeta } from '../../lib/status';
import { Badge, SegmentedControl } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { PageHeader, SectionCard } from '../../components/ui/Panel';
import { StatCard } from '../../components/ui/StatCard';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { StatusDonut } from '../../components/charts/StatusDonut';
import { OrdersBarChart } from '../../components/charts/OrdersBarChart';
import { HorizontalBars } from '../../components/charts/HorizontalBars';
import styles from './ReportsPage.module.css';

const insightIcons = [Clock3, Flame, Leaf];

export default function ReportsPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const series = revenueSeries[range];

  const insights = [
    { title: t('reports.insight1Title'), body: t('reports.insight1Body') },
    { title: t('reports.insight2Title'), body: t('reports.insight2Body') },
    { title: t('reports.insight3Title'), body: t('reports.insight3Body') },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t('reports.eyebrow')}
        title={t('reports.title')}
        description={t('reports.subtitle')}
        meta={<Badge tone="accent">{t('common.sampleData')}</Badge>}
        actions={
          <>
            <SegmentedControl
              size="sm"
              ariaLabel={t('reports.title')}
              value={range}
              onChange={setRange}
              options={[
                { value: '7d', label: t('reports.range7') },
                { value: '30d', label: t('reports.range30') },
                { value: '90d', label: t('reports.range90') },
              ]}
            />
            <Button
              variant="secondary"
              icon={<Download size={15} strokeWidth={1.8} aria-hidden="true" />}
              onClick={() => toast(t('reports.exportToast'))}
            >
              {t('reports.export')}
            </Button>
          </>
        }
      />

      <div className={styles.statsGrid}>
        <StatCard
          label={t('reports.kpiRevenue')}
          value={formatCurrency(184250, locale)}
          delta={12.4}
          icon={<Wallet size={18} strokeWidth={1.8} aria-hidden="true" />}
          tone="primary"
          spark={[22, 26, 24, 29, 27, 34, 38, 36, 42, 47, 44, 52]}
          hint={t('reports.vsPrevious')}
        />
        <StatCard
          label={t('reports.kpiOrders')}
          value={formatNumber(1284, locale)}
          delta={8.1}
          icon={<ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />}
          tone="accent"
          spark={[18, 22, 20, 26, 24, 30, 28, 34, 33, 38, 42, 45]}
          sparkTone="accent"
          hint={t('reports.vsPrevious')}
        />
        <StatCard
          label={t('reports.kpiAverage')}
          value={formatCurrency(143.5, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          delta={-2.3}
          icon={<ReceiptText size={18} strokeWidth={1.8} aria-hidden="true" />}
          tone="info"
          spark={[48, 46, 49, 47, 45, 46, 44, 45, 43, 44, 42, 43]}
          sparkTone="info"
          hint={t('reports.vsPrevious')}
        />
        <StatCard
          label={t('reports.kpiRepeat')}
          value={formatPercent(38.2, locale, { signDisplay: 'never' })}
          delta={4.1}
          icon={<Repeat2 size={18} strokeWidth={1.8} aria-hidden="true" />}
          tone="success"
          spark={[28, 30, 29, 32, 31, 34, 33, 36, 35, 37, 38, 38]}
          sparkTone="success"
          hint={t('reports.vsPrevious')}
        />
      </div>

      <div className={styles.row}>
        <SectionCard
          title={t('reports.revenueTitle')}
          subtitle={t('reports.revenueSubtitle')}
          className={styles.chartCard}
          action={
            <Badge tone="neutral">
              {t('reports.totalOrders')} · {formatNumber(1284, locale)}
            </Badge>
          }
        >
          <RevenueChart
            labels={series.labels}
            current={series.current}
            previous={series.previous}
            formatX={range === '7d' ? (label) => formatChartDay(label, locale) : (label) => formatShortDate(label, locale)}
            formatY={(value) => formatNumber(value, locale, { notation: 'compact', maximumFractionDigits: 0 })}
            formatValue={(value) => formatCurrency(value, locale)}
            ariaLabel={t('chart.ariaRevenue')}
          />
        </SectionCard>

        <SectionCard
          title={t('reports.statusTitle')}
          subtitle={t('reports.statusSubtitle')}
          className={styles.donutCard}
        >
          <StatusDonut
            slices={statusDistribution.map((slice) => ({
              label: t(orderStatusMeta[slice.status].labelKey),
              count: slice.count,
              color: orderStatusMeta[slice.status].color,
            }))}
            centerLabel={t('reports.totalOrders')}
            ariaLabel={t('reports.statusTitle')}
          />
        </SectionCard>
      </div>

      <div className={styles.row}>
        <SectionCard
          title={t('reports.ordersTitle')}
          subtitle={t('reports.ordersSubtitle')}
          className={styles.barCard}
        >
          <OrdersBarChart
            labels={weeklyOrders.labels}
            values={weeklyOrders.values}
            formatX={(label) => formatChartDay(label, locale)}
            formatY={(value) => formatNumber(value, locale)}
            ariaLabel={t('chart.ariaOrders')}
          />
        </SectionCard>

        <SectionCard
          title={t('reports.categoriesTitle')}
          subtitle={t('reports.categoriesSubtitle')}
          className={styles.categoryCard}
        >
          <HorizontalBars
            locale={locale}
            items={topCategories.map((category) => ({
              label: localized(category.name, locale),
              value: category.orders,
              share: category.share,
            }))}
            formatValue={(item) =>
              formatPercent(item.share, locale, { signDisplay: 'never' })
            }
          />
        </SectionCard>
      </div>

      <SectionCard
        title={t('reports.insightsTitle')}
        subtitle={t('reports.insightsSubtitle')}
        className={styles.insights}
      >
        <div className={styles.insightGrid}>
          {insights.map((insight, index) => {
            const Icon = insightIcons[index];
            return (
              <article className={styles.insight} key={insight.title}>
                <span className={styles.insightIcon} aria-hidden="true">
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <h3 className={styles.insightTitle}>{insight.title}</h3>
                <p className={styles.insightBody}>{insight.body}</p>
              </article>
            );
          })}
        </div>
        <p className={styles.sampleNote}>{t('reports.sampleNote')}</p>
      </SectionCard>
    </div>
  );
}
