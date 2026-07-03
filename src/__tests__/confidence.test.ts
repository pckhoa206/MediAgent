import { describe, it, expect } from 'vitest';
import { shouldShowConfidence } from '@/modules/clinical/confidence';
import { classifyQueryIntent } from '@/modules/security/guardrail';

describe('Confidence display rules', () => {
  it('shows confidence only for clinical symptom queries with department', () => {
    expect(shouldShowConfidence('Tôi bị đau ngực trái', 'Khoa Tim Mạch')).toBe(true);
  });

  it('hides confidence for scheduling chit-chat', () => {
    expect(classifyQueryIntent('Xin chào, tôi muốn hỏi lịch khám')).toBe('scheduling');
    expect(shouldShowConfidence('Xin chào, tôi muốn hỏi lịch khám', 'Khoa Tim Mạch')).toBe(false);
  });

  it('hides confidence when no department matched', () => {
    expect(shouldShowConfidence('Tôi bị mệt', null)).toBe(false);
  });
});
