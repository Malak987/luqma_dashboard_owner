import { Component, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { ButtonLink } from '../components/ui/Button';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function RouteErrorFallback() {
  const { t } = useI18n();

  return (
    <div className={styles.wrap} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <TriangleAlert size={22} strokeWidth={1.8} />
      </span>
      <h2 className={styles.title}>{t('error.title')}</h2>
      <p className={styles.body}>{t('error.body')}</p>
      <ButtonLink to="/" variant="secondary" size="sm">
        {t('notFound.back')}
      </ButtonLink>
    </div>
  );
}
