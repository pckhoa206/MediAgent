import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Appointment {
  id: string;
  patientCccd: string;
  patientName: string;
  department: string;
  slot: string;
  doctorId: string;
  status: 'BOOKED' | 'CANCELLED';
}

export interface TimeSlot {
  id: string;
  time: string;
  department: string;
  isBooked: boolean;
  assignedDoctorId: string;
}

interface CalendarState {
  slots: TimeSlot[];
  appointments: Appointment[];
  
  // Actions
  getAppointmentsForUser: (role: 'patient' | 'doctor', userIdentifier: string) => Appointment[];
  bookAppointment: (params: {
    patientCccd: string;
    patientName: string;
    slotId: string;
  }) => Appointment | null;
  cancelAppointment: (role: 'patient' | 'doctor', userIdentifier: string, appointmentId: string) => boolean;
  initializeSlots: () => void;
  setAppointments: (appointments: Appointment[]) => void;
}

// Seed Initial Mock Slots
const MOCK_SLOTS: TimeSlot[] = [
  { id: 'slot-1', time: '08:00 - 09:00', department: 'Khoa Tai - Mũi - Họng', isBooked: false, assignedDoctorId: 'DOC-11223' },
  { id: 'slot-2', time: '09:00 - 10:00', department: 'Khoa Tai - Mũi - Họng', isBooked: false, assignedDoctorId: 'DOC-11223' },
  { id: 'slot-3', time: '10:00 - 11:00', department: 'Khoa Tai - Mũi - Họng', isBooked: false, assignedDoctorId: 'DOC-11223' },
  { id: 'slot-4', time: '14:00 - 15:00', department: 'Khoa Tim Mạch', isBooked: false, assignedDoctorId: 'DOC-22334' },
  { id: 'slot-5', time: '15:00 - 16:00', department: 'Khoa Tim Mạch', isBooked: false, assignedDoctorId: 'DOC-22334' }
];

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
      console.error('[useCalendarStore] Failed to decrypt state', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const encrypted = CryptoJS.AES.encrypt(value, STORAGE_SECRET).toString();
      localStorage.setItem(name, encrypted);
    } catch (e) {
      console.error('[useCalendarStore] Failed to encrypt state', e);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  }
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      slots: MOCK_SLOTS,
      appointments: [],

      initializeSlots: () => {
        set({ slots: MOCK_SLOTS, appointments: [] });
      },

      setAppointments: (appointments) => {
        set((state) => {
          // Sync slots status too based on appointments
          const updatedSlots = state.slots.map(s => {
            const isBooked = appointments.some(apt => apt.slot === s.time && apt.department === s.department && apt.status === 'BOOKED');
            return { ...s, isBooked };
          });
          return { appointments, slots: updatedSlots };
        });
      },

      getAppointmentsForUser: (role, userIdentifier) => {
        const { appointments } = get();

        // RBAC Enforced Data Boundaries
        if (role === 'patient') {
          return appointments.filter(apt => apt.patientCccd === userIdentifier);
        } else if (role === 'doctor') {
          return appointments.filter(apt => apt.doctorId === userIdentifier);
        }

        return [];
      },

      bookAppointment: ({ patientCccd, patientName, slotId }) => {
        const { slots } = get();
        const slotIndex = slots.findIndex(s => s.id === slotId);

        if (slotIndex === -1 || slots[slotIndex].isBooked) {
          return null;
        }

        const slot = slots[slotIndex];
        const newAppointment: Appointment = {
          id: crypto.randomUUID(),
          patientCccd,
          patientName,
          department: slot.department,
          slot: slot.time,
          doctorId: slot.assignedDoctorId,
          status: 'BOOKED'
        };

        set((state) => {
          const updatedSlots = [...state.slots];
          updatedSlots[slotIndex] = { ...slot, isBooked: true };
          return {
            slots: updatedSlots,
            appointments: [...state.appointments, newAppointment]
          };
        });

        return newAppointment;
      },

      cancelAppointment: (role, userIdentifier, appointmentId) => {
        const { appointments } = get();
        const aptIndex = appointments.findIndex(a => a.id === appointmentId);

        if (aptIndex === -1) return false;

        const appointment = appointments[aptIndex];

        if (role === 'patient' && appointment.patientCccd !== userIdentifier) {
          return false;
        }
        if (role === 'doctor' && appointment.doctorId !== userIdentifier) {
          return false;
        }

        set((state) => {
          const updatedAppointments = state.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'CANCELLED' as const } : a
          );

          const updatedSlots = state.slots.map((s) =>
            s.time === appointment.slot && s.department === appointment.department
              ? { ...s, isBooked: false }
              : s
          );

          return {
            appointments: updatedAppointments,
            slots: updatedSlots
          };
        });

        return true;
      }
    }),
    {
      name: 'calendar-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        slots: state.slots,
        appointments: state.appointments,
      }),
    }
  )
);