import { encryptData, decryptData } from '@/lib/aesGcm';
import type { AppointmentRecord } from '@/types';

export interface SecureBookingInput {
  patientName: string;
  patientCccd: string;
  slotId: string;
  doctorId: string;
  department: string;
  slot: string;
  secretKey: string;
  token: string;
}

export async function createSecureBooking(input: SecureBookingInput): Promise<AppointmentRecord | null> {
  if (!input.patientName || !input.patientCccd || !input.slotId || !input.doctorId || !input.secretKey) {
    return null;
  }

  const encryptedName = await encryptData(input.patientName, input.secretKey);
  const encryptedCccd = await encryptData(input.patientCccd, input.secretKey);

  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({
      patientName: encryptedName,
      patientCccd: encryptedCccd,
      doctorId: input.doctorId,
      department: input.department,
      slot: input.slot,
      slotId: input.slotId,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { appointment: AppointmentRecord };
  return data.appointment;
}

export async function decryptPatientFields(
  encryptedName: string,
  encryptedCccd: string,
  secretKey: string
): Promise<{ name: string; cccd: string }> {
  return {
    name: await decryptData(encryptedName, secretKey),
    cccd: await decryptData(encryptedCccd, secretKey),
  };
}

export async function fetchAppointments(token: string): Promise<AppointmentRecord[]> {
  const res = await fetch('/api/appointments', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { appointments: AppointmentRecord[] };
  return data.appointments;
}

export async function completeAppointment(
  token: string,
  appointmentId: string
): Promise<boolean> {
  const res = await fetch('/api/appointments', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appointmentId, status: 'COMPLETED' }),
  });
  return res.ok;
}

export async function cancelAppointmentOnServer(
  token: string,
  appointmentId: string
): Promise<boolean> {
  const res = await fetch('/api/appointments', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appointmentId, status: 'CANCELLED' }),
  });
  return res.ok;
}
