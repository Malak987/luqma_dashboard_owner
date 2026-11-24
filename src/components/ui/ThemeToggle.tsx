import { Moon, Sun } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import { IconButton } from './IconButton';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';

  return (
    <IconButton
      label={t('a11y.toggleTheme')}
      variant="surface"
      size={size}
      className={className}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun size={17} strokeWidth={1.8} aria-hidden="true" />
      ) : (
        <Moon size={17} strokeWidth={1.8} aria-hidden="true" />
      )}
    </IconButton>
  );
}
