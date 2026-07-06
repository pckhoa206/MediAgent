import { beforeEach, describe, expect, it } from 'vitest';
import { deactivateUser, getAllUsers, updateUserProfile } from '../lib/db/store';

describe('admin user management helpers', () => {
  beforeEach(async () => {
    const users = await getAllUsers();
    await Promise.all(Object.keys(users).map(async (cccd) => {
      if (cccd) await deactivateUser(cccd);
    }));
  });

  it('updates a user profile and marks it inactive', async () => {
    await updateUserProfile('001234567890', {
      cccd: '001234567890',
      passwordHash: 'hash',
      role: 'patient',
      fullName: 'Test Patient',
      doctorId: undefined,
      isActive: true,
    });

    const updated = await updateUserProfile('001234567890', { role: 'doctor', doctorId: 'DOC-11223' });
    expect(updated?.role).toBe('doctor');
    expect(updated?.doctorId).toBe('DOC-11223');

    const deactivated = await deactivateUser('001234567890');
    expect(deactivated?.isActive).toBe(false);
  });
});
