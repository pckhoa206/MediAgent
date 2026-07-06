import { describe, it, expect } from 'vitest';
import { GET as healthGET } from '../app/api/health/route';
import { GET as readyGET } from '../app/api/ready/route';

describe('health routes', () => {
  it('returns ok status for health endpoint', async () => {
    const response = await healthGET();
    expect(response.status).toBe(200);
  });

  it('returns ready status for readiness endpoint', async () => {
    const response = await readyGET();
    expect(response.status).toBe(200);
  });
});
