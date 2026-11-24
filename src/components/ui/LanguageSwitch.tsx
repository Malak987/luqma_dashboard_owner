import { useI18n } from '../../i18n/context';
import { cx } from '../../lib/cx';
import styles from './LanguageSwitch.module.css';

interface LanguageSwitchProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function LanguageSwitch({ className, size = 'sm' }: LanguageSwitchProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={cx(styles.switch, styles[size], className)}
      role="group"
      aria-label={t('a11y.switchLanguage')}
    >
      <button
        type="button"
        className={cx(styles.option, locale === 'en' && styles.active)}
        aria-pressed={locale === 'en'}
        aria-label={t('a11y.languageEnglish')}
        title={t('a11y.languageEnglish')}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={cx(styles.option, locale === 'ar' && styles.active)}
        aria-pressed={locale === 'ar'}
        aria-label={t('a11y.languageArabic')}
        title={t('a11y.languageArabic')}
        onClick={() => setLocale('ar')}
      >
        ع
      </button>
    </div>
  );
}
