import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Sparkles, X } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Avatar } from '../../components/ui/Primitives';
import { useToast } from '../../components/feedback/ToastContext';
import { IconButton } from '../../components/ui/IconButton';
import { Logo } from '../../components/brand/Logo';
import { cx } from '../../lib/cx';
import { useProfile } from '../profile/session/context';
import { navigation } from './navigation';
import { useAuthenticatedSession, useSession } from '../auth/session/context';
import styles from './Sidebar.module.css';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const session = useAuthenticatedSession();
  const { signOut } = useSession();
  const { profile } = useProfile();
  const displayName = profile?.name ?? session.user.userName;

  return (
    <aside
      id="app-sidebar"
      className={cx(styles.sidebar, open && styles.open)}
      aria-label={t('a11y.mainNavigation')}
    >
      <div className={styles.brandRow}>
        <Link to="/" className={styles.brandLink} onClick={onClose} aria-label={t('nav.overview')}>
          <Logo className={styles.logo} />
        </Link>
        <IconButton
          id="sidebar-close-button"
          label={t('a11y.closeSidebar')}
          className={styles.closeButton}
          onClick={onClose}
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
      </div>

      <nav className={styles.nav}>
        {navigation.map((group) => (
          <div className={styles.group} key={group.titleKey}>
            <p className={styles.groupLabel}>{t(group.titleKey)}</p>
            <ul className={styles.list}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cx(styles.navItem, isActive && styles.navItemActive)
                      }
                    >
                      <Icon className={styles.navIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
                      <span className={styles.navLabel}>{t(item.labelKey)}</span>
                      {item.badge !== undefined && (
                        <span className={styles.navBadge} aria-label={t('nav.newOrders', { count: item.badge })}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.previewCard}>
          <span className={styles.previewIcon} aria-hidden="true">
            <Sparkles size={15} strokeWidth={1.8} />
          </span>
          <div className={styles.previewCopy}>
            <p className={styles.previewTitle}>{t('nav.previewMode')}</p>
            <p className={styles.previewText}>{t('nav.previewDescription')}</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.backToLogin}
          onClick={() => {
            signOut();
            onClose();
            toast(t('auth.signedOut'), 'info');
            navigate('/login');
          }}
        >
          <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>{t('topbar.signOut')}</span>
        </button>

        <Link to="/settings" className={styles.profile} onClick={onClose}>
          <Avatar name={displayName} tone={0} />
          <span className={styles.profileCopy}>
            <span className={styles.profileName} dir="auto">{displayName}</span>
            <span className={styles.profileRole}>{t('role.Owner')}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
