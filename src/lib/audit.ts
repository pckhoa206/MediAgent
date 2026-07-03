import { db } from './db';

export async function logAuditMutation(
  userId: string | null,
  role: string,
  action: string,
  resource: string,
  ipAddress?: string
): Promise<void> {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  await db.query(
    'INSERT INTO audit_logs (id, user_id, role, action, resource, ip_address, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      id,
      userId,
      role,
      action,
      resource,
      ipAddress || '127.0.0.1',
      new Date().toISOString()
    ]
  );
}
