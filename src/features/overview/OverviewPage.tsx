import { useState } from 'react';
import {
  Banknote,
  CalendarDays,
  Download,
  Eye,
  Info,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Store,
  TriangleAlert,
  UserPlus,
  Wallet,
} from 'lucide-react';
import {
  activity,
  kpis,
  recentOrders,
  revenueSeries,
  statusDistribution,
  topRestaurants,
} from '../../data/mock';
import type { Kpi, Order } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { useToast } from '../../components/feedback/ToastContext';
import {
  formatChartDay,
  formatCurrency,
  formatHour,
  formatNumber,
  formatPercent,
  formatRelativeMinutes,
  formatShortDate,
  localized,
} from '../../lib/format';
import { orderStatusMeta } from '../../lib/status';
import { Avatar, Badge, SegmentedControl, StatusBadge } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, SectionCard } from '../../components/ui/Panel';
import { StatCard } from '../../components/ui/StatCard';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { StatusDonut } from '../../components/charts/StatusDonut';
import { OrderDrawer } from '../orders/OrderDrawer';
import { RestaurantIdentityCard } from '../store/ui/RestaurantIdentityCard';
import type { TranslationKey } from '../../i18n/en';
import styles from './OverviewPage.module.css';

const kpiLabels: Record<Kpi['id'], TranslationKey> = {
  revenue: 'overview.kpiRevenue',
  orders: 'overview.kpiOrders',
  restaurants: 'overview.kpiRestaurants',
  average: 'overview.kpiAverage',
};

const kpiMeta = {
  revenue: { icon: Wallet, tone: 'primary', sparkTone: 'primary' },
  orders: { icon: ShoppingBag, tone: 'accent', sparkTone: 'accent' },
  restaurants: { icon: Store, tone: 'success', sparkTone: 'success' },
  average: { icon: ReceiptText, tone: 'info', sparkTone: 'info' },
} as const;

const activityIcons = {
  order: ShoppingBag,
  customer: UserPlus,
  restaurant: Store,
  payout: Banknote,
  alert: TriangleAlert,
};

const peakHours = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const peakValues = [38, 52, 61, 74, 88, 119, 148, 164, 152, 128];
const peakMax = Math.max(...peakValues);

export default function OverviewPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const series = revenueSeries[range];
  const topRevenue = topRestaurants[0]?.revenue ?? 1;
  const topActivity = activity.slice(0, 5);

  const formatKpiValue = (kpi: Kpi): string => {
    if (kpi.format === 'currency') {
      return kpi.id === 'average'
        ? formatCurrency(kpi.value, locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        : formatCurrency(kpi.value, locale);
    }
    if (kpi.format === 'decimal') {
      return formatNumber(kpi.value, locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    }
    return formatNumber(kpi.value, locale);
  };

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: t('orders.table.order'),
      render: (order) => (
        <div className={styles.orderCell}>
          <span className={styles.orderId}>{order.id}</span>
          <span className={styles.orderItems}>
            {t('common.items', { count: order.lines.length })}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: t('orders.table.customer'),
      render: (order) => (
        <div className={styles.customerCell}>
          <Avatar name={localized(order.customer, locale)} tone={0} size="sm" />
          <span>{localized(order.customer, locale)}</span>
        </div>
      ),
    },
    {
      key: 'restaurant',
      header: t('orders.table.restaurant'),
      render: (order) => localized(order.restaurant, locale),
    },
    {
      key: 'total',
      header: t('orders.table.total'),
      align: 'end',
      render: (order) => (
        <span className={styles.amount}>{formatCurrency(order.total, locale)}</span>
      ),
    },
    {
      key: 'status',
      header: t('orders.table.status'),
      render: (order) => <StatusBadge meta={orderStatusMeta[order.status]} />,
    },
    {
      key: 'time',
      header: t('orders.table.time'),
      align: 'end',
      render: (order) => (
        <span className={styles.time}>{formatRelativeMinutes(order.minutesAgo, locale)}</span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'end',
      render: (order) => (
        <IconButton
          label={t('orders.table.view')}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedOrder(order);
          }}
        >
          <Eye size={14} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t('overview.eyebrow')}
        title={t('overview.title')}
        description={t('overview.subtitle')}
        actions={
          <>
            <span className={styles.dateChip}>
              <CalendarDays size={14} strokeWidth={1.8} aria-hidden="true" />
              {formatShortDate('2026-11-17', locale)} — {formatShortDate('2026-11-23', locale)}
            </span>
            <Button
              variant="secondary"
              icon={<Download size={15} strokeWidth={1.8} aria-hidden="true" />}
              onClick={() => toast(t('overview.exportToast'))}
            >
              {t('overview.export')}
            </Button>
          </>
        }
      />

      <RestaurantIdentityCard />

      <section className={styles.sampleSection} aria-labelledby="overview-sample-title">
        <div className={styles.sampleHeader} role="note">
          <div className={styles.sampleHeading}>
            <span className={styles.sampleIcon} aria-hidden="true">
              <Info size={14} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className={styles.sampleTitle} id="overview-sample-title">
                {t('overview.sampleSectionTitle')}
              </h2>
              <p className={styles.sampleBody}>{t('overview.sampleSectionBody')}</p>
            </div>
          </div>
          <Badge tone="accent">{t('overview.sampleBadge')}</Badge>
        </div>

        <div className={styles.statsGrid}>
        {kpis.map((kpi) => {
          const meta = kpiMeta[kpi.id];
          const Icon = meta.icon;
          return (
            <StatCard
              key={kpi.id}
              label={t(kpiLabels[kpi.id])}
              value={formatKpiValue(kpi)}
              delta={kpi.delta}
              icon={<Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
              tone={meta.tone}
              spark={kpi.spark}
              sparkTone={meta.sparkTone}
            />
          );
        })}
      </div>

      <div className={styles.mainGrid}>
        <SectionCard
          title={t('overview.revenueTitle')}
          subtitle={t('overview.revenueSubtitle')}
          className={styles.revenueCard}
          action={
            <SegmentedControl
              size="sm"
              ariaLabel={t('overview.revenueTitle')}
              value={range}
              onChange={setRange}
              options={[
                { value: '7d', label: t('overview.range7') },
                { value: '30d', label: t('overview.range30') },
                { value: '90d', label: t('overview.range90') },
              ]}
            />
          }
        >
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} aria-hidden="true" />
              {t('overview.revenueLegend')}
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDash} aria-hidden="true" />
              {t('overview.previousLegend')}
            </span>
          </div>
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
          title={t('overview.statusTitle')}
          subtitle={t('overview.statusSubtitle')}
          className={styles.donutCard}
          bodyClassName={styles.donutBody}
        >
          <StatusDonut
            slices={statusDistribution.map((slice) => ({
              label: t(orderStatusMeta[slice.status].labelKey),
              count: slice.count,
              color: orderStatusMeta[slice.status].color,
            }))}
            centerLabel={t('overview.statusTotal')}
            ariaLabel={t('overview.statusTitle')}
          />
        </SectionCard>
      </div>

      <div className={styles.mainGrid}>
        <SectionCard
          title={t('overview.recentOrdersTitle')}
          subtitle={t('overview.recentOrdersSubtitle')}
          className={styles.ordersCard}
          bodyClassName={styles.tableBody}
          action={<Badge tone="accent">{t('overview.sampleBadge')}</Badge>}
        >
          <DataTable
            columns={columns}
            rows={recentOrders}
            rowKey={(order) => order.id}
            caption={t('overview.recentOrdersTitle')}
            onRowClick={setSelectedOrder}
            mobileCard={(order) => (
              <button
                type="button"
                className={styles.mobileOrder}
                onClick={() => setSelectedOrder(order)}
              >
                <span className={styles.mobileOrderTop}>
                  <span className={styles.orderId}>{order.id}</span>
                  <StatusBadge meta={orderStatusMeta[order.status]} />
                </span>
                <span className={styles.mobileOrderMid}>
                  <span>
                    <Avatar name={localized(order.customer, locale)} tone={0} size="sm" />
                    {localized(order.customer, locale)}
                  </span>
                  <span>{localized(order.restaurant, locale)}</span>
                </span>
                <span className={styles.mobileOrderBottom}>
                  <span className={styles.amount}>{formatCurrency(order.total, locale)}</span>
                  <span className={styles.time}>{formatRelativeMinutes(order.minutesAgo, locale)}</span>
                </span>
              </button>
            )}
          />
        </SectionCard>

        <SectionCard
          title={t('overview.topRestaurantsTitle')}
          subtitle={t('overview.topRestaurantsSubtitle')}
          className={styles.topCard}
        >
          <ul className={styles.restaurantList}>
            {topRestaurants.map((restaurant, index) => (
              <li className={styles.restaurantItem} key={restaurant.id}>
                <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
                <Avatar name={localized(restaurant.name, locale)} tone={restaurant.tone} />
                <div className={styles.restaurantCopy}>
                  <span className={styles.restaurantName}>{localized(restaurant.name, locale)}</span>
                  <span className={styles.restaurantMeta}>
                    {localized(restaurant.cuisine, locale)} · {t('overview.restaurantBranches', { count: restaurant.branches })}
                  </span>
                  <span className={styles.progress}>
                    <span
                      className={styles.progressFill}
                      style={{ width: `${Math.round((restaurant.revenue / topRevenue) * 100)}%` }}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <div className={styles.restaurantNumbers}>
                  <span className={styles.revenue}>{formatCurrency(restaurant.revenue, locale)}</span>
                  <span
                    className={restaurant.growth >= 0 ? styles.growthUp : styles.growthDown}
                  >
                    {formatPercent(restaurant.growth, locale)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className={styles.bottomGrid}>
        <SectionCard
          title={t('overview.activityTitle')}
          subtitle={t('overview.activitySubtitle')}
          className={styles.activityCard}
        >
          <ul className={styles.activityList}>
            {topActivity.map((item) => {
              const Icon = activityIcons[item.type];
              return (
                <li className={styles.activityItem} key={item.id}>
                  <span className={styles.activityIcon} data-type={item.type} aria-hidden="true">
                    <Icon size={14} strokeWidth={1.8} />
                  </span>
                  <p className={styles.activityText}>
                    <span className={styles.activityActor}>{localized(item.actor, locale)}</span>{' '}
                    {localized(item.action, locale)}{' '}
                    <span className={styles.activityTarget}>{localized(item.target, locale)}</span>
                  </p>
                  <time className={styles.activityTime}>
                    {formatRelativeMinutes(item.minutesAgo, locale)}
                  </time>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title={t('overview.peakTitle')}
          subtitle={t('overview.peakSubtitle')}
          className={styles.peakCard}
        >
          <div className={styles.peakChart}>
            {peakHours.map((hour, index) => (
              <div className={styles.peakBar} key={hour}>
                <span className={styles.peakTrack}>
                  <span
                    className={styles.peakFill}
                    data-active={peakValues[index] === peakMax || undefined}
                    style={{ height: `${Math.round((peakValues[index] / peakMax) * 100)}%` }}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.peakLabel}>{formatHour(hour, locale)}</span>
              </div>
            ))}
          </div>
          <p className={styles.peakNote}>
            <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
            {t('overview.peakLabel')}
          </p>
        </SectionCard>
      </div>
      </section>

      <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
