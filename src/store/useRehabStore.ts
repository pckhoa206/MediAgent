import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import CryptoJS from 'crypto-js';

export interface RehabExercise {
  id: string;
  name: string;
  duration: string;
  frequency: string;
  status: 'TODO' | 'COMPLETED';
}

interface RehabState {
  exercises: RehabExercise[];
  deleteExercise: (id: string) => void;
  completeExercise: (id: string) => void;
  addExercise: (name: string, duration: string, frequency: string) => void;
  resetExercises: () => void;
}

const DEFAULT_EXERCISES: RehabExercise[] = [
  { id: 'ex-1', name: 'Tập căng cơ vai (Căng cơ Delta & cơ chóp xoay)', duration: '15 phút', frequency: '2 lần/ngày', status: 'TODO' },
  { id: 'ex-2', name: 'Đi bộ nhẹ nhàng hỗ trợ hô hấp & tim mạch', duration: '30 phút', frequency: '1 lần/ngày', status: 'TODO' },
  { id: 'ex-3', name: 'Tập duỗi khớp gối thụ động (Phục hồi khớp)', duration: '10 phút', frequency: '3 lần/ngày', status: 'TODO' }
];

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
      console.error('[useRehabStore] Failed to decrypt state', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const encrypted = CryptoJS.AES.encrypt(value, STORAGE_SECRET).toString();
      localStorage.setItem(name, encrypted);
    } catch (e) {
      console.error('[useRehabStore] Failed to encrypt state', e);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  }
};

export const useRehabStore = create<RehabState>()(
  persist(
    (set) => ({
      exercises: DEFAULT_EXERCISES,

      deleteExercise: (id) => {
        set((state) => ({
          exercises: state.exercises.filter((ex) => ex.id !== id)
        }));
      },

      completeExercise: (id) => {
        set((state) => ({
          exercises: state.exercises.map((ex) =>
            ex.id === id
              ? { ...ex, status: ex.status === 'TODO' ? 'COMPLETED' : 'TODO' }
              : ex
          )
        }));
      },

      addExercise: (name, duration, frequency) => {
        const newExercise: RehabExercise = {
          id: `ex-${Date.now()}`,
          name,
          duration,
          frequency,
          status: 'TODO'
        };
        set((state) => ({
          exercises: [...state.exercises, newExercise]
        }));
      },

      resetExercises: () => {
        set({ exercises: DEFAULT_EXERCISES });
      }
    }),
    {
      name: 'rehab-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        exercises: state.exercises,
      }),
    }
  )
);
