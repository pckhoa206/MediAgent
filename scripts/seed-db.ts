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
    INSERT INTO users (cccd, passwordHash, role, fullName, doctorId, isActive)
    VALUES
      ('001234567890', 'demo-hash', 'patient', 'Test Patient', NULL, 1),
      ('DOC-11223', 'demo-hash', 'doctor', 'Dr. Minh Nguyen', 'DOC-11223', 1),
      ('DOC-22334', 'demo-hash', 'doctor', 'Dr. Lan Tran', 'DOC-22334', 1)
    ON CONFLICT (cccd) DO NOTHING;
  `);

  console.log('Seed data inserted.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await pool.end();
});
