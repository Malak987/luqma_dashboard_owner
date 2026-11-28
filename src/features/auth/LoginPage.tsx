import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { BrandAnimation } from '../../components/brand/BrandAnimation';
import { Logo } from '../../components/brand/Logo';
import { Sparkline } from '../../components/charts/Sparkline';
import { Button } from '../../components/ui/Button';
import { LanguageSwitch } from '../../components/ui/LanguageSwitch';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Field';
import { useToast } from '../../components/feedback/ToastContext';
import { useI18n } from '../../i18n/context';
import type { TranslationKey } from '../../i18n/en';
import { formatCurrency, formatNumber } from '../../lib/format';
import { AuthError, isAuthFailureReason, safeReturnPath, type AuthFailureReason } from './domain/session';
import { useSession } from './session/context';
import styles from './LoginPage.module.css';

const errorKeys: Record<AuthFailureReason, TranslationKey> = {
  'invalid-credentials': 'login.errorInvalidCredentials',
  'role-not-allowed': 'login.errorRoleNotAllowed',
  'missing-store-id': 'login.errorMissingStoreId',
  'invalid-response': 'login.errorInvalidResponse',
  network: 'login.errorNetwork',
  timeout: 'login.errorTimeout',
  server: 'login.errorServer',
  unauthorized: 'login.errorSessionExpired',
  forbidden: 'login.errorForbidden',
  expired: 'login.errorSessionExpired',
  'invalid-session': 'login.errorGeneric',
  unknown: 'login.errorGeneric',
};

export default function LoginPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { signIn, authError, clearAuthError } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<AuthFailureReason | null>(null);

  const reasonParam = searchParams.get('reason');
  const queryReason = isAuthFailureReason(reasonParam) ? reasonParam : null;
  const displayReason = apiError ?? authError ?? queryReason;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    const nextErrors: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = t('login.invalidEmail');
    }
    if (!password) {
      nextErrors.password = t('login.passwordRequired');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    setApiError(null);
    clearAuthError();

    try {
      await signIn(email.trim(), password);
      const from = (location.state as { from?: unknown } | null)?.from;
      toast(t('login.successToast'), 'success');
      navigate(safeReturnPath(from), { replace: true });
    } catch (error) {
      setApiError(error instanceof AuthError ? error.reason : 'unknown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.brandPanel} aria-labelledby="login-brand-title">
        <div className={styles.brandGlow} aria-hidden="true" />
        <div className={styles.brandGrid} aria-hidden="true" />

        <div className={styles.brandTop}>
          <div className={styles.brandLogo}>
            <BrandAnimation />
          </div>
          <p className={styles.brandEyebrow}>{t('login.brandEyebrow')}</p>
          <h1 className={styles.brandTitle} id="login-brand-title">
            {t('login.brandTitle')}
          </h1>
          <p className={styles.brandSubtitle}>{t('login.brandSubtitle')}</p>

          <ul className={styles.features}>
            <li className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                <UtensilsCrossed size={16} strokeWidth={1.8} />
              </span>
              <span>
                <span className={styles.featureTitle}>{t('login.featureOrders')}</span>
                <span className={styles.featureBody}>{t('login.featureOrdersDesc')}</span>
              </span>
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                <Check size={16} strokeWidth={2} />
              </span>
              <span>
                <span className={styles.featureTitle}>{t('login.featureMenu')}</span>
                <span className={styles.featureBody}>{t('login.featureMenuDesc')}</span>
              </span>
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                <Sparkles size={16} strokeWidth={1.8} />
              </span>
              <span>
                <span className={styles.featureTitle}>{t('login.featureInsights')}</span>
                <span className={styles.featureBody}>{t('login.featureInsightsDesc')}</span>
              </span>
            </li>
          </ul>
        </div>

        <div className={styles.miniCardWrap}>
          <div className={styles.miniCard}>
            <div className={styles.miniCardTop}>
              <div>
                <p className={styles.miniCardLabel}>{t('login.miniCardLabel')}</p>
                <p className={styles.miniCardLive}>
                  <span aria-hidden="true" />
                  {t('login.miniCardGrowth')}
                </p>
              </div>
              <span className={styles.miniCardBadge}>{t('common.preview')}</span>
            </div>
            <div className={styles.miniCardStats}>
              <div>
                <span className={styles.miniCardStatLabel}>{t('login.miniCardOrders')}</span>
                <span className={styles.miniCardStatValue}>{formatNumber(164, locale)}</span>
                <span className={styles.miniCardDelta}>+12.4%</span>
              </div>
              <div>
                <span className={styles.miniCardStatLabel}>{t('login.miniCardRevenue')}</span>
                <span className={styles.miniCardStatValue}>
                  {formatCurrency(24850, locale)}
                </span>
                <span className={styles.miniCardDelta}>+18.2%</span>
              </div>
              <Sparkline
                values={[24, 27, 25, 31, 29, 36, 34, 41, 38, 46, 44, 52]}
                tone="accent"
                width={108}
                height={40}
              />
            </div>
            <p className={styles.miniCardFooter}>{t('login.miniCardFooter')}</p>
          </div>
        </div>

        <p className={styles.brandFooter}>{t('app.tagline')}</p>
      </section>

      <section className={styles.formPanel} aria-label={t('login.formAria')}>
        <header className={styles.controls} aria-label={t('login.controlsAria')}>
          <LanguageSwitch size="md" />
          <ThemeToggle size="sm" />
        </header>

        <div className={styles.formWrap}>
          <div className={styles.mobileBrand}>
            <Logo />
          </div>

          <p className={styles.eyebrow}>{t('login.eyebrow')}</p>
          <h2 className={styles.title}>{t('login.title')}</h2>
          <p className={styles.subtitle}>{t('login.subtitle')}</p>

          {displayReason && (
            <div className={styles.formError} role="alert">
              <ShieldAlert size={17} strokeWidth={1.8} aria-hidden="true" />
              <p>{t(errorKeys[displayReason])}</p>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <Input
              label={t('login.email')}
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setApiError(null);
                clearAuthError();
                if (errors.email) {
                  setErrors((current) => ({ ...current, email: undefined }));
                }
              }}
              startIcon={<Mail size={17} strokeWidth={1.7} aria-hidden="true" />}
              error={errors.email}
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              required
            />

            <Input
              label={t('login.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setApiError(null);
                clearAuthError();
                if (errors.password) {
                  setErrors((current) => ({ ...current, password: undefined }));
                }
              }}
              startIcon={<LockKeyhole size={17} strokeWidth={1.7} aria-hidden="true" />}
              endAdornment={
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff size={17} strokeWidth={1.7} aria-hidden="true" />
                  ) : (
                    <Eye size={17} strokeWidth={1.7} aria-hidden="true" />
                  )}
                </button>
              }
              error={errors.password}
              autoComplete="current-password"
              dir="ltr"
              required
            />

            <div className={styles.options}>
              <span className={styles.accessHint}>
                <ShieldCheck size={13} strokeWidth={1.8} aria-hidden="true" />
                {t('login.accessOnly')}
              </span>
              <button
                type="button"
                className={styles.forgot}
                onClick={() => setForgotOpen(true)}
              >
                {t('login.forgot')}
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={loading}
              iconEnd={
                <ArrowRight
                  className="icon-directional"
                  size={17}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              }
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          <div className={styles.notice}>
            <ShieldCheck className={styles.noticeIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <p className={styles.noticeTitle}>{t('login.secureTitle')}</p>
              <p className={styles.noticeBody}>{t('login.secureBody')}</p>
            </div>
          </div>

          <p className={styles.secureNote}>
            <LockKeyhole size={12} strokeWidth={1.9} aria-hidden="true" />
            {t('login.secureNote')}
          </p>
        </div>

        <footer className={styles.formFooter}>{t('footer.rights')}</footer>
      </section>

      <Dialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title={t('login.forgotTitle')}
        closeLabel={t('dialog.close')}
        footer={
          <Button size="sm" onClick={() => setForgotOpen(false)}>
            {t('login.forgotAction')}
          </Button>
        }
      >
        <p className={styles.dialogBody}>{t('login.forgotBody')}</p>
      </Dialog>
    </div>
  );
}
