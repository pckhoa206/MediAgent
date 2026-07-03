import type { GuardrailLogEntry } from '@/types';

export const guardrailReviewLogs: GuardrailLogEntry[] = [];

export function logGuardrailDecision(
  entry: Omit<GuardrailLogEntry, 'id' | 'timestamp'>
): GuardrailLogEntry {
  const record: GuardrailLogEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...entry,
  };
  guardrailReviewLogs.push(record);
  if (guardrailReviewLogs.length > 500) guardrailReviewLogs.shift();
  return record;
}

export function getGuardrailLogs(limit = 50): GuardrailLogEntry[] {
  return guardrailReviewLogs.slice(-limit);
}
