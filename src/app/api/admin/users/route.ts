import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { deactivateUser, getAllUsers, updateUserProfile, writeAuditLog } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ['admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized: admin only.' }, { status: 403 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const users = await getAllUsers();
  await writeAuditLog(user.cccd, user.role, 'ADMIN_USERS_READ', 'users', ip);
  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const user = requireAuth(req, ['admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized: admin only.' }, { status: 403 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json() as { cccd: string; updates?: Record<string, unknown>; deactivate?: boolean };
  if (!body.cccd) {
    return NextResponse.json({ message: 'Missing cccd.' }, { status: 400 });
  }

  let updatedUser;
  if (body.deactivate) {
    updatedUser = await deactivateUser(body.cccd);
  } else if (body.updates) {
    updatedUser = await updateUserProfile(body.cccd, body.updates as Record<string, unknown>);
  } else {
    return NextResponse.json({ message: 'No update requested.' }, { status: 400 });
  }

  if (!updatedUser) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  await writeAuditLog(user.cccd, user.role, 'ADMIN_USERS_UPDATE', `user:${body.cccd}`, ip);
  return NextResponse.json({ user: updatedUser });
}
