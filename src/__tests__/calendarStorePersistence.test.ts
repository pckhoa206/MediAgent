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
    expect(persisted).not.toBeNull();
    // Verify it is encrypted and does not leak cleartext PII
    expect(persisted).not.toContain('123456789012');
    expect(persisted).not.toContain('Nguyen Van A');

    // Verify it can be decrypted successfully using the storage key
    const CryptoJS = require('crypto-js');
    const STORAGE_SECRET = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'mediagent-default-secret-key-32-chars';
    const bytes = CryptoJS.AES.decrypt(persisted!, STORAGE_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    expect(decrypted).toContain('123456789012');
    expect(decrypted).toContain('Nguyen Van A');
  });
});
