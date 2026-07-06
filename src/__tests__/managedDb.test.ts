import { describe, expect, it } from 'vitest';
import { getDatabaseAdapter } from '@/lib/db/adapter';

describe('database adapter selection', () => {
  it('falls back to sqlite when no managed database URL is configured', () => {
    const adapter = getDatabaseAdapter();
    expect(adapter.getBackendName()).toBe('sqlite');
  });
});
