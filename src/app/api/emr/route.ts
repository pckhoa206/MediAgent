import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { saveEMRRecord, getEMRRecords, writeAuditLog } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ['doctor', 'admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { searchParams } = new URL(req.url);
  const appointmentId = searchParams.get('appointmentId') || undefined;

  const doctorId = user.doctorId || user.cccd;
  const records = await getEMRRecords(doctorId, appointmentId);

  await writeAuditLog(user.cccd, user.role, 'EMR_READ', `doctor:${doctorId}`, ip);
  return NextResponse.json({ emrRecords: records });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ['doctor', 'admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();
  const { appointmentId, patientCccd, symptoms, diagnosis, prescription } = body as {
    appointmentId: string;
    patientCccd?: string;
    symptoms: string;
    diagnosis: string;
    prescription?: string;
  };

  if (!appointmentId || !symptoms || !diagnosis) {
    return NextResponse.json({ message: 'Missing EMR fields: appointmentId, symptoms, diagnosis are required.' }, { status: 400 });
  }

  const record = await saveEMRRecord({
    appointmentId,
    doctorId: user.doctorId || user.cccd,
    patientCccd: patientCccd || '',
    symptoms,
    diagnosis,
    prescription: prescription || '',
  });

  await writeAuditLog(user.cccd, user.role, 'EMR_CREATED', `apt:${appointmentId}`, ip);
  return NextResponse.json({ emr: record }, { status: 201 });
}
