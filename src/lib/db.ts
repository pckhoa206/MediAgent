import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureTable(tableName: string) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
  }
}

function readTable<T>(tableName: string): T[] {
  ensureTable(tableName);
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeTable<T>(tableName: string, data: T[]): void {
  ensureTable(tableName);
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export interface DatabaseQueryHelper {
  query: <T = any>(sql: string, params?: any[]) => Promise<{ rows: T[] }>;
}

// Mimic a pg-pool client for PostgreSQL queries
export const db: DatabaseQueryHelper = {
  query: async <T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> => {
    const normalizedSql = sql.trim().replace(/\s+/g, ' ');

    // 1. INSERT INTO users
    if (normalizedSql.startsWith('INSERT INTO users')) {
      const users = readTable<any>('users');
      // INSERT INTO users (id, cccd, password_hash, role, full_name, doctor_id, specialty, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      const user = {
        id: params[0],
        cccd: params[1],
        password_hash: params[2],
        role: params[3],
        full_name: params[4],
        doctor_id: params[5] || null,
        specialty: params[6] || null,
        created_at: params[7] || new Date().toISOString()
      };
      users.push(user);
      writeTable('users', users);
      return { rows: [user as T] };
    }

    // 2. SELECT * FROM users WHERE cccd = $1
    if (normalizedSql.includes('SELECT * FROM users WHERE cccd =')) {
      const users = readTable<any>('users');
      const cccd = params[0];
      const match = users.find(u => u.cccd === cccd);
      return { rows: match ? [match as T] : [] };
    }

    // 3. INSERT INTO appointments
    if (normalizedSql.startsWith('INSERT INTO appointments')) {
      const appointments = readTable<any>('appointments');
      const appointment = {
        id: params[0],
        patient_cccd_encrypted: params[1],
        patient_name_encrypted: params[2],
        department: params[3],
        slot: params[4],
        doctor_id: params[5],
        status: params[6] || 'BOOKED',
        created_at: params[7] || new Date().toISOString()
      };
      appointments.push(appointment);
      writeTable('appointments', appointments);
      return { rows: [appointment as T] };
    }

    // 4. SELECT * FROM appointments
    if (normalizedSql.startsWith('SELECT * FROM appointments')) {
      let appointments = readTable<any>('appointments');
      // If we filter by doctor_id
      if (normalizedSql.includes('doctor_id =')) {
        const doctorId = params[0];
        appointments = appointments.filter(a => a.doctor_id === doctorId);
      }
      return { rows: appointments as T[] };
    }

    // 5. UPDATE appointments SET status =
    if (normalizedSql.startsWith('UPDATE appointments SET status =')) {
      const appointments = readTable<any>('appointments');
      const status = params[0];
      const id = params[1];
      const matchIndex = appointments.findIndex(a => a.id === id);
      if (matchIndex !== -1) {
        appointments[matchIndex].status = status;
        writeTable('appointments', appointments);
        return { rows: [appointments[matchIndex] as T] };
      }
      return { rows: [] };
    }

    // 6. INSERT INTO emr_records
    if (normalizedSql.startsWith('INSERT INTO emr_records')) {
      const records = readTable<any>('emr_records');
      const record = {
        id: params[0],
        appointment_id: params[1],
        patient_cccd_encrypted: params[2],
        symptoms: params[3],
        diagnosis: params[4],
        prescription: params[5],
        doctor_id: params[6],
        created_at: params[7] || new Date().toISOString()
      };
      records.push(record);
      writeTable('emr_records', records);
      return { rows: [record as T] };
    }

    // 7. INSERT INTO audit_logs
    if (normalizedSql.startsWith('INSERT INTO audit_logs')) {
      const logs = readTable<any>('audit_logs');
      const log = {
        id: params[0],
        user_id: params[1] || null,
        role: params[2],
        action: params[3],
        resource: params[4],
        ip_address: params[5] || '127.0.0.1',
        timestamp: params[6] || new Date().toISOString()
      };
      logs.push(log);
      writeTable('audit_logs', logs);
      return { rows: [log as T] };
    }

    return { rows: [] };
  }
};
