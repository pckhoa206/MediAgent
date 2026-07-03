import type { MaskResult, PIIMapping } from '@/types';
import {
  ADDRESS_REGEX,
  BHYT_REGEX,
  CITIZEN_ID_REGEX,
  EMAIL_REGEX,
  FOREIGN_NAME_REGEX,
  ASCII_FULL_NAME_REGEX,
  PHONE_REGEX,
  VIETNAMESE_NAME_REGEX,
} from './patterns';

interface IndexCounter {
  value: number;
}

function replaceWithToken(
  text: string,
  regex: RegExp,
  prefix: string,
  mappings: PIIMapping[],
  counter: IndexCounter
): string {
  return text.replace(regex, (match) => {
    if (match.startsWith('[MASKED_')) return match;
    const token = `[MASKED_${prefix}_${counter.value++}]`;
    mappings.push({ token, original: match });
    return token;
  });
}

export function maskPII(text: string): MaskResult {
  let maskedText = text;
  const mappings: PIIMapping[] = [];

  const nameCounter = { value: 1 };

  maskedText = replaceWithToken(maskedText, PHONE_REGEX, 'PHONE', mappings, { value: 1 });
  maskedText = replaceWithToken(maskedText, CITIZEN_ID_REGEX, 'ID', mappings, { value: 1 });
  maskedText = replaceWithToken(maskedText, EMAIL_REGEX, 'EMAIL', mappings, { value: 1 });
  maskedText = replaceWithToken(maskedText, BHYT_REGEX, 'BHYT', mappings, { value: 1 });
  maskedText = replaceWithToken(maskedText, ADDRESS_REGEX, 'ADDRESS', mappings, { value: 1 });
  maskedText = replaceWithToken(maskedText, VIETNAMESE_NAME_REGEX, 'NAME', mappings, nameCounter);
  maskedText = maskedText.replace(FOREIGN_NAME_REGEX, (match) => {
    if (match.startsWith('[MASKED_')) return match;
    const token = `[MASKED_NAME_${nameCounter.value++}]`;
    mappings.push({ token, original: match });
    return token;
  });
  maskedText = maskedText.replace(ASCII_FULL_NAME_REGEX, (match) => {
    if (!/^[\x20-\x7E]+$/.test(match) || match.startsWith('[MASKED_')) return match;
    const token = `[MASKED_NAME_${nameCounter.value++}]`;
    mappings.push({ token, original: match });
    return token;
  });

  return { maskedText, mappings };
}

export function restorePII(text: string, mappings: PIIMapping[]): string {
  let restored = text;
  const sorted = [...mappings].sort((a, b) => b.token.length - a.token.length);
  for (const mapping of sorted) {
    const escaped = mapping.token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    restored = restored.replace(new RegExp(escaped, 'g'), mapping.original);
  }
  return restored;
}
