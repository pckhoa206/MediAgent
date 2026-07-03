import crypto from 'crypto';
import type { AuthUser, JwtPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET;
const RESOLVED_SECRET = JWT_SECRET || 'medagent_dev_secret_not_for_production';
const ACCESS_EXPIRY = 15 * 60;
const REFRESH_EXPIRY = 7 * 24 * 60 * 60;

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

function sign(payload: string): string {
  return base64UrlEncode(crypto.createHmac('sha256', RESOLVED_SECRET).update(payload).digest());
}

export function createJWT(user: AuthUser, expiresIn = ACCESS_EXPIRY): string {
  const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const iat = Math.floor(Date.now() / 1000);
  const body: JwtPayload = { ...user, iat, exp: iat + expiresIn };
  const encoded = base64UrlEncode(Buffer.from(JSON.stringify(body)));
  return `${header}.${encoded}.${sign(`${header}.${encoded}`)}`;
}

export function verifyJWT(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = sign(`${header}.${payload}`);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const decoded = JSON.parse(base64UrlDecode(payload).toString('utf8')) as JwtPayload;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function createRefreshToken(user: AuthUser): string {
  return createJWT(user, REFRESH_EXPIRY);
}
