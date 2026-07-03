import { describe, expect, it } from 'vitest';
import { createSecureBooking } from '../modules/booking/service';
import { submitEMR } from '../modules/emr/service';

describe('booking and EMR flow helpers', () => {
  it('rejects incomplete booking input', async () => {
    const result = await createSecureBooking({
      patientName: '',
      patientCccd: '012345678901',
      slotId: 'slot-1',
      doctorId: 'DOC-11223',
      department: 'Cardiology',
      slot: '09:00',
      secretKey: '12345678901234567890123456789012',
      token: 'token',
    });
    expect(result).toBeNull();
  });

  it('rejects incomplete EMR submission', async () => {
    const result = await submitEMR({
      token: '',
      appointmentId: '',
      patientCccd: '012345678901',
      symptoms: 'headache',
      diagnosis: 'none',
      prescription: 'rest',
    });
    expect(result).toBe(false);
  });
});
