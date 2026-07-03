import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, createJWT } from '@/lib/auth/jwt';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token.' }, { status: 401 });
    }

    const payload = verifyJWT(refreshToken);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid refresh token.' }, { status: 401 });
    }

    const accessToken = createJWT({
      cccd: payload.cccd,
      userName: payload.userName,
      role: payload.role,
      doctorId: payload.doctorId,
    });

    return NextResponse.json({ token: accessToken });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
