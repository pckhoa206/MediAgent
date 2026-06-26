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
}

// Seed Initial Mock Slots
const MOCK_SLOTS: TimeSlot[] = [
  { id: 'slot-1', time: '08:00 - 09:00', department: 'Khoa Tai - Mũi - Họng', isBooked: false, assignedDoctorId: 'DOC-11223' },
  { id: 'slot-2', time: '09:00 - 10:00', department: 'Khoa Tai - Mũi - Họng', isBooked: false, assignedDoctorId: 'DOC-11223' },
  { id: 'slot-3', time: '10:00 - 11:00', department: 'Khoa Tai - Mũi - Họng', isBooked: false, assignedDoctorId: 'DOC-11223' },
  { id: 'slot-4', time: '14:00 - 15:00', department: 'Khoa Tim Mạch', isBooked: false, assignedDoctorId: 'DOC-22334' },
  { id: 'slot-5', time: '15:00 - 16:00', department: 'Khoa Tim Mạch', isBooked: false, assignedDoctorId: 'DOC-22334' }
];

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      slots: MOCK_SLOTS,
      appointments: [],

      initializeSlots: () => {
        set({ slots: MOCK_SLOTS, appointments: [] });
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        slots: state.slots,
        appointments: state.appointments,
      }),
    }
  )
);