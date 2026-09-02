/**
 * @format
 * Smoke + auth slice unit tests (avoids mounting the full native tree).
 */

import {it, expect, describe} from '@jest/globals';
import authReducer, {
  setUserId,
  logout,
  setMobileNumber,
  resetAuthState,
} from '../src/redux/AuthSlice';

describe('auth slice', () => {
  it('setUserId marks the user authenticated', () => {
    const state = authReducer(undefined, setUserId('42'));
    expect(state.userId).toBe('42');
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout clears session fields', () => {
    let state = authReducer(undefined, setUserId('7'));
    state = authReducer(state, setMobileNumber('9876543210'));
    state = authReducer(state, logout());
    expect(state.userId).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('resetAuthState clears OTP flags without dropping userId', () => {
    let state = authReducer(undefined, setUserId('9'));
    state = authReducer(state, resetAuthState());
    expect(state.userId).toBe('9');
    expect(state.otpSent).toBe(false);
    expect(state.otpVerified).toBe(false);
    expect(state.loading).toBe(false);
  });
});
