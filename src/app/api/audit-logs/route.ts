import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getAuditLogs, writeAuditLog } from '@/lib/db/store';

/**
 * GET /api/audit-logs
 * Admin-only: returns the last N audit log entries (default 200).
 * Query param: ?limit=50
 */
export async function GET(req: NextRequest) {
  const user = requireAuth(req, ['admin']);
  if (!user) return NextResponse.json({ message: 'Unauthorized: admin only.' }, { status: 403 });

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 1000);

  const logs = await getAuditLogs(limit);
  await writeAuditLog(user.cccd, user.role, 'AUDIT_LOGS_READ', `limit:${limit}`, ip);
  return NextResponse.json({ auditLogs: logs, count: logs.length });
}
