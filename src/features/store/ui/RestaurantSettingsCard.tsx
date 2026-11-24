import { LockKeyhole, ShieldAlert, Store } from 'lucide-react';
import { Badge } from '../../../components/ui/Primitives';
import { SectionCard } from '../../../components/ui/Panel';
import { useI18n } from '../../../i18n/context';
import styles from './RestaurantSettingsCard.module.css';

/**
 * Store editing is intentionally represented in the dashboard even while it
 * is unavailable. There is no safe source for a verified Owner-to-Store scope,
 * and the reviewed backend implementation authorizes Store Update/UploadIcon
 * for Admin/SuperAdmin rather than Owner.
 */
export function RestaurantSettingsCard() {
  const { t } = useI18n();

  return (
    <SectionCard
      title={t('settings.restaurantTitle')}
      subtitle={t('settings.restaurantSubtitle')}
      className={styles.card}
      action={<Badge tone="warning">{t('settings.restaurantUnavailable')}</Badge>}
    >
      <div className={styles.scopeState} role="status">
        <span className={styles.scopeIcon} aria-hidden="true">
          <LockKeyhole size={19} strokeWidth={1.8} />
        </span>
        <div className={styles.scopeCopy}>
          <div className={styles.scopeTitleRow}>
            <Store size={15} strokeWidth={1.8} aria-hidden="true" />
            <p className={styles.scopeTitle}>{t('settings.restaurantBlockedTitle')}</p>
          </div>
          <p className={styles.scopeBody}>{t('settings.restaurantBlockedBody')}</p>
        </div>
      </div>

      <div className={styles.scopeList}>
        <div className={styles.scopeRow}>
          <span className={styles.scopeRowIcon} aria-hidden="true">
            <ShieldAlert size={15} strokeWidth={1.8} />
          </span>
          <div>
            <p className={styles.scopeLabel}>{t('settings.restaurantScopeLabel')}</p>
            <p className={styles.scopeValue}>{t('settings.restaurantScopeMissing')}</p>
          </div>
        </div>
        <div className={styles.scopeRow}>
          <span className={styles.scopeRowIcon} aria-hidden="true">
            <ShieldAlert size={15} strokeWidth={1.8} />
          </span>
          <div>
            <p className={styles.scopeLabel}>{t('settings.restaurantPermissionLabel')}</p>
            <p className={styles.scopeValue}>{t('settings.restaurantPermissionMissing')}</p>
          </div>
        </div>
      </div>

      <p className={styles.contractNote}>{t('settings.restaurantContractNote')}</p>
    </SectionCard>
  );
}
