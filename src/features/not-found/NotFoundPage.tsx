import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { ButtonLink } from '../../components/ui/Button';
import { useI18n } from '../../i18n/context';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <div className={styles.logo}>
        <Logo />
      </div>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p className={styles.body}>{t('notFound.body')}</p>
      <ButtonLink
        to="/"
        size="sm"
        icon={<ArrowLeft className="icon-directional" size={14} strokeWidth={2} aria-hidden="true" />}
      >
        {t('notFound.back')}
      </ButtonLink>
    </main>
  );
}
