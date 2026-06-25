import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendarStore } from '../store/useCalendarStore';

describe('Duplex Calendar WebSocket Synchronization & Race Conditions', () => {
  beforeEach(() => {
    // Reset calendar store state
    useCalendarStore.getState().initializeSlots();
  });

  it('should process simulated doctor cancel events over WS and sync state in real-time', () => {
    // 1. Patient bookings slot-1
    const apt = useCalendarStore.getState().bookAppointment({
      patientCccd: '079123456789',
      patientName: 'Nguyễn Văn A',
      slotId: 'slot-1'
    });

    expect(apt).not.toBeNull();
    expect(useCalendarStore.getState().appointments[0].status).toBe('BOOKED');
    expect(useCalendarStore.getState().slots[0].isBooked).toBe(true);

    // 2. Simulate Doctor Cancels via WebSocket broadcast receiver function
    // We mock the receiver handler that would be linked in useWebSocket hook
    const handleWebSocketEvent = (event: { type: string; payload: any }) => {
      if (event.type === 'APPOINTMENT_CANCELLED') {
        const { appointmentId, doctorId } = event.payload;
        // Direct cancel bypass gate (calls store cancelAction by authenticating as doctor)
        useCalendarStore.getState().cancelAppointment('doctor', doctorId, appointmentId);
      }
    };

    // Trigger simulated WebSocket message
    handleWebSocketEvent({
      type: 'APPOINTMENT_CANCELLED',
      payload: {
        appointmentId: apt!.id,
        doctorId: 'DOC-11223' // Slot-1 assigned doctor
      }
    });

    // Verify Patient view updates instantly to CANCELLED and Slot is freed
    const updatedStore = useCalendarStore.getState();
    expect(updatedStore.appointments[0].status).toBe('CANCELLED');
    expect(updatedStore.slots[0].isBooked).toBe(false);
  });

  it('should prevent race condition corruption when receiving concurrent sync updates', () => {
    // Book slot-1
    const apt = useCalendarStore.getState().bookAppointment({
      patientCccd: '079123456789',
      patientName: 'Nguyễn Văn A',
      slotId: 'slot-1'
    });

    // Simulate two concurrent cancellation events arriving at the same time
    // (e.g. Doctor cancels and Patient cancels simultaneously)
    const cancel1 = () => useCalendarStore.getState().cancelAppointment('patient', '079123456789', apt!.id);
    const cancel2 = () => useCalendarStore.getState().cancelAppointment('doctor', 'DOC-11223', apt!.id);

    // Execute concurrently
    const results = [cancel1(), cancel2()];

    // One should succeed, one may fail or both return true, but the state must be consistent
    expect(results).toContain(true);
    
    // Assert: Appointments array should NOT duplicate items and status remains exactly CANCELLED
    const finalStore = useCalendarStore.getState();
    expect(finalStore.appointments.length).toBe(1);
    expect(finalStore.appointments[0].status).toBe('CANCELLED');
    expect(finalStore.slots[0].isBooked).toBe(false);
  });
});
