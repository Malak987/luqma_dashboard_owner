import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  const requestVersionRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);

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

  const loadProfile = useCallback(async () => {
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    const version = ++requestVersionRef.current;
    setStatus((current) => (current === 'success' ? current : 'loading'));
    setError(null);
    try {
      const next = await getProfile(controller.signal);
      if (controller.signal.aborted || requestVersionRef.current !== version) {
        return;
      }
      setProfile(next);
      setStatus('success');
    } catch (caught) {
      if (controller.signal.aborted || requestVersionRef.current !== version) {
        return;
      }
      handleProfileError(caught);
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }
  }, [handleProfileError]);

  const reload = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    requestVersionRef.current += 1;
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    // Profile data is protected in-memory state. Clear it whenever the session
    // ends or changes so a previous account's profile is never retained.
    setProfile(null);
    setError(null);
    setSaveError(null);
    setRefreshError(null);
    setSaving(false);

    if (!session) {
      setStatus('idle');
      return;
    }

    if (!authReady) {
      return;
    }

    void loadProfile();

    return () => {
      requestVersionRef.current += 1;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    };
  }, [authReady, loadProfile, session]);

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

