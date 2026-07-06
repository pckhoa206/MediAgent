import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import {
  createAppointment,
  getAppointmentsForUser,
  updateAppointmentStatus,
  writeAuditLog,
} from '@/lib/db/store';
import { logEvent } from '@/lib/observability';
import type { AppointmentRecord } from '@/types';

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ['patient', 'doctor', 'admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const id = user.role === 'patient' ? user.cccd : user.doctorId || user.cccd;
  const appointments = await getAppointmentsForUser(user.role, id);

  await writeAuditLog(user.cccd, user.role, 'APPOINTMENTS_READ', `user:${id}`, ip);
  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ['patient', 'admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();
  const { patientName, patientCccd, doctorId, department, slot, slotId } = body as {
    patientName: string;
    patientCccd: string;
    doctorId: string;
    department?: string;
    slot?: string;
    slotId: string;
  };

  if (!patientName || !patientCccd || !doctorId || !slotId) {
    return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
  }

  // Patients can only book for themselves
  if (user.role === 'patient' && user.cccd !== patientCccd) {
    await writeAuditLog(user.cccd, user.role, 'APT_BOOK_FORBIDDEN', `target:${patientCccd}`, ip);
    return NextResponse.json({ message: 'Forbidden: cannot book for another patient.' }, { status: 403 });
  }

  logEvent({ level: 'info', message: 'appointment_created', context: { user: user.cccd, doctorId, slotId } });
  const apt = await createAppointment({
    patientCccd,
    patientName,
    doctorId,
    department: department || 'General',
    slot: slot || slotId,
    slotId,
    status: 'BOOKED',
  });

  await writeAuditLog(user.cccd, user.role, 'APT_BOOKED', `apt:${apt.id}`, ip);
  return NextResponse.json({ appointment: apt }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = requireAuth(req, ['patient', 'doctor', 'admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { appointmentId, status } = await req.json() as { appointmentId: string; status: string };
  const allowedStatuses: AppointmentRecord['status'][] = ['BOOKED', 'CANCELLED', 'COMPLETED'];
  if (!allowedStatuses.includes(status as AppointmentRecord['status'])) {
    return NextResponse.json({ message: 'Invalid appointment status.' }, { status: 400 });
  }

  const id = user.role === 'patient' ? user.cccd : user.doctorId || user.cccd;
  const ok = await updateAppointmentStatus(appointmentId, user.role, id, status as AppointmentRecord['status']);

  if (!ok) {
    await writeAuditLog(user.cccd, user.role, 'APT_UPDATE_FORBIDDEN', `apt:${appointmentId}`, ip);
    return NextResponse.json({ message: 'Forbidden or not found.' }, { status: 403 });
  }

  await writeAuditLog(user.cccd, user.role, 'APT_STATUS_UPDATED', `apt:${appointmentId}→${status}`, ip);
  logEvent({ level: 'info', message: 'appointment_status_updated', context: { appointmentId, status, role: user.role } });
  return NextResponse.json({ success: true });
}
