import { describe, it, expect } from 'vitest';
import { maskPII, restorePII } from '@/modules/security/pii';

describe('Advanced PII masking — nested & multi-type', () => {
  it('masks email, BHYT, address, foreign name in one sentence', () => {
    const input =
      'John Smith lives at 123 Nguyen Hue Street District 1, email john@clinic.org, BHYT 1234567890123.';
    const { maskedText, mappings } = maskPII(input);
    expect(maskedText).not.toContain('john@clinic.org');
    expect(maskedText).not.toContain('John Smith');
    expect(mappings.length).toBeGreaterThanOrEqual(2);
    expect(restorePII(maskedText, mappings)).toBe(input);
  });

  it('handles nested PII: name wrapping phone and CCCD', () => {
    const input = 'Bệnh nhân Nguyễn Văn A gọi 0903123456, CCCD 079123456789.';
    const { maskedText, mappings } = maskPII(input);
    expect(maskedText).not.toMatch(/0903123456|079123456789|Nguyễn Văn A/);
    expect(restorePII(maskedText, mappings)).toBe(input);
  });

  it('does not double-mask existing tokens', () => {
    const input = 'Liên hệ [MASKED_NAME_1] qua [MASKED_PHONE_1].';
    const { maskedText, mappings } = maskPII(input);
    expect(maskedText).toBe(input);
    expect(mappings.length).toBe(0);
  });

  it('masks overlapping Vietnamese name + foreign name in same text', () => {
    const input = 'Bác sĩ Trần Thị Mai và Dr Sarah Johnson khám bệnh.';
    const { maskedText, mappings } = maskPII(input);
    expect(maskedText).not.toContain('Trần Thị Mai');
    expect(maskedText).not.toContain('Sarah Johnson');
    expect(restorePII(maskedText, mappings)).toBe(input);
  });
});
