/**
 * STATE-2: RTK Query base API.
 * Reference endpoints: stations, vehicles, wallet (+ shared RFID list for dedupe).
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAuthToken } from '../../axios/Apis';
import StationsService from '../../axios/Apis';

const SERVER = 'https://server.evyaa.com';

export type StationsQueryArg = {
  latitude?: number;
  longitude?: number;
  search?: string;
  filters?: Record<string, any>;
};

type ApiResult<T = any> = {
  success?: boolean;
  message?: string;
  data?: T;
  wallet?: any;
  transactions?: any[];
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: SERVER,
    prepareHeaders: async (headers) => {
      try {
        const token = await getAuthToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // ignore
      }
      return headers;
    },
  }),
  tagTypes: ['Stations', 'Vehicles', 'Wallet', 'Rfid'],
  endpoints: (builder) => ({
    /** Stations list — uses existing StationsService transform */
    getStations: builder.query<any[], StationsQueryArg | void>({
      async queryFn(arg) {
        try {
          const params = (arg || {}) as StationsQueryArg;
          const location =
            params.latitude != null
              ? { latitude: params.latitude, longitude: params.longitude }
              : undefined;
          // Cast: Apis.js is untyped; pass full options shape
          const data = await (StationsService as any).getStations({
            location,
            filters: params.filters,
            search: params.search,
          });
          return { data: data || [] };
        } catch (e: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: e?.message || 'Failed to fetch stations',
            },
          };
        }
      },
      providesTags: ['Stations'],
      keepUnusedDataFor: 60,
    }),

    /** User vehicles */
    getUserVehicles: builder.query<any[], string>({
      async queryFn(userId) {
        try {
          const res = (await (StationsService as any).getUserVehicles(
            userId,
          )) as ApiResult;
          if (!res.success) {
            return {
              error: {
                status: 'CUSTOM_ERROR' as const,
                error: res.message || 'Failed',
              },
            };
          }
          const list = Array.isArray(res.data) ? res.data : res.data || [];
          return { data: list as any[] };
        } catch (e: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: e?.message || 'Failed to fetch vehicles',
            },
          };
        }
      },
      providesTags: ['Vehicles'],
      keepUnusedDataFor: 60,
    }),

    /** Wallet + recent transactions (complete wallet data) */
    getWallet: builder.query<
      { wallet: any; transactions: any[] },
      string
    >({
      async queryFn(userId) {
        try {
          const res = (await (StationsService as any).getCompleteWalletData(
            userId,
          )) as ApiResult;
          if (!res.success) {
            return {
              error: {
                status: 'CUSTOM_ERROR' as const,
                error: res.message || 'Failed to load wallet',
              },
            };
          }
          return {
            data: {
              wallet: res.wallet,
              transactions: res.transactions || [],
            },
          };
        } catch (e: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: e?.message || 'Failed to load wallet',
            },
          };
        }
      },
      providesTags: ['Wallet'],
      keepUnusedDataFor: 30,
    }),

    /**
     * Single RFID list for the user — Active / Requested filter client-side
     * so both tabs share one network request (STATE-2 RFID dedupe).
     */
    getUserRFIDs: builder.query<any[], string>({
      async queryFn(userId) {
        try {
          const res = (await (StationsService as any).getUserRFIDs(
            userId,
          )) as ApiResult;
          if (!res.success) {
            return {
              error: {
                status: 'CUSTOM_ERROR' as const,
                error: res.message || 'Failed to fetch RFIDs',
              },
            };
          }
          return { data: (res.data as any[]) || [] };
        } catch (e: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: e?.message || 'Failed to fetch RFIDs',
            },
          };
        }
      },
      providesTags: ['Rfid'],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetStationsQuery,
  useLazyGetStationsQuery,
  useGetUserVehiclesQuery,
  useGetWalletQuery,
  useLazyGetWalletQuery,
  useGetUserRFIDsQuery,
  useLazyGetUserRFIDsQuery,
} = baseApi;
