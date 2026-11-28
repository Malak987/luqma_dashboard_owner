import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Mail, MapPin, RefreshCw, Save, Upload } from 'lucide-react';
import { ApiError } from '../../../lib/api/errors';
import { useI18n } from '../../../i18n/context';
import { useToast } from '../../../components/feedback/ToastContext';
import { Avatar, Badge } from '../../../components/ui/Primitives';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Field';
import { SectionCard } from '../../../components/ui/Panel';
import { useProfile } from '../session/context';
import styles from './ProfileSettingsCard.module.css';

interface ProfileFormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

const emptyForm: ProfileFormState = {
  fullName: '',
  email: '',
  phoneNumber: '',
  address: '',
};

export function ProfileSettingsCard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { profile, status, reload, save, saving, saveError, refreshError } = useProfile();
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.name,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
      });
    }
  }, [profile]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { fullName?: string; email?: string } = {};
    if (!form.fullName.trim()) {
      nextErrors.fullName = t('profile.invalidName');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t('profile.invalidEmail');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await save({
        userName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
      });
      toast(t('profile.saveSuccess'), 'success');
    } catch {
      // The provider exposes a safe, localized error banner.
    }
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <SectionCard
        title={t('settings.profileTitle')}
        subtitle={t('settings.profileSubtitle')}
        className={styles.card}
      >
        <div className={styles.loading} aria-busy="true" aria-label={t('profile.loading')}>
          <span className={styles.skeletonAvatar} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLineShort} />
        </div>
      </SectionCard>
    );
  }

  if (status === 'error' || !profile) {
    return (
      <SectionCard
        title={t('settings.profileTitle')}
        subtitle={t('settings.profileSubtitle')}
        className={styles.card}
      >
        <div className={styles.loadError} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">
            <AlertTriangle size={18} strokeWidth={1.8} />
          </span>
          <div>
            <p className={styles.errorTitle}>{t('profile.loadErrorTitle')}</p>
            <p className={styles.errorBody}>{t('profile.loadErrorBody')}</p>
          </div>
        </div>
        <div className={styles.errorActions}>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => void reload()}
          >
            {t('profile.retry')}
          </Button>
        </div>
      </SectionCard>
    );
  }

  const emailChanged = form.email.trim() !== profile.email;
  const showEmailNote = !profile.emailConfirmed || emailChanged;

  return (
    <SectionCard
      title={t('settings.profileTitle')}
      subtitle={t('settings.profileSubtitle')}
      className={styles.card}
    >
      <div className={styles.profileHead}>
        <Avatar name={profile.name} tone={0} size="lg" />
        <div className={styles.profileCopy}>
          <p className={styles.profileName} dir="auto">
            {profile.name}
          </p>
          <p className={styles.profileEmail} dir="ltr">
            {profile.email}
          </p>
          <div className={styles.profileMeta}>
            <span className={styles.role}>{t('role.Owner')}</span>
            <Badge tone={profile.emailConfirmed ? 'success' : 'warning'} dot>
              {profile.emailConfirmed ? t('profile.emailConfirmed') : t('profile.emailPending')}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Upload size={13} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => toast(t('settings.avatarHint'))}
          >
            {t('settings.changePhoto')}
          </Button>
        </div>
      </div>

      {Boolean(refreshError) && (
        <div className={styles.warning} role="status">
          {t('profile.refreshError')}
        </div>
      )}

      {Boolean(saveError) && (
        <div className={styles.errorBanner} role="alert">
          {saveError instanceof ApiError &&
          (saveError.status === 400 || saveError.status === 422)
            ? t('profile.validationError')
            : t('profile.saveError')}
        </div>
      )}

      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.formGrid}>
          <Input
            label={t('settings.fullName')}
            value={form.fullName}
            onChange={(event) => {
              setForm((current) => ({ ...current, fullName: event.target.value }));
              if (errors.fullName) {
                setErrors((current) => ({ ...current, fullName: undefined }));
              }
            }}
            error={errors.fullName}
            autoComplete="name"
            dir="auto"
            required
          />
          <Input
            label={t('settings.email')}
            type="email"
            value={form.email}
            onChange={(event) => {
              setForm((current) => ({ ...current, email: event.target.value }));
              if (errors.email) {
                setErrors((current) => ({ ...current, email: undefined }));
              }
            }}
            error={errors.email}
            startIcon={<Mail size={15} strokeWidth={1.7} aria-hidden="true" />}
            autoComplete="email"
            dir="ltr"
            required
          />
          <Input
            label={t('settings.phone')}
            type="tel"
            value={form.phoneNumber}
            onChange={(event) =>
              setForm((current) => ({ ...current, phoneNumber: event.target.value }))
            }
            autoComplete="tel"
            dir="ltr"
          />
          <Input
            label={t('settings.role')}
            value={t('role.Owner')}
            readOnly
            aria-readonly="true"
          />
          <Input
            label={t('settings.address')}
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            startIcon={<MapPin size={15} strokeWidth={1.7} aria-hidden="true" />}
            autoComplete="street-address"
            dir="auto"
            containerClassName={styles.fullSpan}
          />
        </div>

        {showEmailNote && <p className={styles.formNote}>{t('profile.emailPendingNote')}</p>}

        <div className={styles.formActions}>
          <Button
            type="submit"
            size="sm"
            loading={saving}
            icon={<Save size={14} strokeWidth={1.8} aria-hidden="true" />}
          >
            {t('settings.save')}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
