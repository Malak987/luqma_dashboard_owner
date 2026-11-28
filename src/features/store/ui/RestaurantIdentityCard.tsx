import {
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Star,
  Store,
  Tag,
  Truck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Panel } from '../../../components/ui/Panel';
import { Badge } from '../../../components/ui/Primitives';
import { useI18n } from '../../../i18n/context';
import { ApiError } from '../../../lib/api/errors';
import { formatCurrency, formatNumber, formatRating } from '../../../lib/format';
import {
  formatStoreTime,
  getStoreDescription,
  getStoreMainCategory,
  getStoreName,
} from '../domain/store';
import { useStore } from '../session/context';
import { StoreLogo } from './StoreLogo';
import styles from './RestaurantIdentityCard.module.css';

function errorMessageKeys(error: unknown) {
  if (error instanceof ApiError) {
    if (error.kind === 'forbidden' || error.kind === 'ownership-unverified') {
      return {
        title: 'store.forbiddenTitle' as const,
        body: 'store.forbiddenBody' as const,
      };
    }
    if (error.status === 404) {
      return {
        title: 'store.notFoundTitle' as const,
        body: 'store.notFoundBody' as const,
      };
    }
  }
  return {
    title: 'store.loadErrorTitle' as const,
    body: 'store.loadErrorBody' as const,
  };
}

export function RestaurantIdentityCard() {
  const { t, locale } = useI18n();
  const { store, status, error, reload } = useStore();

  if (status === 'loading' || status === 'idle') {
    return (
      <Panel className={styles.banner}>
        <div className={styles.loading} aria-busy="true" aria-label={t('store.loading')}>
          <span className={styles.skeletonLogo} />
          <div className={styles.skeletonBody}>
            <span className={styles.skeletonTitle} />
            <span className={styles.skeletonSubtitle} />
          </div>
        </div>
      </Panel>
    );
  }

  if (status === 'error' || !store) {
    const keys = errorMessageKeys(error);
    return (
      <Panel className={styles.banner}>
        <div className={styles.errorState} role="alert">
          <div className={styles.errorCopy}>
            <span className={styles.errorIcon} aria-hidden="true">
              <AlertTriangle size={18} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className={styles.errorTitle}>{t(keys.title)}</h2>
              <p className={styles.errorBody}>{t(keys.body)}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => void reload()}
          >
            {t('store.retry')}
          </Button>
        </div>
      </Panel>
    );
  }

  const name = getStoreName(store, locale);
  const description = getStoreDescription(store, locale);
  const mainCategory = getStoreMainCategory(store, locale);
  const openFormatted = formatStoreTime(store.openTime, locale);
  const closeFormatted = formatStoreTime(store.closeTime, locale);

  return (
    <Panel className={styles.banner}>
      <div className={styles.top}>
        <div className={styles.identity}>
          <StoreLogo name={name} iconUrl={store.iconUrl} size="lg" />
          <div className={styles.headingCopy}>
            <p className={styles.eyebrow}>
              <Store size={12} strokeWidth={1.9} aria-hidden="true" />
              {t('store.yourRestaurant')}
            </p>
            <div className={styles.titleRow}>
              <h2 className={styles.name} dir="auto">
                {name}
              </h2>
              <Badge tone={store.isActive ? 'success' : 'neutral'} dot>
                {store.isActive ? t('store.statusActive') : t('store.statusInactive')}
              </Badge>
              {store.isOpenNow !== null && (
                <Badge tone={store.isOpenNow ? 'info' : 'warning'} dot>
                  {store.isOpenNow ? t('store.statusOpen') : t('store.statusClosed')}
                </Badge>
              )}
              {mainCategory && (
                <Badge tone="accent">
                  <Tag size={11} strokeWidth={1.9} aria-hidden="true" />
                  {mainCategory}
                </Badge>
              )}
            </div>
            {description && (
              <p className={styles.description} dir="auto">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <dl className={styles.metaGrid}>
        {store.address && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>
              <MapPin size={13} strokeWidth={1.8} aria-hidden="true" />
              {t('store.address')}
            </dt>
            <dd className={styles.metaValue} dir="auto">
              {store.address}
            </dd>
          </div>
        )}

        {store.phoneNumber && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>
              <Phone size={13} strokeWidth={1.8} aria-hidden="true" />
              {t('store.phone')}
            </dt>
            <dd className={styles.metaValue} dir="ltr">
              {store.phoneNumber}
            </dd>
          </div>
        )}

        {openFormatted && closeFormatted && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>
              <Clock size={13} strokeWidth={1.8} aria-hidden="true" />
              {t('store.hours')}
            </dt>
            <dd className={styles.metaValue}>
              {openFormatted} — {closeFormatted}
            </dd>
          </div>
        )}

        {store.averageRating !== null && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>
              <Star size={13} strokeWidth={1.8} aria-hidden="true" />
              {t('store.rating')}
            </dt>
            <dd className={styles.metaValue}>
              {formatRating(store.averageRating, locale)}
              {store.ratingsCount !== null && (
                <span className={styles.metaSecondary}>
                  {' '}
                  · {t('store.reviewsCount', { count: formatNumber(store.ratingsCount, locale) })}
                </span>
              )}
            </dd>
          </div>
        )}

        {(store.deliveryTimeMinutes !== null || store.deliveryFee !== null) && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>
              <Truck size={13} strokeWidth={1.8} aria-hidden="true" />
              {t('store.deliveryFee')}
            </dt>
            <dd className={styles.metaValue}>
              {store.deliveryFee !== null
                ? store.deliveryFee === 0
                  ? t('store.freeDelivery')
                  : formatCurrency(store.deliveryFee, locale)
                : null}
              {store.deliveryFee !== null && store.deliveryTimeMinutes !== null && ' · '}
              {store.deliveryTimeMinutes !== null &&
                t('store.deliveryTime', {
                  minutes: formatNumber(store.deliveryTimeMinutes, locale),
                })}
            </dd>
          </div>
        )}
      </dl>
    </Panel>
  );
}
