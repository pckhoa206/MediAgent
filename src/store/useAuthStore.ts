import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  role: 'patient' | 'doctor' | 'admin' | null;
  userCccd: string | null;
  userName: string | null;
  doctorId: string | null;
  token: string | null;
  
  login: (params: {
    cccd: string;
    role: 'patient' | 'doctor' | 'admin';
    doctorId?: string;
    userName: string;
    token: string;
  }) => void;
  logout: () => void;
}

import CryptoJS from 'crypto-js';

const STORAGE_SECRET = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_CRYPTO_SECRET
  ? process.env.NEXT_PUBLIC_CRYPTO_SECRET
  : 'mediagent-default-secret-key-32-chars';

const secureStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(raw, STORAGE_SECRET);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || null;
    } catch (e) {
      console.error('[useAuthStore] Failed to decrypt state', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const encrypted = CryptoJS.AES.encrypt(value, STORAGE_SECRET).toString();
      localStorage.setItem(name, encrypted);
    } catch (e) {
      console.error('[useAuthStore] Failed to encrypt state', e);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      userCccd: null,
      userName: null,
      doctorId: null,
      token: null,

      login: ({ cccd, role, doctorId, userName, token }) => {
        set({
          isAuthenticated: true,
          role,
          userCccd: cccd,
          userName,
          doctorId: doctorId || null,
          token,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          role: null,
          userCccd: null,
          userName: null,
          doctorId: null,
          token: null,
        });
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('auth-storage');
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        userCccd: state.userCccd,
        userName: state.userName,
        doctorId: state.doctorId,
        token: state.token,
      }),
    }
  )
);
