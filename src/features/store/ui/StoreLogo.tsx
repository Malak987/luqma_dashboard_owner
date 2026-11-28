import { useEffect, useState } from 'react';
import { Avatar } from '../../../components/ui/Primitives';
import { resolveAssetUrl } from '../../../lib/api/media';
import { cx } from '../../../lib/cx';
import styles from './StoreLogo.module.css';

interface StoreLogoProps {
  name: string;
  iconUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StoreLogo({ name, iconUrl, size = 'md', className }: StoreLogoProps) {
  const resolved = resolveAssetUrl(iconUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return <Avatar name={name} tone={0} size={size} className={className} />;
  }

  return (
    <span className={cx(styles.frame, styles[`frame_${size}`], className)}>
      <img
        src={resolved}
        alt={name}
        className={styles.image}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
