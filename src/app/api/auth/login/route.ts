import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUser, verifyPassword, writeAuditLog } from '@/lib/db/store';
import { createJWT, createRefreshToken } from '@/lib/auth/jwt';
import { logEvent } from '@/lib/observability';
import type { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  try {
    const body = await request.json();
    const { cccd, password, role } = body as { cccd: string; password: string; role: UserRole };

    if (!cccd || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const user = await findUser(cccd);
    if (!user || user.role !== role) {
      await writeAuditLog(null, role, 'LOGIN_FAIL', `CCCD:${cccd}`, ip);
      logEvent({ level: 'warn', message: 'login_failed', context: { cccd, role, ip } });
      return NextResponse.json({ message: 'Incorrect credentials.' }, { status: 401 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      await writeAuditLog(cccd, role, 'LOGIN_FAIL_WRONG_PASSWORD', `CCCD:${cccd}`, ip);
      return NextResponse.json({ message: 'Incorrect credentials.' }, { status: 401 });
    }

    const authUser = {
      cccd: user.cccd,
      userName: user.fullName,
      role: user.role,
      doctorId: user.doctorId,
    };

    const accessToken = createJWT(authUser);
    const refreshToken = createRefreshToken(authUser);

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    await writeAuditLog(cccd, role, 'LOGIN_SUCCESS', `CCCD:${cccd}`, ip);
    logEvent({ level: 'info', message: 'login_success', context: { cccd, role, ip } });
    return NextResponse.json({ token: accessToken, user: authUser });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
