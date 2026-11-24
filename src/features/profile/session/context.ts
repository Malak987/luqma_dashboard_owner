import { createContext, useContext } from 'react';
import type { OwnerProfile } from '../domain/profile';
import type { UpdateProfileRequest } from '../api/profile.types';

export type ProfileStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ProfileContextValue {
  profile: OwnerProfile | null;
  status: ProfileStatus;
  error: unknown;
  reload: () => Promise<void>;
  save: (request: UpdateProfileRequest) => Promise<void>;
  saving: boolean;
  saveError: unknown;
  refreshError: unknown;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }
  return context;
}
