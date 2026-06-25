/**
 * Client-side PII Filter Engine
 * Design conforming to AGENTS.md security guidelines (Zero-Trust).
 */

export interface PIIMapping {
  token: string;
  original: string;
}

export interface MaskResult {
  maskedText: string;
  mappings: PIIMapping[];
}

// Regex for Vietnamese Phone Numbers:
// Matches +84 or 0 followed by standard prefixes (3, 5, 7, 8, 9) and 8 digits.
const PHONE_REGEX = /(?:\+84|0)(?:3|5|7|8|9)\d{8}\b/g;

// Regex for Vietnamese Citizen ID (CCCD - 12 digits, CMND - 9 digits)
const CITIZEN_ID_REGEX = /\b\d{12}\b|\b\d{9}\b/g;

// Regex for Vietnamese Names (Starts with common Vietnamese surnames, followed by 1-4 capitalized words)
const VIETNAMESE_SURNAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ',
  'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Lâm', 'Đoàn', 'Trịnh',
  'Mai', 'Đinh', 'Tống', 'Tạ', 'Quách'
];

// Helper to construct name regex dynamically based on common surnames
const surnamePattern = VIETNAMESE_SURNAMES.join('|');
// Capitalized Vietnamese word matching (handles accents)
const wordPattern = '[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐ][a-zàáâãèéêìíòóôõùúýỳỹỷỵđấpấầẩẫậêếềểễệôốồổỗộưứừửữựăắằẳẵặơớờởỡợíìỉĩịúùủũụéèẻẽẹóòỏõọáàảãạýỳỷỹỵ]*';

// A Vietnamese full name starts with a surname and is followed by 1 to 3 words
const NAME_REGEX = new RegExp(`\\b(${surnamePattern})\\s(${wordPattern})(?:\\s${wordPattern}){0,3}\\b`, 'g');

/**
 * Masks Vietnamese PII (Citizen IDs, Phone numbers, and common Vietnamese Full Names).
 * Returns the masked text and the token-to-original map.
 */
export function maskPII(text: string): MaskResult {
  let maskedText = text;
  const mappings: PIIMapping[] = [];
  
  let phoneCounter = 1;
  let idCounter = 1;
  let nameCounter = 1;

  // 1. Mask Phone Numbers
  maskedText = maskedText.replace(PHONE_REGEX, (match) => {
    const token = `[MASKED_PHONE_${phoneCounter++}]`;
    mappings.push({ token, original: match });
    return token;
  });

  // 2. Mask Citizen IDs (CCCD / CMND)
  maskedText = maskedText.replace(CITIZEN_ID_REGEX, (match) => {
    const token = `[MASKED_ID_${idCounter++}]`;
    mappings.push({ token, original: match });
    return token;
  });

  // 3. Mask Names (avoid masking inside existing tokens)
  maskedText = maskedText.replace(NAME_REGEX, (match) => {
    // Avoid double masking if it matches part of a token already created
    if (match.startsWith('[MASKED_')) {
      return match;
    }
    const token = `[MASKED_NAME_${nameCounter++}]`;
    mappings.push({ token, original: match });
    return token;
  });

  return { maskedText, mappings };
}
