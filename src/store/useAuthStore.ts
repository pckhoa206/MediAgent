import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  role: 'patient' | 'doctor' | null;
  userCccd: string | null;
  userName: string | null;
  doctorId: string | null;
  token: string | null;
  
  login: (params: {
    cccd: string;
    role: 'patient' | 'doctor';
    doctorId?: string;
    userName: string;
    token: string;
  }) => void;
  logout: () => void;
}

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
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
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
