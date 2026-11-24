import { lazy, Suspense, useEffect, useState } from 'react';
import { useI18n } from '../../i18n/context';
import { usePrefersReducedMotion, useMediaQuery } from '../../lib/hooks';
import { useTheme } from '../../theme/context';
import { cx } from '../../lib/cx';
import { Logo } from './Logo';
import styles from './BrandAnimation.module.css';

const LottiePlayer = lazy(() => import('./LottiePlayer'));

interface BrandAnimationProps {
  className?: string;
}

export function BrandAnimation({ className }: BrandAnimationProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const reducedMotion = usePrefersReducedMotion();
  const [animationData, setAnimationData] = useState<object | null>(null);

  const enabled = isDesktop && !reducedMotion;

  useEffect(() => {
    if (!enabled) {
      setAnimationData(null);
      return;
    }

    let active = true;
    const load =
      theme === 'dark'
        ? () => import('../../assets/brand/lottie/luqma-logo-dark.json')
        : () => import('../../assets/brand/lottie/luqma-logo-light.json');

    load()
      .then((module) => {
        if (active) {
          setAnimationData(module.default);
        }
      })
      .catch(() => {
        if (active) {
          setAnimationData(null);
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, theme]);

  if (!enabled || !animationData) {
    return (
      <div className={cx(styles.fallback, className)}>
        <Logo variant={theme === 'dark' ? 'dark' : 'light'} className={styles.staticLogo} />
      </div>
    );
  }

  return (
    <div
      className={cx(styles.animation, className)}
      role="img"
      aria-label={t('app.name')}
    >
      <Suspense fallback={<Logo variant={theme === 'dark' ? 'dark' : 'light'} className={styles.staticLogo} />}>
        <LottiePlayer data={animationData} className={styles.lottie} />
      </Suspense>
    </div>
  );
}
