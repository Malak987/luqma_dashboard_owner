export interface LogoutOptions {
  clearLocal: () => void;
  remoteLogout?: () => Promise<void>;
}

/**
 * Clears local state first, then attempts the documented remote logout.
 * A remote failure can never leave the user locally authenticated.
 * Returns whether the remote call completed successfully.
 */
export async function performLogout({
  clearLocal,
  remoteLogout,
}: LogoutOptions): Promise<boolean> {
  clearLocal();

  if (!remoteLogout) {
    return false;
  }

  try {
    await remoteLogout();
    return true;
  } catch {
    return false;
  }
}
