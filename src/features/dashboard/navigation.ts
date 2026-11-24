import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Store,
  Tags,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { TranslationKey } from '../../i18n/en';

export interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
}

export interface NavGroup {
  titleKey: TranslationKey;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    titleKey: 'nav.section.main',
    items: [
      { to: '/', labelKey: 'nav.overview', icon: LayoutDashboard, end: true },
      { to: '/orders', labelKey: 'nav.orders', icon: ClipboardList, badge: 8 },
      { to: '/restaurants', labelKey: 'nav.restaurants', icon: Store },
      { to: '/customers', labelKey: 'nav.customers', icon: Users },
    ],
  },
  {
    titleKey: 'nav.section.catalog',
    items: [
      { to: '/categories', labelKey: 'nav.categories', icon: Tags },
      { to: '/products', labelKey: 'nav.products', icon: UtensilsCrossed },
    ],
  },
  {
    titleKey: 'nav.section.insights',
    items: [{ to: '/reports', labelKey: 'nav.reports', icon: BarChart3 }],
  },
  {
    titleKey: 'nav.section.account',
    items: [{ to: '/settings', labelKey: 'nav.settings', icon: Settings }],
  },
];

export function currentNavItem(pathname: string): NavItem | undefined {
  return navigation
    .flatMap((group) => group.items)
    .find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
}
