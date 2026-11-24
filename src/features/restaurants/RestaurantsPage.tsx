import { useDeferredValue, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  MoreHorizontal,
  Plus,
  SearchX,
  Star,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { restaurants, restaurantDetailStats } from '../../data/mock';
import type { Restaurant, RestaurantStatus } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { useToast } from '../../components/feedback/ToastContext';
import { formatCurrency, formatNumber, formatPercent, formatRating, localized } from '../../lib/format';
import { restaurantStatusMeta } from '../../lib/status';
import { Avatar, SegmentedControl, StatusBadge } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { CompactStats } from '../../components/ui/CompactStats';
import { EmptyState, PageHeader } from '../../components/ui/Panel';
import { SearchBox } from '../../components/ui/SearchBox';
import { Select } from '../../components/ui/Field';
import styles from './RestaurantsPage.module.css';

type StatusFilter = RestaurantStatus | 'all';
type SortKey = 'revenue' | 'rating' | 'orders';

export default function RestaurantsPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('revenue');
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return restaurants
      .filter((restaurant) => {
        if (status !== 'all' && restaurant.status !== status) {
          return false;
        }
        if (!query) {
          return true;
        }
        return [restaurant.name.en, restaurant.name.ar, restaurant.cuisine.en, restaurant.cuisine.ar]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => b[sort] - a[sort]);
  }, [deferredSearch, sort, status]);

  const counts = useMemo(
    () => ({
      all: restaurants.length,
      active: restaurants.filter((restaurant) => restaurant.status === 'active').length,
      pending: restaurants.filter((restaurant) => restaurant.status === 'pending').length,
      paused: restaurants.filter((restaurant) => restaurant.status === 'paused').length,
    }),
    [],
  );

  return (
    <div>
      <PageHeader
        eyebrow={t('restaurants.eyebrow')}
        title={t('restaurants.title')}
        description={t('restaurants.subtitle')}
        actions={
          <Button
            icon={<Plus size={16} strokeWidth={2} aria-hidden="true" />}
            onClick={() => toast(t('restaurants.addToast'))}
          >
            {t('restaurants.addRestaurant')}
          </Button>
        }
      />

      <CompactStats
        items={[
          {
            icon: <Store size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('restaurants.statActive'),
            value: formatNumber(restaurantDetailStats.active, locale),
          },
          {
            icon: <Building2 size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('restaurants.statPending'),
            value: formatNumber(restaurantDetailStats.pending, locale),
            tone: 'warning',
          },
          {
            icon: <Star size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('restaurants.statRating'),
            value: formatRating(restaurantDetailStats.averageRating, locale),
            tone: 'accent',
          },
        ]}
      />

      <div className={styles.filters}>
        <SearchBox
          className={styles.search}
          value={search}
          onChange={setSearch}
          placeholder={t('restaurants.searchPlaceholder')}
          ariaLabel={t('a11y.search')}
        />
        <SegmentedControl
          ariaLabel={t('restaurants.filterAll')}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: t('restaurants.filterAll'), count: counts.all },
            { value: 'active', label: t('restaurants.filterActive'), count: counts.active },
            { value: 'pending', label: t('restaurants.filterPending'), count: counts.pending },
            { value: 'paused', label: t('restaurants.filterPaused'), count: counts.paused },
          ]}
        />
        <Select
          hideLabel
          label={t('restaurants.sortBy')}
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          options={[
            { value: 'revenue', label: t('restaurants.sortRevenue') },
            { value: 'rating', label: t('restaurants.sortRating') },
            { value: 'orders', label: t('restaurants.sortOrders') },
          ]}
          containerClassName={styles.sort}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX size={22} strokeWidth={1.8} aria-hidden="true" />}
          title={t('restaurants.noResultsTitle')}
          body={t('restaurants.noResultsBody')}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('all');
              }}
            >
              {t('orders.clearFilters')}
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {filtered.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onOpen={() => toast(t('restaurants.previewToast'))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantCard({
  restaurant,
  onOpen,
}: {
  restaurant: Restaurant;
  onOpen: () => void;
}) {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  return (
    <article className={styles.card}>
      <div className={styles.cover} data-tone={restaurant.tone}>
        <span className={styles.coverPattern} aria-hidden="true" />
        <UtensilsCrossed className={styles.coverIcon} size={94} strokeWidth={1} aria-hidden="true" />
        <span className={styles.statusPill}>
          <StatusBadge meta={restaurantStatusMeta[restaurant.status]} />
        </span>
        <span className={styles.avatarWrap}>
          <Avatar name={localized(restaurant.name, locale)} tone={restaurant.tone} size="lg" />
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          <div className={styles.titleCopy}>
            <h3 className={styles.name}>{localized(restaurant.name, locale)}</h3>
            <p className={styles.meta}>
              {localized(restaurant.cuisine, locale)} · {localized(restaurant.location, locale)}
            </p>
          </div>
          <button
            type="button"
            className={styles.more}
            onClick={() => toast(t('common.previewAction'))}
            aria-label={t('common.more')}
            title={t('common.more')}
          >
            <MoreHorizontal size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.ratingRow}>
          <span className={styles.rating}>
            <Star size={13} strokeWidth={1.8} fill="currentColor" aria-hidden="true" />
            {formatRating(restaurant.rating, locale)}
          </span>
          <span className={restaurant.growth >= 0 ? styles.growthUp : styles.growthDown}>
            {formatPercent(restaurant.growth, locale)}
          </span>
        </div>

        <div className={styles.metrics}>
          <div>
            <span className={styles.metricLabel}>{t('restaurants.orders')}</span>
            <span className={styles.metricValue}>{formatNumber(restaurant.orders, locale)}</span>
          </div>
          <div>
            <span className={styles.metricLabel}>{t('restaurants.revenue')}</span>
            <span className={styles.metricValue}>{formatCurrency(restaurant.revenue, locale)}</span>
          </div>
          <div>
            <span className={styles.metricLabel}>{t('restaurants.branches')}</span>
            <span className={styles.metricValue}>{formatNumber(restaurant.branches, locale)}</span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.branches}>
            <Building2 size={12} strokeWidth={1.8} aria-hidden="true" />
            {t('restaurants.branchesCount', { count: restaurant.branches })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpen}
            iconEnd={<ArrowRight className="icon-directional" size={13} strokeWidth={1.9} aria-hidden="true" />}
          >
            {t('restaurants.viewDetails')}
          </Button>
        </div>
      </div>
    </article>
  );
}
