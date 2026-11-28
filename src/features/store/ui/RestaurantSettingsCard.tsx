import {
  AlertTriangle,
  Clock,
  Info,
  MapPin,
  Phone,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Primitives';
import { SectionCard } from '../../../components/ui/Panel';
import { useI18n } from '../../../i18n/context';
import { ApiError } from '../../../lib/api/errors';
import {
  formatStoreTime,
  getStoreDescription,
  getStoreMainCategory,
  getStoreName,
} from '../domain/store';
import { useStore } from '../session/context';
import { StoreLogo } from './StoreLogo';
import styles from './RestaurantSettingsCard.module.css';

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

/**
 * Displays the authenticated Owner's restaurant details returned by
 * GET /api/Store/GetById/{id} in read-only mode. Store Update, UploadIcon, and
 * SetActive are intentionally not exposed in this task.
 */
export function RestaurantSettingsCard() {
  const { t, locale } = useI18n();
  const { store, status, error, reload } = useStore();

  if (status === 'loading' || status === 'idle') {
    return (
      <SectionCard
        title={t('settings.restaurantTitle')}
        subtitle={t('settings.restaurantSubtitle')}
        className={styles.card}
      >
        <div className={styles.loading} aria-busy="true" aria-label={t('store.loading')}>
          <span className={styles.skeletonAvatar} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLineShort} />
        </div>
      </SectionCard>
    );
  }

  if (status === 'error' || !store) {
    const keys = errorMessageKeys(error);
    return (
      <SectionCard
        title={t('settings.restaurantTitle')}
        subtitle={t('settings.restaurantSubtitle')}
        className={styles.card}
      >
        <div className={styles.loadError} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">
            <AlertTriangle size={18} strokeWidth={1.8} />
          </span>
          <div>
            <p className={styles.errorTitle}>{t(keys.title)}</p>
            <p className={styles.errorBody}>{t(keys.body)}</p>
          </div>
        </div>
        <div className={styles.errorActions}>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => void reload()}
          >
            {t('store.retry')}
          </Button>
        </div>
      </SectionCard>
    );
  }

  const name = getStoreName(store, locale);
  const description = getStoreDescription(store, locale);
  const mainCategory = getStoreMainCategory(store, locale);
  const openFormatted = formatStoreTime(store.openTime, locale);
  const closeFormatted = formatStoreTime(store.closeTime, locale);

  return (
    <SectionCard
      title={t('settings.restaurantTitle')}
      subtitle={t('settings.restaurantSubtitle')}
      className={styles.card}
      action={<Badge tone="neutral">{t('store.managedByAdminBadge')}</Badge>}
    >
      <div className={styles.storeHead}>
        <StoreLogo name={name} iconUrl={store.iconUrl} size="lg" />
        <div className={styles.storeCopy}>
          <p className={styles.storeName} dir="auto">
            {name}
          </p>
          <div className={styles.badges}>
            <Badge tone={store.isActive ? 'success' : 'neutral'} dot>
              {store.isActive ? t('store.statusActive') : t('store.statusInactive')}
            </Badge>
            {store.isOpenNow !== null && (
              <Badge tone={store.isOpenNow ? 'info' : 'warning'} dot>
                {store.isOpenNow ? t('store.statusOpen') : t('store.statusClosed')}
              </Badge>
            )}
          </div>
          {description && (
            <p className={styles.storeDescription} dir="auto">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className={styles.scopeList}>
        {mainCategory && (
          <div className={styles.scopeRow}>
            <span className={styles.scopeRowIcon} aria-hidden="true">
              <Tag size={15} strokeWidth={1.8} />
            </span>
            <div>
              <p className={styles.scopeLabel}>{t('store.mainCategory')}</p>
              <p className={styles.scopeValue} dir="auto">
                {mainCategory}
              </p>
            </div>
          </div>
        )}

        {store.address && (
          <div className={styles.scopeRow}>
            <span className={styles.scopeRowIcon} aria-hidden="true">
              <MapPin size={15} strokeWidth={1.8} />
            </span>
            <div>
              <p className={styles.scopeLabel}>{t('store.address')}</p>
              <p className={styles.scopeValue} dir="auto">
                {store.address}
              </p>
            </div>
          </div>
        )}

        {store.phoneNumber && (
          <div className={styles.scopeRow}>
            <span className={styles.scopeRowIcon} aria-hidden="true">
              <Phone size={15} strokeWidth={1.8} />
            </span>
            <div>
              <p className={styles.scopeLabel}>{t('store.phone')}</p>
              <p className={styles.scopeValue} dir="ltr">
                {store.phoneNumber}
              </p>
            </div>
          </div>
        )}

        {openFormatted && closeFormatted && (
          <div className={styles.scopeRow}>
            <span className={styles.scopeRowIcon} aria-hidden="true">
              <Clock size={15} strokeWidth={1.8} />
            </span>
            <div>
              <p className={styles.scopeLabel}>{t('store.hours')}</p>
              <p className={styles.scopeValue}>
                {openFormatted} — {closeFormatted}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className={styles.contractNote}>
        <Info size={13} strokeWidth={1.8} aria-hidden="true" />
        <span>{t('store.readOnlyNote')}</span>
      </p>
    </SectionCard>
  );
}
