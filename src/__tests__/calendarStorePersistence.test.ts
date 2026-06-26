import { beforeEach, describe, expect, it } from 'vitest';
import { useCalendarStore } from '../store/useCalendarStore';

describe('useCalendarStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useCalendarStore.setState({
      slots: [
        { id: 'slot-1', time: '08:00 - 09:00', department: 'Khoa Tai - Mũi - Họng', isBooked: false, assignedDoctorId: 'DOC-11223' },
      ],
      appointments: [],
    });
  });

  it('persists updated appointments to browser storage', () => {
    const result = useCalendarStore.getState().bookAppointment({
      patientCccd: '123456789012',
      patientName: 'Nguyen Van A',
      slotId: 'slot-1',
    });

    expect(result).not.toBeNull();
    const persisted = localStorage.getItem('calendar-storage');
    expect(persisted).toContain('123456789012');
    expect(persisted).toContain('Nguyen Van A');
  });
});
