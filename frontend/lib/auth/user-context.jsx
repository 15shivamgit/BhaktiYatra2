'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/api/endpoints';

/**
 * @typedef {{ id: string, name: string, email: string, phone: string | null, role: 'user' | 'admin',
 *   avatarUrl: string | null, hasPassword: boolean, googleLinked: boolean, createdAt: string }} PublicUser
 * @typedef {{ user: PublicUser | null, status: 'loading' | 'authenticated' | 'guest',
 *   setUser: (user: PublicUser | null) => void, refresh: () => Promise<void>,
 *   logout: () => Promise<void> }} UserState
 */

/** Exported for tests, which render components with a fixed value. */
export const UserContext = createContext(/** @type {UserState | null} */ (null));

/**
 * Holds the signed-in user for the whole app. The session itself lives in an httpOnly cookie;
 * this only mirrors `/auth/me`. It re-checks when the tab regains focus so a demoted or
 * deactivated account is noticed quickly. Guards built on it are UX only; the API enforces.
 */
export function UserProvider({ children }) {
  const [user, setUserState] = useState(/** @type {PublicUser | null} */ (null));
  const [status, setStatus] = useState(/** @type {UserState['status']} */ ('loading'));

  const setUser = useCallback((next) => {
    setUserState(next);
    setStatus(next ? 'authenticated' : 'guest');
  }, []);

  const refresh = useCallback(async () => {
    try {
      setUser(await authApi.me());
    } catch (error) {
      // 401 means signed out; on network errors keep what we had rather than flashing "guest".
      if (error?.status === 401) setUser(null);
      else setStatus((current) => (current === 'loading' ? 'guest' : current));
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    // Initial session check; setUser runs after the request resolves, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const value = useMemo(
    () => ({ user, status, setUser, refresh, logout }),
    [user, status, setUser, refresh, logout],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** @returns {UserState} */
export function useUser() {
  const value = useContext(UserContext);
  if (!value) throw new Error('useUser must be used inside <UserProvider>');
  return value;
}
