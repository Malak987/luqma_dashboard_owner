import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoginRoute } from './features/auth/routes/LoginRoute';
import { RequireAuth } from './features/auth/routes/RequireAuth';
import { ProfileProvider } from './features/profile/session/ProfileProvider';
import { DashboardLayout } from './features/dashboard/DashboardLayout';
import { NotFoundPage } from './features/not-found/NotFoundPage';

const OverviewPage = lazy(() => import('./features/overview/OverviewPage'));
const CategoriesPage = lazy(() => import('./features/categories/CategoriesPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<RequireAuth />}>
        <Route
          element={
            <ProfileProvider>
              <DashboardLayout />
            </ProfileProvider>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
