import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mockUsers } from '../mockDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cccd, password, role } = body;

    if (!cccd || !password || !role) {
      return NextResponse.json(
        { message: 'All required fields must be filled in.' },
        { status: 400 }
      );
    }

    // Accept password '123456' as a demo bypass, otherwise check registered users
    const registeredUser = mockUsers[cccd];
    const isValidPassword =
      password === '123456' || (registeredUser && registeredUser.password === password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Incorrect Citizen ID or password.' },
        { status: 401 }
      );
    }

    // Resolve display name and doctor ID from registered user or fallback
    const userName = registeredUser
      ? registeredUser.fullName
      : role === 'doctor'
      ? 'Dr. Demo Account'
      : 'Patient Demo Account';

    const doctorIdField = registeredUser
      ? registeredUser.doctorId
      : role === 'doctor'
      ? 'DOC-00000'
      : undefined;

    // Issue mock tokens
    const accessToken = 'mock-access-token-' + Date.now();
    const refreshToken = 'mock-refresh-token-' + Date.now();

    // Set HttpOnly cookie for Refresh Token (secure, not accessible via JS)
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      token: accessToken,
      user: {
        cccd,
        userName,
        role,
        doctorId: doctorIdField,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
