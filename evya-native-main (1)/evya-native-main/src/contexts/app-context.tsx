/**
 * STATE-1: AppContext is UI-only (onboarding). Auth/session lives in Redux + redux-persist.
 * useAuth() is re-exported from hooks/useAuth for a stable public API.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getValue } from '../helpers/common-functions';
import { ID, onBoard } from '../constants/dimensions';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { setUserId } from '../redux/AuthSlice';

interface UiState {
  onBoarded: boolean;
}

interface AppContextType {
  /** @deprecated prefer useAuth() — kept for splash/onboarding shape */
  contextState: {
    isAuthenticated: boolean;
    onBoarded: boolean;
    userId: string | undefined;
  };
  setContextState: React.Dispatch<React.SetStateAction<UiState>>;
  onboard: () => Promise<void>;
  login: (userId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  contextLoaded: boolean;
  error: string | null;
  clearError: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: any) => {
  const dispatch = useAppDispatch();
  const auth = useAuth();
  const reduxUserId = useAppSelector((s) => s.auth.userId);
  const reduxAuthed = useAppSelector((s) => s.auth.isAuthenticated);

  const [ui, setUi] = useState<UiState>({ onBoarded: false });
  const [contextLoaded, setContextLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Bootstrap: onboarding flag + one-time migrate legacy AsyncStorage "ID" → Redux
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [onboarded, legacyId] = await Promise.all([
          getValue(onBoard),
          AsyncStorage.getItem(ID),
        ]);
        setUi({ onBoarded: !!onboarded });

        if (legacyId && !reduxUserId) {
          dispatch(setUserId(String(legacyId)));
          // remove dual source so ID is no longer a separate read path
          await AsyncStorage.removeItem(ID);
        } else if (legacyId && reduxUserId) {
          await AsyncStorage.removeItem(ID);
        }
      } catch (err) {
        console.error('App bootstrap error:', err);
        setError('Error initializing app');
      } finally {
        setContextLoaded(true);
      }
    };
    bootstrap();
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onboard = useCallback(async () => {
    try {
      await AsyncStorage.setItem(onBoard, 'true');
      setUi({ onBoarded: true });
    } catch (err) {
      setError('Error during onboarding');
    }
  }, []);

  const login = useCallback(
    async (userId: string) => {
      const ok = await auth.login(userId);
      if (!ok) setError('Invalid user ID');
      // legacy key no longer written — redux-persist owns session
      try {
        await AsyncStorage.removeItem(ID);
      } catch {
        // ignore
      }
      return ok;
    },
    [auth],
  );

  const logout = useCallback(async () => {
    try {
      await auth.logout();
      await AsyncStorage.removeItem(ID);
      clearError();
    } catch {
      setError('Error during logout');
    }
  }, [auth, clearError]);

  const value: AppContextType = {
    contextState: {
      isAuthenticated: !!reduxAuthed && !!reduxUserId,
      onBoarded: ui.onBoarded,
      userId: reduxUserId ?? undefined,
    },
    setContextState: (updater) => {
      // only honor onBoarded from UI callers
      setUi((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as any)({ ...prev, isAuthenticated: false, userId: undefined })
            : updater;
        return { onBoarded: !!(next as any).onBoarded };
      });
    },
    login,
    logout,
    onboard,
    contextLoaded,
    error,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

// Re-export Redux-backed useAuth so existing imports keep working
export { useAuth } from '../hooks/useAuth';
