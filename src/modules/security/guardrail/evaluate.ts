import type { GuardrailResult, QueryIntent } from '@/types';
import { logGuardrailDecision } from './logger';
import { detectLanguage } from '@/utils/language';

const PRIVACY_PATTERNS = [
  /hồ sơ của bệnh nhân/i, /hồ sơ bệnh án/i, /bệnh án của/i,
  /số điện thoại riêng/i, /số điện thoại của/i, /sđt riêng/i, /sđt của/i,
  /thông tin cá nhân của/i, /địa chỉ nhà riêng/i, /lịch trình của bác sĩ/i,
  /mã thẻ bhyt/i, /CCCD của/i, /thông tin thẻ/i, /email riêng của/i,
  // English privacy patterns
  /medical record/i, /medical history/i, /patient file/i, /patient history/i,
  /private phone number/i, /private sđt/i, /personal phone number/i, /phone number of/i,
  /national id of/i, /national id card of/i, /social security number/i, /ssn/i,
  /citizen identity/i, /citizen identification/i, /cccd of/i, /private email/i
];

const MEDICAL_KEYWORDS = [
  'đau', 'mỏi', 'nhức', 'mệt', 'khó thở', 'tức ngực', 'ù tai', 'chóng mặt',
  'sốt', 'ho', 'sổ mũi', 'cảm', 'nghẹt mũi', 'y khoa', 'sức khỏe', 'bác sĩ',
  'khám', 'bệnh', 'thuốc', 'điều trị', 'triệu chứng', 'chẩn đoán', 'bệnh lý',
  'viêm', 'nhiễm trùng', 'ung thư', 'tim mạch', 'dị ứng', 'tiểu buốt', 'buồn nôn',
  'symptom', 'pain', 'fever', 'cough', 'diagnosis', 'clinical', 'health',
];

const SCHEDULING_KEYWORDS = [
  'đặt lịch', 'hẹn khám', 'lịch khám', 'lịch hẹn', 'book', 'schedule',
  'appointment', 'đăng ký khám', 'lên lịch',
];

const PROCEDURE_KEYWORDS = [
  'thủ tục', 'bảo hiểm', 'bhyt', 'giấy xác nhận', 'mua thuốc', 'hướng dẫn',
  'procedure', 'insurance', 'paperwork',
];

const SOCIAL_PATTERNS = [
  /^(?:chào|hello|hi|xin chào|good morning|good evening)\b/i,
  /cảm ơn|thank you|thanks/i,
  /tạm biệt|goodbye|bye/i,
];

const NON_MEDICAL_PATTERNS = [
  /làm bánh/i, /nấu ăn/i, /công thức/i, /lập trình/i, /\bcode\b/i,
  /thời tiết/i, /game/i, /pizza/i, /tin tức thời sự/i, /bóng đá/i,
  /crypto/i, /bitcoin/i, /chứng khoán/i,
  // English non-medical patterns
  /baking/i, /cooking/i, /recipe/i, /programming/i,
  /weather/i, /football/i, /soccer/i, /news/i, /stock market/i
];

const PRIVACY_RESPONSE =
  'Tôi không thể cung cấp thông tin cá nhân hoặc riêng tư của người khác. Tôi chỉ hỗ trợ các vấn đề liên quan đến sức khỏe của riêng bạn.';

const PRIVACY_RESPONSE_EN =
  'I cannot provide personal or private information of others. I only support health-related issues of your own.';

const OUT_OF_SCOPE_RESPONSE =
  'Tôi là Trợ lý Y tế MedConcierge AI. Câu hỏi của bạn nằm ngoài phạm vi y học và sức khỏe. Tôi chỉ có thể hỗ trợ các vấn đề liên quan đến lâm sàng, lịch hẹn và hồ sơ bệnh án của bạn.';

const OUT_OF_SCOPE_RESPONSE_EN =
  'I am CareAgent AI, your smart medical assistant. Your query is outside the scope of medicine and health. I can only assist with clinical inquiries, appointments, and medical information.';

function includesKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = `(?<![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỷỹỵđĐ])` +
      escaped +
      `(?![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỷỹỵđĐ])`;
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(lower);
    } catch (e) {
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỷỹỵđĐ])${escaped}(?:$|[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỷỹỵđĐ])`, 'i');
      return regex.test(lower);
    }
  });
}

export function classifyQueryIntent(query: string): QueryIntent {
  const trimmed = query.trim();
  if (SOCIAL_PATTERNS.some((p) => p.test(trimmed)) && trimmed.split(/\s+/).length <= 4) {
    return 'social';
  }
  if (includesKeyword(trimmed, SCHEDULING_KEYWORDS)) return 'scheduling';
  if (includesKeyword(trimmed, PROCEDURE_KEYWORDS)) return 'procedure';
  if (includesKeyword(trimmed, MEDICAL_KEYWORDS)) return 'clinical';
  return 'unknown';
}

export function evaluateAgentGuardrail(query: string, lang?: 'vi' | 'en'): GuardrailResult {
  const trimmed = query.trim();
  const intent = classifyQueryIntent(trimmed);
  const detectedLang = lang || detectLanguage(trimmed);

  const privacyResponse = detectedLang === 'en' ? PRIVACY_RESPONSE_EN : PRIVACY_RESPONSE;
  const outOfScopeResponse = detectedLang === 'en' ? OUT_OF_SCOPE_RESPONSE_EN : OUT_OF_SCOPE_RESPONSE;

  if (PRIVACY_PATTERNS.some((p) => p.test(trimmed))) {
    logGuardrailDecision({
      query: trimmed,
      blockedType: 'PRIVACY',
      decision: 'TruePositive',
      reason: 'Privacy phrase matched',
    });
    return { isAllowed: false, blockedType: 'PRIVACY', response: privacyResponse, reason: 'Privacy' };
  }

  if (NON_MEDICAL_PATTERNS.some((p) => p.test(trimmed))) {
    logGuardrailDecision({
      query: trimmed,
      blockedType: 'OUT_OF_SCOPE',
      decision: 'TruePositive',
      reason: 'Non-medical topic detected',
    });
    return { isAllowed: false, blockedType: 'OUT_OF_SCOPE', response: outOfScopeResponse };
  }

  if (intent === 'scheduling' || intent === 'procedure' || intent === 'social') {
    logGuardrailDecision({
      query: trimmed,
      blockedType: 'ALLOWED',
      decision: 'TrueNegative',
      reason: `Allowed ${intent} query`,
    });
    return { isAllowed: true };
  }

  const hasMedical = includesKeyword(trimmed, MEDICAL_KEYWORDS);
  const wordCount = trimmed.split(/\s+/).length;

  if (!hasMedical && wordCount > 3) {
    logGuardrailDecision({
      query: trimmed,
      blockedType: 'OUT_OF_SCOPE',
      decision: hasMedical ? 'FalsePositive' : 'TruePositive',
      reason: 'No medical context in long query',
    });
    return { isAllowed: false, blockedType: 'OUT_OF_SCOPE', response: outOfScopeResponse };
  }

  logGuardrailDecision({
    query: trimmed,
    blockedType: 'ALLOWED',
    decision: 'TrueNegative',
    reason: 'Medical context allowed',
  });
  return { isAllowed: true };
}

export { PRIVACY_RESPONSE, PRIVACY_RESPONSE_EN, OUT_OF_SCOPE_RESPONSE, OUT_OF_SCOPE_RESPONSE_EN };

