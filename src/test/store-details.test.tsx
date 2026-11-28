import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastContext } from '../components/feedback/ToastContext';
import type { Session } from '../features/auth/domain/session';
import { SessionContext, type SessionContextValue } from '../features/auth/session/context';
import { CategoryCard } from '../features/categories/CategoryCard';
import { Sidebar } from '../features/dashboard/Sidebar';
import { Topbar } from '../features/dashboard/Topbar';
import type { MenuCategoryData } from '../features/menuCategories/api/menuCategory.types';
import OverviewPage from '../features/overview/OverviewPage';
import { ProfileContext, type ProfileContextValue } from '../features/profile/session/context';
import { ProfileSettingsCard } from '../features/profile/ui/ProfileSettingsCard';
import { getStoreById } from '../features/store/api/store.api';
import { createOwnerStoreScopeFromSession } from '../features/store/domain/ownership';
import type { OwnerStore } from '../features/store/domain/store';
import { StoreContext, type StoreContextValue } from '../features/store/session/context';
import { RestaurantIdentityCard } from '../features/store/ui/RestaurantIdentityCard';
import { RestaurantSettingsCard } from '../features/store/ui/RestaurantSettingsCard';
import { ar } from '../i18n/ar';
import { I18nContext } from '../i18n/context';
import { en, type TranslationKey } from '../i18n/en';
import type { Locale } from '../i18n/locale';
import { configureApiAuth, resetApiAuth } from '../lib/api/client';
import { ApiError } from '../lib/api/errors';
import { ThemeContext } from '../theme/context';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const storeId = 'c4a7f2d0-6f1d-4e7b-9b2e-3d6c8f4a1b22';
const otherStoreId = 'd8f1a3c6-5b2e-4d9a-8c70-1f6b3e5a9d55';
const categoryId = 'a2d9e1f4-3b6c-4f8a-9d10-5e7b2c4a6f33';

const ownerSession: Session = {
  token: 'owner-jwt-token',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  storeId,
  user: {
    userId: 'b7e4c1a9-2d6f-4b8e-9a30-6c5f1d3e7b44',
    userName: 'Nour Hassan',
    role: 'Owner',
  },
};

const ownerScope = createOwnerStoreScopeFromSession(ownerSession);

const sampleStorePayload = {
  id: storeId,
  nameAr: 'مطعم النيل للمشويات',
  nameEn: 'Nile Grill House',
  phoneNumber: '+20 100 555 0199',
  address: '14 Nile Corniche, Sohag',
  iconUrl: '/images/stores/nile-grill.png',
  descriptionAr: 'مشويات شرقية طازجة يوميًا',
  descriptionEn: 'Fresh charcoal grills prepared daily',
  mainCategoryNameAr: 'مشويات',
  mainCategoryNameEn: 'Grills',
  openTime: '10:00:00',
  closeTime: '23:30:00',
  priceLevel: 2,
  averageRating: 4.7,
  ratingsCount: 128,
  deliveryTimeMinutes: 35,
  deliveryFee: 20,
  isActive: true,
  isOpenNow: true,
  images: ['/images/stores/cover-1.jpg', { imageUrl: '/images/stores/cover-2.jpg' }],
};

const sampleStore: OwnerStore = {
  id: storeId,
  nameAr: 'مطعم النيل للمشويات',
  nameEn: 'Nile Grill House',
  phoneNumber: '+20 100 555 0199',
  address: '14 Nile Corniche, Sohag',
  iconUrl: '/images/stores/nile-grill.png',
  descriptionAr: 'مشويات شرقية طازجة يوميًا',
  descriptionEn: 'Fresh charcoal grills prepared daily',
  mainCategoryNameAr: 'مشويات',
  mainCategoryNameEn: 'Grills',
  openTime: '10:00:00',
  closeTime: '23:30:00',
  priceLevel: 2,
  averageRating: 4.7,
  ratingsCount: 128,
  deliveryTimeMinutes: 35,
  deliveryFee: 20,
  isActive: true,
  isOpenNow: true,
  images: ['/images/stores/cover-1.jpg', '/images/stores/cover-2.jpg'],
};

function translate(locale: Locale) {
  const dict = locale === 'ar' ? ar : en;
  return (key: TranslationKey, vars?: Record<string, string | number>) => {
    let text: string = dict[key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

function renderWithProviders(
  node: ReactNode,
  options: {
    locale?: Locale;
    theme?: 'light' | 'dark';
    storeValue?: Partial<StoreContextValue>;
  } = {},
): string {
  const locale = options.locale ?? 'en';
  const theme = options.theme ?? 'light';

  const sessionValue: SessionContextValue = {
    session: ownerSession,
    status: 'authenticated',
    authReady: true,
    authError: null,
    signIn: async () => ownerSession,
    signOut: async () => true,
    invalidateSession: () => undefined,
    clearAuthError: () => undefined,
  };

  const profileValue: ProfileContextValue = {
    profile: {
      id: ownerSession.user.userId,
      name: ownerSession.user.userName,
      email: 'owner@example.com',
      phoneNumber: '+20 100 555 0199',
      address: 'Sohag',
      role: 'Owner',
      emailConfirmed: true,
      isArchived: false,
      createAt: '2026-11-11T00:00:00Z',
      updateAt: '2026-11-11T00:00:00Z',
    },
    status: 'success',
    error: null,
    reload: async () => undefined,
    save: async () => undefined,
    saving: false,
    saveError: null,
    refreshError: null,
  };

  const storeValue: StoreContextValue = {
    store: sampleStore,
    scope: ownerScope,
    status: 'success',
    error: null,
    reload: async () => undefined,
    ...options.storeValue,
  };

  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      createElement(
        ThemeContext.Provider,
        {
          value: {
            theme,
            setTheme: () => undefined,
            toggleTheme: () => undefined,
          },
        },
        createElement(
          I18nContext.Provider,
          {
            value: {
              locale,
              dir: locale === 'ar' ? 'rtl' : 'ltr',
              setLocale: () => undefined,
              toggleLocale: () => undefined,
              t: translate(locale),
            },
          },
          createElement(
            ToastContext.Provider,
            { value: { toast: () => undefined, dismiss: () => undefined } },
            createElement(
              SessionContext.Provider,
              { value: sessionValue },
              createElement(
                ProfileContext.Provider,
                { value: profileValue },
                createElement(StoreContext.Provider, { value: storeValue }, node),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('GET /api/Store/GetById/{id}', () => {
  it('calls GetById with the exact Store ID from Login and parses all verified fields', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => ownerSession.token });
    fetchMock.mockResolvedValue(
      response({
        message: 'Success',
        data: sampleStorePayload,
        isSucceeded: true,
        timestamp: '2026-11-28T10:00:00Z',
      }),
    );

    const store = await getStoreById(ownerScope);
    expect(store).toEqual(sampleStore);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://luqma-api.runasp.net/api/Store/GetById/${storeId}`);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${ownerSession.token}`,
    );
  });

  it('rejects a response whose store id does not match the authenticated Login Store ID', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => ownerSession.token });
    fetchMock.mockResolvedValue(
      response({
        message: 'Success',
        data: { ...sampleStorePayload, id: otherStoreId },
        isSucceeded: true,
        timestamp: '2026-11-28T10:00:00Z',
      }),
    );

    await expect(getStoreById(ownerScope)).rejects.toMatchObject({
      kind: 'ownership-unverified',
    });
  });

  it('handles 401, 403, 404, missing data, and business errors safely', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const onUnauthorized = vi.fn();
    configureApiAuth({ getToken: () => ownerSession.token, onUnauthorized });

    fetchMock.mockResolvedValueOnce(response({}, 401));
    await expect(getStoreById(ownerScope)).rejects.toMatchObject({ kind: 'unauthorized', status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();

    fetchMock.mockResolvedValueOnce(response({}, 403));
    await expect(getStoreById(ownerScope)).rejects.toMatchObject({ kind: 'forbidden', status: 403 });

    fetchMock.mockResolvedValueOnce(response({}, 404));
    await expect(getStoreById(ownerScope)).rejects.toMatchObject({ kind: 'http', status: 404 });

    fetchMock.mockResolvedValueOnce(
      response({ message: 'Not found', data: null, isSucceeded: false, timestamp: '' }),
    );
    await expect(getStoreById(ownerScope)).rejects.toMatchObject({ kind: 'business' });

    fetchMock.mockResolvedValueOnce(
      response({ message: 'Empty', data: null, isSucceeded: true, timestamp: '' }),
    );
    await expect(getStoreById(ownerScope)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('refuses to touch the network when no verified Login scope exists', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => ownerSession.token });

    await expect(getStoreById(null)).rejects.toMatchObject({ kind: 'ownership-unverified' });
    await expect(getStoreById(undefined)).rejects.toMatchObject({ kind: 'ownership-unverified' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Dashboard restaurant identity and menu category UI', () => {
  it('displays the authenticated restaurant details in English without exposing Store ID', () => {
    const html = renderWithProviders(createElement(RestaurantIdentityCard), { locale: 'en' });

    expect(html).toContain('Nile Grill House');
    expect(html).toContain('14 Nile Corniche, Sohag');
    expect(html).toContain('+20 100 555 0199');
    expect(html).toContain('Grills');
    expect(html).toContain('Active');
    expect(html).toContain('Open now');
    expect(html).toContain('https://luqma-api.runasp.net/images/stores/nile-grill.png');
    expect(html).not.toContain(storeId);
  });

  it('displays the authenticated restaurant details in Arabic RTL without exposing Store ID', () => {
    const html = renderWithProviders(createElement(RestaurantIdentityCard), {
      locale: 'ar',
      theme: 'dark',
    });

    expect(html).toContain('مطعم النيل للمشويات');
    expect(html).toContain('مشويات');
    expect(html).toContain('نشط');
    expect(html).toContain('مفتوح الآن');
    expect(html).not.toContain(storeId);
  });

  it('renders safe error states for missing restaurant (404) and forbidden access (403)', () => {
    const notFoundHtml = renderWithProviders(createElement(RestaurantIdentityCard), {
      storeValue: {
        store: null,
        status: 'error',
        error: new ApiError('http', 'Not found', 404),
      },
    });
    expect(notFoundHtml).toContain('Restaurant not found');
    expect(notFoundHtml).not.toContain(storeId);

    const forbiddenHtml = renderWithProviders(createElement(RestaurantIdentityCard), {
      storeValue: {
        store: null,
        status: 'error',
        error: new ApiError('forbidden', 'Denied', 403),
      },
    });
    expect(forbiddenHtml).toContain('Restaurant access denied');
  });

  it('renders read-only restaurant details in Settings and restaurant identity in Sidebar & Topbar', () => {
    const settingsHtml = renderWithProviders(createElement(RestaurantSettingsCard));
    expect(settingsHtml).toContain('Nile Grill House');
    expect(settingsHtml).toContain('Read-only');
    expect(settingsHtml).not.toContain(storeId);

    const sidebarHtml = renderWithProviders(
      createElement(Sidebar, { open: true, onClose: () => undefined }),
    );
    expect(sidebarHtml).toContain('Nile Grill House');
    expect(sidebarHtml).not.toContain(storeId);

    const topbarHtml = renderWithProviders(
      createElement(Topbar, { onOpenMenu: () => undefined }),
    );
    expect(topbarHtml).toContain('Nile Grill House');
    expect(topbarHtml).not.toContain(storeId);
  });

  it('renders menu category details without Store ID, Category ID, or delete controls', () => {
    const category: MenuCategoryData = {
      id: categoryId,
      storeId,
      nameAr: 'حلويات شرقية',
      nameEn: 'Oriental Desserts',
      imageUrl: '/images/categories/sweets.png',
      displayOrder: 3,
      isActive: true,
      itemsCount: 8,
    };

    const htmlEn = renderWithProviders(
      createElement(CategoryCard, {
        category,
        tone: 0,
        disabled: false,
        onToggleActive: () => undefined,
        onEdit: () => undefined,
      }),
      { locale: 'en' },
    );

    expect(htmlEn).toContain('Oriental Desserts');
    expect(htmlEn).toContain('Active');
    expect(htmlEn).toContain('Order 3');
    expect(htmlEn).toContain('8 items');
    expect(htmlEn).toContain('https://luqma-api.runasp.net/images/categories/sweets.png');
    expect(htmlEn).not.toContain(storeId);
    expect(htmlEn).not.toContain(categoryId);
    expect(htmlEn.toLowerCase()).not.toContain('delete');

    const htmlAr = renderWithProviders(
      createElement(CategoryCard, {
        category,
        tone: 0,
        disabled: false,
        onToggleActive: () => undefined,
        onEdit: () => undefined,
      }),
      { locale: 'ar' },
    );

    expect(htmlAr).toContain('حلويات شرقية');
    expect(htmlAr).toContain('نشطة');
    expect(htmlAr).not.toContain(storeId);
    expect(htmlAr).not.toContain(categoryId);
    expect(htmlAr).not.toContain('حذف');
  });

  it('clearly marks Overview sample analytics and orders as sample data in both English and Arabic', () => {
    const htmlEn = renderWithProviders(createElement(OverviewPage), { locale: 'en' });
    expect(htmlEn).toContain('Nile Grill House');
    expect(htmlEn).toContain('Sample analytics &amp; orders preview');
    expect(htmlEn).toContain('Sample data');
    expect(htmlEn).not.toContain('href="/orders"');
    expect(htmlEn).not.toContain(storeId);

    const htmlAr = renderWithProviders(createElement(OverviewPage), { locale: 'ar' });
    expect(htmlAr).toContain('مطعم النيل للمشويات');
    expect(htmlAr).toContain('معاينة تجريبية للتحليلات والطلبات');
    expect(htmlAr).toContain('بيانات تجريبية');
    expect(htmlAr).not.toContain('href="/orders"');
    expect(htmlAr).not.toContain(storeId);
  });

  it('renders ProfileSettingsCard with useful account fields while hiding internal User ID in EN and AR', () => {
    const htmlEn = renderWithProviders(createElement(ProfileSettingsCard), { locale: 'en' });
    expect(htmlEn).toContain('Nour Hassan');
    expect(htmlEn).toContain('owner@example.com');
    expect(htmlEn).toContain('Owner');
    expect(htmlEn).toContain('Address');
    expect(htmlEn).not.toContain(ownerSession.user.userId);
    expect(htmlEn).not.toContain('User ID');

    const htmlAr = renderWithProviders(createElement(ProfileSettingsCard), { locale: 'ar' });
    expect(htmlAr).toContain('Nour Hassan');
    expect(htmlAr).toContain('owner@example.com');
    expect(htmlAr).toContain('العنوان');
    expect(htmlAr).not.toContain(ownerSession.user.userId);
    expect(htmlAr).not.toContain('معرّف المستخدم');
  });
});
