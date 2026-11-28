import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import { notifications as seedNotifications } from '../../data/mock';
import type { Notification, NotificationType } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { cx } from '../../lib/cx';
import { formatRelativeMinutes } from '../../lib/format';
import { useEscapeKey, useOnClickOutside } from '../../lib/hooks';
import { Avatar } from '../../components/ui/Primitives';
import { IconButton } from '../../components/ui/IconButton';
import { LanguageSwitch } from '../../components/ui/LanguageSwitch';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useToast } from '../../components/feedback/ToastContext';
import { useProfile } from '../profile/session/context';
import { getStoreName } from '../store/domain/store';
import { useStore } from '../store/session/context';
import { StoreLogo } from '../store/ui/StoreLogo';
import { currentNavItem } from './navigation';
import { useAuthenticatedSession, useSession } from '../auth/session/context';
import styles from './Topbar.module.css';

const notificationIcons: Record<NotificationType, typeof ShoppingBag> = {
  order: ShoppingBag,
  stock: TriangleAlert,
  customer: UserPlus,
  system: Info,
};

interface TopbarProps {
  onOpenMenu: () => void;
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const session = useAuthenticatedSession();
  const { signOut } = useSession();
  const { profile } = useProfile();
  const { store } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Notification[]>(() =>
    seedNotifications.map((item) => ({ ...item })),
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const current = currentNavItem(location.pathname);
  const currentLabel = current ? t(current.labelKey) : t('topbar.breadcrumbDashboard');
  const unread = items.filter((item) => !item.read).length;
  const displayName = profile?.name ?? session.user.userName;
  const displayEmail = profile?.email ?? t('topbar.apiSession');
  const storeName = store ? getStoreName(store, locale) : null;

  useOnClickOutside(notificationsRef, () => setNotificationsOpen(false), notificationsOpen);
  useOnClickOutside(profileRef, () => setProfileOpen(false), profileOpen);
  useEscapeKey(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, notificationsOpen || profileOpen);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const markRead = (id: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllRead = () => {
    setItems((currentItems) => currentItems.map((item) => ({ ...item, read: true })));
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <IconButton
          label={t('a11y.openSidebar')}
          className={styles.menuButton}
          onClick={onOpenMenu}
        >
          <Menu size={19} strokeWidth={1.9} aria-hidden="true" />
        </IconButton>

        <nav className={styles.breadcrumb} aria-label={t('topbar.breadcrumbDashboard')}>
          <span className={styles.breadcrumbRoot}>{t('topbar.breadcrumbDashboard')}</span>
          <ChevronRight
            className={cx(styles.breadcrumbChevron, 'icon-directional')}
            size={13}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className={styles.breadcrumbCurrent}>{currentLabel}</span>
        </nav>

        {store && storeName && (
          <div className={styles.storeChip}>
            <StoreLogo name={storeName} iconUrl={store.iconUrl} size="sm" />
            <span className={styles.storeChipName} dir="auto">
              {storeName}
            </span>
          </div>
        )}
      </div>

      <div className={styles.right}>
        <form
          className={styles.search}
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            toast(t('topbar.searchHint'));
          }}
        >
          <Search className={styles.searchIcon} size={15} strokeWidth={1.9} aria-hidden="true" />
          <input
            ref={searchRef}
            className={styles.searchInput}
            type="search"
            placeholder={t('topbar.searchPlaceholder')}
            aria-label={t('a11y.search')}
          />
          <kbd className={styles.searchKbd}>⌘K</kbd>
        </form>

        <span className={styles.previewChip} title={t('topbar.previewTitle')}>
          <span className={styles.previewDot} aria-hidden="true" />
          {t('topbar.previewChip')}
        </span>

        <LanguageSwitch />

        <ThemeToggle size="sm" />

        <div className={styles.popoverAnchor} ref={notificationsRef}>
          <IconButton
            label={t('a11y.notifications')}
            variant="surface"
            size="sm"
            badge={unread}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
          >
            <Bell size={16} strokeWidth={1.8} aria-hidden="true" />
          </IconButton>

          {notificationsOpen && (
            <div className={styles.popover} role="dialog" aria-label={t('topbar.notifications')}>
              <header className={styles.popoverHeader}>
                <div>
                  <p className={styles.popoverTitle}>{t('topbar.notifications')}</p>
                  <p className={styles.popoverSubtitle}>{t('topbar.notificationsSubtitle')}</p>
                </div>
                <button
                  type="button"
                  className={styles.markAll}
                  onClick={markAllRead}
                  disabled={unread === 0}
                >
                  <Check size={12} strokeWidth={2.2} aria-hidden="true" />
                  {t('topbar.markAllRead')}
                </button>
              </header>

              {items.length === 0 ? (
                <p className={styles.empty}>{t('topbar.noNotifications')}</p>
              ) : (
                <ul className={styles.notificationList}>
                  {items.map((item) => {
                    const Icon = notificationIcons[item.type];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cx(styles.notificationItem, !item.read && styles.unread)}
                          onClick={() => markRead(item.id)}
                        >
                          <span className={styles.notificationIcon} data-type={item.type}>
                            <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                          </span>
                          <span className={styles.notificationCopy}>
                            <span className={styles.notificationTitle}>{item.title[locale]}</span>
                            <span className={styles.notificationBody}>{item.body[locale]}</span>
                            <span className={styles.notificationTime}>
                              {formatRelativeMinutes(item.minutesAgo, locale)}
                            </span>
                          </span>
                          {!item.read && <span className={styles.unreadDot} aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <footer className={styles.popoverFooter}>
                <button
                  type="button"
                  className={styles.viewAll}
                  onClick={() => {
                    setNotificationsOpen(false);
                    toast(t('common.previewAction'));
                  }}
                >
                  {t('notifications.viewAll')}
                </button>
              </footer>
            </div>
          )}
        </div>

        <div className={styles.popoverAnchor} ref={profileRef}>
          <button
            type="button"
            className={styles.profileButton}
            aria-label={t('a11y.profileMenu')}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
          >
            <Avatar name={displayName} tone={0} size="sm" />
            <span className={styles.profileCopy}>
              <span className={styles.profileName} dir="auto">{displayName}</span>
              <span className={styles.profileRole}>{t('role.Owner')}</span>
            </span>
            <ChevronDown
              className={cx(styles.profileChevron, profileOpen && styles.profileChevronOpen)}
              size={13}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          {profileOpen && (
            <div className={styles.profilePopover} role="menu" aria-label={t('topbar.account')}>
              <div className={styles.profileHeader}>
                <Avatar name={displayName} tone={0} size="lg" />
                <div className={styles.profileHeaderCopy}>
                  <p className={styles.profileName} dir="auto">{displayName}</p>
                  <p className={styles.profileEmail}>{displayEmail}</p>
                  <p className={styles.profileRole}>{t('role.Owner')}</p>
                </div>
              </div>
              <div className={styles.menuDivider} />
              <Link
                to="/settings"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                <Settings size={15} strokeWidth={1.8} aria-hidden="true" />
                {t('nav.settings')}
              </Link>
              <button
                type="button"
                className={cx(styles.menuItem, styles.menuItemDanger)}
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  const logoutResult = signOut();
                  toast(t('auth.signedOut'), 'info');
                  navigate('/login');
                  void logoutResult.then((remoteSucceeded) => {
                    if (!remoteSucceeded) {
                      toast(t('auth.remoteLogoutFailed'), 'error');
                    }
                  });
                }}
              >
                <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
                {t('topbar.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
