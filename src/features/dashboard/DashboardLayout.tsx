import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBodyScrollLock, useEscapeKey, useMediaQuery } from '../../lib/hooks';
import { useToast } from '../../components/feedback/ToastContext';
import { PageSkeleton } from '../../app/PageSkeleton';
import { ErrorBoundary, RouteErrorFallback } from '../../app/ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './DashboardLayout.module.css';

export function DashboardLayout() {
  const { t } = useI18n();
  const { toast } = useToast();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useBodyScrollLock(sidebarOpen && !isDesktop);
  useEscapeKey(() => setSidebarOpen(false), sidebarOpen);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo(0, 0);
    mainRef.current?.focus();
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen || isDesktop) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const sidebar = document.getElementById('app-sidebar');
    const timer = window.setTimeout(() => {
      document.getElementById('sidebar-close-button')?.focus();
    }, 60);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sidebar) {
        return;
      }
      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((item) => item.offsetParent !== null);
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isDesktop, sidebarOpen]);

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  return (
    <div className={styles.app}>
      <a className="skip-link" href="#main-content">
        {t('a11y.skipToContent')}
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          className={styles.overlay}
          aria-label={t('a11y.closeSidebar')}
          tabIndex={-1}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={styles.main}>
        <Topbar onOpenMenu={() => setSidebarOpen(true)} />

        <div className={styles.dataNotice} role="status">
          <Info size={14} strokeWidth={1.8} aria-hidden="true" />
          <p>{t('integration.demoNotice')}</p>
        </div>

        <main ref={mainRef} id="main-content" className={styles.content} tabIndex={-1}>
          <ErrorBoundary fallback={<RouteErrorFallback />}>
            <Suspense fallback={<PageSkeleton />}>
              <div key={location.pathname} className={styles.pageTransition}>
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>

        <footer className={styles.footer}>
          <p>{t('footer.preview')}</p>
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => toast(t('footer.helpToast'))}
          >
            {t('footer.help')}
          </button>
          <p className={styles.copyright}>{t('footer.rights')}</p>
        </footer>
      </div>
    </div>
  );
}
