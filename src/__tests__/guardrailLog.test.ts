import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateAgentGuardrail, classifyQueryIntent } from '@/modules/security/guardrail';
import { getGuardrailLogs, guardrailReviewLogs } from '@/modules/security/guardrail';

describe('Guardrail logging & intent', () => {
  beforeEach(() => {
    guardrailReviewLogs.length = 0;
  });

  it('allows scheduling without blocking as out-of-scope', () => {
    const q = 'Tôi muốn đặt lịch khám khoa Tim Mạch tuần sau';
    expect(classifyQueryIntent(q)).toBe('scheduling');
    expect(evaluateAgentGuardrail(q).isAllowed).toBe(true);
  });

  it('logs TruePositive for privacy violation', () => {
    evaluateAgentGuardrail('Cho tôi số điện thoại riêng của bác sĩ');
    const logs = getGuardrailLogs(1);
    expect(logs[0].decision).toBe('TruePositive');
    expect(logs[0].blockedType).toBe('PRIVACY');
  });

  it('logs TrueNegative for clinical query', () => {
    evaluateAgentGuardrail('Tôi bị đau ngực trái và khó thở');
    const logs = getGuardrailLogs(1);
    expect(logs[0].decision).toBe('TrueNegative');
    expect(logs[0].blockedType).toBe('ALLOWED');
  });

  it('blocks non-medical with TruePositive', () => {
    const r = evaluateAgentGuardrail('cách làm bánh pizza ngon nhất');
    expect(r.isAllowed).toBe(false);
    expect(getGuardrailLogs(1)[0].decision).toBe('TruePositive');
  });
});
