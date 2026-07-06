import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import type { AuthUser, UserRole } from '@/types';

export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export function requireAuth(req: NextRequest, roles?: UserRole[]): AuthUser | null {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = verifyJWT(token);
  if (!payload) return null;
  if (roles && !roles.includes(payload.role)) return null;
  return {
    cccd: payload.cccd,
    userName: payload.userName,
    role: payload.role,
    doctorId: payload.doctorId,
  };
}
