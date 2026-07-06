import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'mediagent.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    cccd TEXT PRIMARY KEY,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL,
    fullName TEXT NOT NULL,
    dob TEXT,
    gender TEXT,
    doctorId TEXT,
    isActive INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patientCccd TEXT NOT NULL,
    patientName TEXT NOT NULL,
    doctorId TEXT NOT NULL,
    department TEXT NOT NULL,
    slot TEXT NOT NULL,
    slotId TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    rawMaskedContent TEXT,
    triageStatus TEXT,
    departmentToSchedule TEXT,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emr_records (
    id TEXT PRIMARY KEY,
    appointmentId TEXT NOT NULL,
    doctorId TEXT NOT NULL,
    patientCccd TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    prescription TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    ipAddress TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

export function getSqliteDb() {
  return db;
}
