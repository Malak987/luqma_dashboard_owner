import { LockKeyhole } from 'lucide-react';
import { EmptyState, PageHeader } from '../../components/ui/Panel';
import { useI18n } from '../../i18n/context';
import styles from './CategoriesPage.module.css';

/**
 * Menu-category operations stay unavailable until the API supplies a verified
 * Owner-to-store mapping. In particular, this page must not fall back to the
 * old platform-wide mock category data or accept a storeId from the browser.
 */
export default function CategoriesPage() {
  const { t } = useI18n();

  return (
    <div>
      <PageHeader
        eyebrow={t('categories.eyebrow')}
        title={t('categories.title')}
        description={t('categories.subtitle')}
      />

      <div className={styles.blockedState} role="status">
        <EmptyState
          icon={<LockKeyhole size={22} strokeWidth={1.8} aria-hidden="true" />}
          title={t('categories.ownerOnlyTitle')}
          body={t('categories.ownerOnlyBody')}
        />
        <p className={styles.contractNote}>{t('categories.ownerOnlyContract')}</p>
      </div>
    </div>
  );
}
