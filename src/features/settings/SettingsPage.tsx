import { useState } from 'react';
import { Check, Info, KeyRound, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import { useToast } from '../../components/feedback/ToastContext';
import { cx } from '../../lib/cx';
import { Badge, Switch } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { PageHeader, SectionCard } from '../../components/ui/Panel';
import { ProfileSettingsCard } from '../profile/ui/ProfileSettingsCard';
import { RestaurantSettingsCard } from '../store/ui/RestaurantSettingsCard';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    weekly: true,
    updates: false,
  });

  return (
    <div>
      <PageHeader
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        description={t('settings.subtitle')}
        meta={<Badge tone="accent">{t('settings.previewBadge')}</Badge>}
      />

      <div className={styles.previewNote}>
        <Info size={15} strokeWidth={1.8} aria-hidden="true" />
        <p>{t('settings.previewNote')}</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.column}>
          <ProfileSettingsCard />
          <RestaurantSettingsCard />

          <SectionCard
            title={t('settings.notificationsTitle')}
            subtitle={t('settings.notificationsSubtitle')}
            className={styles.card}
          >
            <div className={styles.prefList}>
              {(
                [
                  ['email', 'settings.emailNotifications', 'settings.emailNotificationsDesc'],
                  ['push', 'settings.pushNotifications', 'settings.pushNotificationsDesc'],
                  ['weekly', 'settings.weeklySummary', 'settings.weeklySummaryDesc'],
                  ['updates', 'settings.productUpdates', 'settings.productUpdatesDesc'],
                ] as const
              ).map(([key, titleKey, descKey]) => (
                <div className={styles.prefRow} key={key}>
                  <div className={styles.prefCopy}>
                    <p className={styles.prefTitle}>{t(titleKey)}</p>
                    <p className={styles.prefDesc}>{t(descKey)}</p>
                  </div>
                  <Switch
                    checked={prefs[key]}
                    label={t(titleKey)}
                    onChange={(checked) =>
                      setPrefs((current) => ({ ...current, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className={styles.column}>
          <SectionCard
            title={t('settings.appearanceTitle')}
            subtitle={t('settings.appearanceSubtitle')}
            className={styles.card}
          >
            <div className={styles.themeGrid}>
              {(
                [
                  ['light', 'settings.themeLight', 'settings.themeLightDesc'],
                  ['dark', 'settings.themeDark', 'settings.themeDarkDesc'],
                ] as const
              ).map(([value, titleKey, descKey]) => (
                <button
                  key={value}
                  type="button"
                  className={cx(styles.themeOption, theme === value && styles.activeOption)}
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                >
                  <span className={styles.swatch} data-swatch={value} aria-hidden="true">
                    <span />
                    <span />
                  </span>
                  <span className={styles.optionCopy}>
                    <span className={styles.optionTitle}>{t(titleKey)}</span>
                    <span className={styles.optionDesc}>{t(descKey)}</span>
                  </span>
                  {theme === value && (
                    <Check className={styles.check} size={15} strokeWidth={2.2} aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>

            <div className={styles.subSection}>
              <h3 className={styles.subTitle}>{t('settings.languageTitle')}</h3>
              <p className={styles.subDesc}>{t('settings.languageSubtitle')}</p>
              <div className={styles.languageGrid}>
                {(
                  [
                    ['en', 'settings.languageEnglish', 'settings.languageEnglishDesc', 'Aa'],
                    ['ar', 'settings.languageArabic', 'settings.languageArabicDesc', 'ع'],
                  ] as const
                ).map(([value, titleKey, descKey, glyph]) => (
                  <button
                    key={value}
                    type="button"
                    className={cx(styles.languageOption, locale === value && styles.activeOption)}
                    aria-pressed={locale === value}
                    onClick={() => setLocale(value)}
                  >
                    <span className={styles.languageGlyph} aria-hidden="true">
                      {glyph}
                    </span>
                    <span className={styles.optionCopy}>
                      <span className={styles.optionTitle}>{t(titleKey)}</span>
                      <span className={styles.optionDesc}>{t(descKey)}</span>
                    </span>
                    {locale === value && (
                      <Check className={styles.check} size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t('settings.securityTitle')}
            subtitle={t('settings.securitySubtitle')}
            className={styles.card}
          >
            <div className={styles.securityList}>
              <div className={styles.securityRow}>
                <span className={styles.securityIcon} aria-hidden="true">
                  <KeyRound size={15} strokeWidth={1.8} />
                </span>
                <div className={styles.prefCopy}>
                  <p className={styles.prefTitle}>{t('settings.changePassword')}</p>
                  <p className={styles.prefDesc}>{t('settings.changePasswordDesc')}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast(t('settings.changePasswordToast'))}
                >
                  {t('settings.changePassword')}
                </Button>
              </div>

              <div className={styles.securityRow}>
                <span className={styles.securityIcon} aria-hidden="true">
                  <ShieldCheck size={15} strokeWidth={1.8} />
                </span>
                <div className={styles.prefCopy}>
                  <p className={styles.prefTitle}>{t('settings.twoFactor')}</p>
                  <p className={styles.prefDesc}>{t('settings.twoFactorDesc')}</p>
                </div>
                <Switch checked={false} disabled label={t('settings.twoFactor')} onChange={() => undefined} />
              </div>

              <div className={styles.securityRow}>
                <span className={styles.securityIcon} aria-hidden="true">
                  <MonitorSmartphone size={15} strokeWidth={1.8} />
                </span>
                <div className={styles.prefCopy}>
                  <p className={styles.prefTitle}>{t('settings.sessions')}</p>
                  <p className={styles.prefDesc}>{t('settings.sessionsDesc')}</p>
                </div>
                <Badge tone="neutral">{t('common.preview')}</Badge>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
