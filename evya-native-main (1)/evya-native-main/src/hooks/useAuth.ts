/**
 * STATE-1: public auth API — always reads from Redux (single source of truth).
 * PERF-4: atomic selectors (not object literals) so Home only re-renders when
 * the specific auth fields it uses actually change.
 */
import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { logout as logoutAction, setUserId } from '../redux/AuthSlice';
import { clearAuthToken } from '../axios/Apis';
import { baseApi } from '../redux/api/baseApi';
import { persistor } from '../redux/store';

export function useAuth() {
  const dispatch = useAppDispatch();
  // Atomic selectors — each compares with ===, no new object identity each dispatch
  const userId = useAppSelector((s) => s.auth.userId);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const vehicles = useAppSelector((s) => s.auth.vehicles);
  const loading = useAppSelector((s) => s.auth.loading);
  const userDataLoaded = useAppSelector((s) => s.auth.userDataLoaded);

  const login = useCallback(
    async (id: string): Promise<boolean> => {
      if (!id || id === 'undefined' || id === 'null') {
        return false;
      }
      dispatch(setUserId(String(id)));
      return true;
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    try {
      await clearAuthToken();
    } catch {
      // ignore
    }
    dispatch(logoutAction());
    dispatch(baseApi.util.resetApiState());
    try {
      await persistor.purge();
    } catch {
      // ignore
    }
  }, [dispatch]);

  return useMemo(
    () => ({
      login,
      logout,
      isAuthenticated: !!isAuthenticated && !!userId,
      userId: userId ?? undefined,
      user,
      vehicles,
      loading,
      userDataLoaded,
    }),
    [
      login,
      logout,
      isAuthenticated,
      userId,
      user,
      vehicles,
      loading,
      userDataLoaded,
    ],
  );
}

export default useAuth;
