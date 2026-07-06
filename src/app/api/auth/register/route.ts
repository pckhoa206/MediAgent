import { NextRequest, NextResponse } from 'next/server';
import { findUser, saveUser, hashPassword, writeAuditLog } from '@/lib/db/store';
import { isValidCCCD, isValidDoctorId, validatePasswordStrength } from '@/lib/auth/validation';
import type { UserRole } from '@/types';

const VALID_DOCTOR_IDS = ['DOC-11223', 'DOC-22334', 'DOC-33445', 'DOC-44556', 'DOC-55667'];

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  try {
    const body = await request.json();
    const { cccd, password, role, fullName, dob, gender, doctorId } = body as {
      cccd: string;
      password: string;
      role: UserRole;
      fullName: string;
      dob?: string;
      gender?: string;
      doctorId?: string;
    };

    if (!cccd || !password || !role || !fullName) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    if (!isValidCCCD(cccd)) {
      return NextResponse.json(
        { message: 'Invalid CCCD: must be 12 digits with a valid province code (001–096).' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ message: passwordValidation.errors[0] }, { status: 400 });
    }

    if (role === 'doctor' && (!doctorId || !isValidDoctorId(doctorId) || !VALID_DOCTOR_IDS.includes(doctorId))) {
      await writeAuditLog(null, role, 'REGISTER_FAIL', `CCCD:${cccd}`, ip);
      return NextResponse.json({ message: 'Invalid Doctor ID.' }, { status: 400 });
    }

    if (await findUser(cccd)) {
      await writeAuditLog(null, role, 'REGISTER_DUPLICATE', `CCCD:${cccd}`, ip);
      return NextResponse.json({ message: 'Account already exists.' }, { status: 409 });
    }

    await saveUser({
      cccd,
      passwordHash: hashPassword(password),
      role,
      fullName,
      dob,
      gender,
      doctorId: role === 'doctor' ? doctorId : undefined,
    });

    await writeAuditLog(cccd, role, 'REGISTER_SUCCESS', `CCCD:${cccd}`, ip);
    return NextResponse.json({ message: 'Registration successful.', success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
