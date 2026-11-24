import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Panel.module.css';

interface PanelProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function Panel({ children, className, padded = true }: PanelProps) {
  return <section className={cx(styles.panel, padded && styles.padded, className)}>{children}</section>;
}

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headingId?: string;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  headingId,
}: SectionCardProps) {
  return (
    <section className={cx(styles.panel, styles.sectionCard, className)}>
      <header className={styles.sectionHeader}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle} id={headingId}>
            {title}
          </h2>
          {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.sectionAction}>{action}</div>}
      </header>
      <div className={cx(styles.sectionBody, bodyClassName)}>{children}</div>
    </section>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, meta }: PageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeading}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {meta}
        </div>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </header>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyBody}>{body}</p>
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}
