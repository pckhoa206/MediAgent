export function isValidCCCD(cccd: string): boolean {
  if (!/^\d{12}$/.test(cccd)) return false;
  const province = parseInt(cccd.slice(0, 3), 10);
  return province >= 1 && province <= 96;
}

export function isValidDoctorId(doctorId: string): boolean {
  return /^DOC-[0-9]{5}$/.test(doctorId);
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must include at least one number.');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must include at least one special character.');
  }
  return { isValid: errors.length === 0, errors };
}
