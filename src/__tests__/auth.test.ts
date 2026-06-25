import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.role).toBeNull();
  });

  it('should login successfully and set state', () => {
    useAuthStore.getState().login({
      cccd: '012345678901',
      role: 'patient',
      userName: 'Trần Thị B',
      token: 'mock-token-123'
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.role).toBe('patient');
    expect(state.token).toBe('mock-token-123');
    expect(state.userCccd).toBe('012345678901');
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().login({
      cccd: '012345678901',
      role: 'patient',
      userName: 'Trần Thị B',
      token: 'mock-token-123'
    });
    
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.role).toBeNull();
  });
});
