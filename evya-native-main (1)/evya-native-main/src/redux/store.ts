import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupListeners } from '@reduxjs/toolkit/query';
import stationsReducer from './stationsSlice';
import AuthReducer from './AuthSlice';
import { baseApi } from './api/baseApi';

/** STATE-1: only auth session is persisted; AsyncStorage is the backing store for Redux */
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: [
    'userId',
    'isAuthenticated',
    'user',
    'vehicles',
    'address',
    'account',
    'mobileNumber',
    'userDataLoaded',
  ],
};

const rootReducer = combineReducers({
  stations: stationsReducer,
  auth: persistReducer(authPersistConfig, AuthReducer),
  [baseApi.reducerPath]: baseApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

// STATE-2: enables refetchOnFocus / refetchOnReconnect for RTK Query
setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
