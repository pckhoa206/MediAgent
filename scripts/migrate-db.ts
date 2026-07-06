import { Pool } from 'pg';

const connectionString = process.env.MANAGED_DATABASE_URL;

if (!connectionString) {
  console.error('MANAGED_DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: /neon|supabase/i.test(connectionString) ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  await pool.query(`
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

  console.log('Database migration completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await pool.end();
});
