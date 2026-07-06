import { describe, expect, it } from 'vitest';
import { buildPostgresPoolConfig } from '@/lib/db/adapter';

describe('managed database pool config', () => {
  it('enables ssl for Neon and Supabase connection strings', () => {
    const config = buildPostgresPoolConfig('postgresql://user:pass@db.neon.tech:5432/app');
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('returns a standard config for local postgres', () => {
    const config = buildPostgresPoolConfig('postgresql://localhost:5432/medagent');
    expect(config.ssl).toBeUndefined();
  });
});
