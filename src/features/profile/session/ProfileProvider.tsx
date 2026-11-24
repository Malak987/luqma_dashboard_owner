import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthError } from '../../auth/domain/session';
import { useSession } from '../../auth/session/context';
import { getProfile, updateProfile } from '../api/profile.api';
import type { UpdateProfileRequest } from '../api/profile.types';
import type { OwnerProfile } from '../domain/profile';
import { ProfileContext, type ProfileContextValue, type ProfileStatus } from './context';

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { authReady, invalidateSession, session } = useSession();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [refreshError, setRefreshError] = useState<unknown>(null);

  const handleProfileError = useCallback(
    (caught: unknown) => {
      if (caught instanceof AuthError && caught.reason === 'role-not-allowed') {
        invalidateSession('role-not-allowed');
      }
      setError(caught);
      setStatus('error');
    },
    [invalidateSession],
  );

  const reload = useCallback(async () => {
    setStatus((current) => (current === 'success' ? current : 'loading'));
    setError(null);
    try {
      const next = await getProfile();
      setProfile(next);
      setStatus('success');
    } catch (caught) {
      handleProfileError(caught);
    }
  }, [handleProfileError]);

  useEffect(() => {
    if (!session) {
      // Profile data is protected in-memory state. Do not retain it while the
      // authenticated session is being cleared or after sign-out.
      setProfile(null);
      setStatus('idle');
      setError(null);
      setSaveError(null);
      setRefreshError(null);
      setSaving(false);
      return;
    }

    if (authReady) {
      void reload();
    }
  }, [authReady, reload, session]);

  const save = useCallback(
    async (request: UpdateProfileRequest) => {
      setSaving(true);
      setSaveError(null);
      setRefreshError(null);

      try {
        await updateProfile(request);
      } catch (caught) {
        setSaveError(caught);
        setSaving(false);
        throw caught;
      }

      try {
        const next = await getProfile();
        setProfile(next);
        setStatus('success');
      } catch (caught) {
        if (caught instanceof AuthError && caught.reason === 'role-not-allowed') {
          invalidateSession('role-not-allowed');
        }
        setRefreshError(caught);
      } finally {
        setSaving(false);
      }
    },
    [invalidateSession],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      status,
      error,
      reload,
      save,
      saving,
      saveError,
      refreshError,
    }),
    [error, profile, refreshError, reload, save, saveError, saving, status],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

