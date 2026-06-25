import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken');

  if (!refreshToken || !refreshToken.value) {
    return NextResponse.json(
      { message: 'Không tìm thấy refresh token.' },
      { status: 401 }
    );
  }

  // Validate the mock refresh token (in a real app, verify signature/DB)
  if (!refreshToken.value.startsWith('mock-refresh-token')) {
    return NextResponse.json(
      { message: 'Refresh token không hợp lệ.' },
      { status: 401 }
    );
  }

  // Generate a new access token
  const newAccessToken = 'mock-access-token-refreshed-' + Date.now();

  return NextResponse.json({
    token: newAccessToken,
  });
}
