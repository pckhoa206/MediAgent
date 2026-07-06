import { describe, it, expect } from 'vitest';
import { maskPII } from '../security/piiFilter';
import { restorePII } from '../security/tokenMapper';

describe('Zero-Trust PII Masking & Context Restoral Engine', () => {
  it('should mask Vietnamese CCCD (12 digits) and CMND (9 digits)', () => {
    const input = 'Số CCCD của tôi là 079123456789 và CMND cũ là 123456789.';
    const { maskedText, mappings } = maskPII(input);

    expect(maskedText).toContain('[MASKED_ID_1]');
    expect(maskedText).toContain('[MASKED_ID_2]');
    expect(maskedText).not.toContain('079123456789');
    expect(maskedText).not.toContain('123456789');

    // Restore PII and verify exact reconstruction
    const restoredText = restorePII(maskedText, mappings);
    expect(restoredText).toBe(input);
  });

  it('should mask Vietnamese phone numbers starting with 0 or +84', () => {
    const input = 'Số điện thoại của tôi là 0903123456 hoặc +84918234567.';
    const { maskedText, mappings } = maskPII(input);

    expect(maskedText).toContain('[MASKED_PHONE_1]');
    expect(maskedText).toContain('[MASKED_PHONE_2]');
    expect(maskedText).not.toContain('0903123456');
    expect(maskedText).not.toContain('+84918234567');

    const restoredText = restorePII(maskedText, mappings);
    expect(restoredText).toBe(input);
  });

  it('should mask Vietnamese full names starting with common surnames', () => {
    const input = 'Tên tôi là Nguyễn Văn A và bác sĩ điều trị là Trần Thị Tuyết Mai.';
    const { maskedText, mappings } = maskPII(input);

    expect(maskedText).toContain('[MASKED_NAME_1]');
    expect(maskedText).toContain('[MASKED_NAME_2]');
    expect(maskedText).not.toContain('Nguyễn Văn A');
    expect(maskedText).not.toContain('Trần Thị Tuyết Mai');

    const restoredText = restorePII(maskedText, mappings);
    expect(restoredText).toBe(input);
  });

  it('should preserve formatting and other words', () => {
    const input = 'Chào bác sĩ, tôi bị đau ngực trái lan ra tay từ tối qua.';
    const { maskedText, mappings } = maskPII(input);

    expect(maskedText).toBe(input);
    expect(mappings.length).toBe(0);
  });
});
