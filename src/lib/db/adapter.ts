import { Pool, type QueryResultRow } from 'pg';
import { getSqliteDb } from '@/lib/db/sqlite';

export interface DatabaseAdapter {
  getBackendName(): 'sqlite' | 'postgres';
  get<T = unknown>(query: string, params?: unknown[]): Promise<T | undefined>;
  all<T = unknown>(query: string, params?: unknown[]): Promise<T[]>;
  run(query: string, params?: unknown[]): Promise<unknown>;
}

function toPostgresQuery(query: string, params: unknown[]): { text: string; values: unknown[] } {
  let index = 0;
  const text = query.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
  return { text, values: params };
}

class SqliteAdapter implements DatabaseAdapter {
  getBackendName(): 'sqlite' | 'postgres' {
    return 'sqlite';
  }

  async get<T = unknown>(query: string, params: unknown[] = []): Promise<T | undefined> {
    return getSqliteDb().prepare(query).get(...params) as T | undefined;
  }

  async all<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
    return getSqliteDb().prepare(query).all(...params) as T[];
  }

  async run(query: string, params: unknown[] = []): Promise<unknown> {
    return getSqliteDb().prepare(query).run(...params);
  }
}

class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private initialized = false;

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({ connectionString: process.env.MANAGED_DATABASE_URL });
    }
    return this.pool;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    await this.getPool().query(`
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
    this.initialized = true;
  }

  getBackendName(): 'sqlite' | 'postgres' {
    return 'postgres';
  }

  async get<T = unknown>(query: string, params: unknown[] = []): Promise<T | undefined> {
    await this.ensureInitialized();
    const { text, values } = toPostgresQuery(query, params);
    const result = await this.getPool().query<QueryResultRow>(text, values);
    return result.rows[0] as T | undefined;
  }

  async all<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
    await this.ensureInitialized();
    const { text, values } = toPostgresQuery(query, params);
    const result = await this.getPool().query<QueryResultRow>(text, values);
    return result.rows as T[];
  }

  async run(query: string, params: unknown[] = []): Promise<unknown> {
    await this.ensureInitialized();
    const { text, values } = toPostgresQuery(query, params);
    const result = await this.getPool().query(text, values);
    return result.rowCount;
  }
}

export function getDatabaseAdapter(): DatabaseAdapter {
  if (process.env.MANAGED_DATABASE_URL) {
    return new PostgresAdapter();
  }
  return new SqliteAdapter();
}
