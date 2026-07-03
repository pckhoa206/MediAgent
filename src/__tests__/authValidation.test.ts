import { describe, it, expect } from 'vitest';
import { isValidCCCD, isValidDoctorId, validatePasswordStrength } from '../lib/auth/validation';

describe('auth validation helpers', () => {
  it('accepts strong passwords', () => {
    const result = validatePasswordStrength('StrongPass1!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects weak passwords', () => {
    const result = validatePasswordStrength('123456');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters.');
  });

  it('validates CCCD and doctor IDs', () => {
    expect(isValidCCCD('012345678901')).toBe(true);
    expect(isValidCCCD('123')).toBe(false);
    expect(isValidDoctorId('DOC-11223')).toBe(true);
    expect(isValidDoctorId('abc')).toBe(false);
  });
});
