import darkLogo from '../../assets/brand/luqma-logo-on-dark-480.png';
import lightLogo from '../../assets/brand/luqma-logo-on-light-480.png';
import { useI18n } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import { cx } from '../../lib/cx';
import styles from './Logo.module.css';

interface LogoProps {
  variant?: 'auto' | 'light' | 'dark';
  className?: string;
}

export function Logo({ variant = 'auto', className }: LogoProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const resolved =
    variant === 'auto' ? (theme === 'dark' ? 'dark' : 'light') : variant;
  const source = resolved === 'dark' ? darkLogo : lightLogo;

  return (
    <img
      src={source}
      alt={t('app.name')}
      className={cx(styles.logo, className)}
      width={1315}
      height={841}
      draggable={false}
      decoding="async"
    />
  );
}
