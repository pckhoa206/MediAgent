import crypto from 'crypto';
import type { AppointmentRecord, ChatMessageRecord, EMRRecord, UserRole } from '@/types';
import { getDatabaseAdapter } from '@/lib/db/adapter';

// ────────────────────────────── Types ──────────────────────────────

interface StoredUser {
  cccd: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  dob?: string;
  gender?: string;
  doctorId?: string;
  isActive?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  role: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
}

// ─────────────────────────── DB helpers ────────────────────────────

function normalizeUser(user: StoredUser): StoredUser {
  return {
    ...user,
    isActive: user.isActive ?? true,
  };
}

export function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT || 'medagent_salt';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function ensureDb(): void {
  void getDatabaseAdapter();
}

function readDb(): Record<string, unknown> {
  ensureDb();
  return {};
}

function writeDb(_db: Record<string, unknown>): void {
  ensureDb();
}

export function verifyPassword(password: string, hash: string): boolean {
  const candidate = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export async function findUser(cccd: string): Promise<StoredUser | null> {
  const adapter = getDatabaseAdapter();
  const row = await adapter.get<
    | { cccd: string; passwordHash: string; role: UserRole; fullName: string; dob?: string; gender?: string; doctorId?: string; isActive: number }
    | undefined
  >('SELECT * FROM users WHERE cccd = ?', [cccd]);
  if (!row) return null;
  return normalizeUser({
    cccd: row.cccd,
    passwordHash: row.passwordHash,
    role: row.role,
    fullName: row.fullName,
    dob: row.dob,
    gender: row.gender,
    doctorId: row.doctorId,
    isActive: Boolean(row.isActive),
  });
}

export async function saveUser(user: StoredUser): Promise<void> {
  const adapter = getDatabaseAdapter();
  await adapter.run(
    `
      INSERT INTO users (cccd, passwordHash, role, fullName, dob, gender, doctorId, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(cccd) DO UPDATE SET
        passwordHash=excluded.passwordHash,
        role=excluded.role,
        fullName=excluded.fullName,
        dob=excluded.dob,
        gender=excluded.gender,
        doctorId=excluded.doctorId,
        isActive=excluded.isActive
    `,
    [user.cccd, user.passwordHash, user.role, user.fullName, user.dob || null, user.gender || null, user.doctorId || null, user.isActive === false ? 0 : 1]
  );
}

export async function getAllUsers(): Promise<Record<string, StoredUser>> {
  const adapter = getDatabaseAdapter();
  const rows = await adapter.all<{
    cccd: string; passwordHash: string; role: UserRole; fullName: string; dob?: string; gender?: string; doctorId?: string; isActive: number;
  }>('SELECT * FROM users ORDER BY fullName');
  return Object.fromEntries(rows.map((row) => [row.cccd, normalizeUser({
    cccd: row.cccd,
    passwordHash: row.passwordHash,
    role: row.role,
    fullName: row.fullName,
    dob: row.dob,
    gender: row.gender,
    doctorId: row.doctorId,
    isActive: Boolean(row.isActive),
  })]));
}

export async function updateUserProfile(cccd: string, updates: Partial<StoredUser> | Record<string, unknown>): Promise<StoredUser | null> {
  const existing = await findUser(cccd);
  const safeUpdates = updates as Partial<StoredUser>;
  const next = normalizeUser({
    ...(existing ?? {
      cccd,
      passwordHash: '',
      role: 'patient',
      fullName: '',
      isActive: true,
    }),
    ...safeUpdates,
    cccd,
  });
  await saveUser(next);
  return next;
}

export async function deactivateUser(cccd: string): Promise<StoredUser | null> {
  return updateUserProfile(cccd, { isActive: false });
}

export async function createAppointment(record: Omit<AppointmentRecord, 'id' | 'createdAt'>): Promise<AppointmentRecord> {
  const apt: AppointmentRecord = { ...record, id: crypto.randomUUID(), createdAt: Date.now() };
  const adapter = getDatabaseAdapter();
  await adapter.run(
    `
      INSERT INTO appointments (id, patientCccd, patientName, doctorId, department, slot, slotId, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [apt.id, apt.patientCccd, apt.patientName, apt.doctorId, apt.department, apt.slot, apt.slotId, apt.status, apt.createdAt]
  );
  return apt;
}

export async function getAppointmentsForUser(role: UserRole, identifier: string): Promise<AppointmentRecord[]> {
  const adapter = getDatabaseAdapter();
  const rows = role === 'patient'
    ? await adapter.all<AppointmentRecord>('SELECT * FROM appointments WHERE patientCccd = ? ORDER BY createdAt DESC', [identifier])
    : role === 'doctor'
      ? await adapter.all<AppointmentRecord>('SELECT * FROM appointments WHERE doctorId = ? ORDER BY createdAt DESC', [identifier])
      : await adapter.all<AppointmentRecord>('SELECT * FROM appointments ORDER BY createdAt DESC');
  return rows as AppointmentRecord[];
}

export async function updateAppointmentStatus(
  id: string,
  role: UserRole,
  identifier: string,
  status: AppointmentRecord['status']
): Promise<boolean> {
  const adapter = getDatabaseAdapter();
  const existing = await adapter.get<AppointmentRecord>('SELECT * FROM appointments WHERE id = ?', [id]);
  if (!existing) return false;
  if (role === 'patient' && existing.patientCccd !== identifier) return false;
  if (role === 'doctor' && existing.doctorId !== identifier) return false;
  await adapter.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
  return true;
}

export async function saveChatMessage(msg: ChatMessageRecord): Promise<ChatMessageRecord> {
  const adapter = getDatabaseAdapter();
  await adapter.run(
    `
      INSERT INTO chat_messages (id, userId, sessionId, role, content, rawMaskedContent, triageStatus, departmentToSchedule, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [msg.id, msg.userId, msg.sessionId, msg.role, msg.content, msg.rawMaskedContent || null, msg.triageStatus || null, msg.departmentToSchedule || null, msg.timestamp]
  );
  return msg;
}

export async function getChatMessages(userId: string, sessionId?: string): Promise<ChatMessageRecord[]> {
  const adapter = getDatabaseAdapter();
  const rows = sessionId
    ? await adapter.all<ChatMessageRecord>('SELECT * FROM chat_messages WHERE userId = ? AND sessionId = ? ORDER BY timestamp ASC', [userId, sessionId])
    : await adapter.all<ChatMessageRecord>('SELECT * FROM chat_messages WHERE userId = ? ORDER BY timestamp ASC', [userId]);
  return rows as ChatMessageRecord[];
}

export async function saveEMRRecord(record: Omit<EMRRecord, 'id' | 'createdAt'>): Promise<EMRRecord> {
  const emr: EMRRecord = { ...record, id: crypto.randomUUID(), createdAt: Date.now() };
  const adapter = getDatabaseAdapter();
  await adapter.run(
    `
      INSERT INTO emr_records (id, appointmentId, doctorId, patientCccd, symptoms, diagnosis, prescription, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [emr.id, emr.appointmentId, emr.doctorId, emr.patientCccd, emr.symptoms, emr.diagnosis, emr.prescription, emr.createdAt]
  );
  return emr;
}

export async function getEMRRecords(doctorId: string, appointmentId?: string): Promise<EMRRecord[]> {
  const adapter = getDatabaseAdapter();
  const rows = appointmentId
    ? await adapter.all<EMRRecord>('SELECT * FROM emr_records WHERE doctorId = ? AND appointmentId = ? ORDER BY createdAt DESC', [doctorId, appointmentId])
    : await adapter.all<EMRRecord>('SELECT * FROM emr_records WHERE doctorId = ? ORDER BY createdAt DESC', [doctorId]);
  return rows as EMRRecord[];
}

// ─────────────────────── HIPAA Audit Logging ───────────────────────

export async function writeAuditLog(
  userId: string | null,
  role: string,
  action: string,
  resource: string,
  ipAddress = '127.0.0.1'
): Promise<void> {
  try {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      userId,
      role,
      action,
      resource,
      ipAddress,
      timestamp: new Date().toISOString(),
    };
    const adapter = getDatabaseAdapter();
    await adapter.run(
      `
        INSERT INTO audit_logs (id, userId, role, action, resource, ipAddress, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [log.id, log.userId, log.role, log.action, log.resource, log.ipAddress, log.timestamp]
    );
  } catch {
    // Never let audit failure break a request
  }
}

export async function getAuditLogs(limit = 200): Promise<AuditLog[]> {
  const adapter = getDatabaseAdapter();
  const rows = await adapter.all<AuditLog>('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
  return rows;
}

export type { StoredUser };
