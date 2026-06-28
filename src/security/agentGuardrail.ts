/**
 * MedConcierge AI - Client-side Agent Guardrail
 * Prevents privacy breaches and out-of-scope non-medical queries.
 */

const PRIVACY_VIOLATION_PATTERNS = [
  /hồ sơ của bệnh nhân/i,
  /hồ sơ bệnh án/i,
  /bệnh án của/i,
  /số điện thoại riêng/i,
  /số điện thoại của/i,
  /sđt riêng/i,
  /sđt của/i,
  /thông tin cá nhân của/i,
  /địa chỉ nhà riêng/i,
  /lịch trình của bác sĩ/i
];

const MEDICAL_KEYWORDS = [
  'đau', 'mỏi', 'nhức', 'mệt', 'khó thở', 'tức ngực', 'ù tai', 'chóng mặt',
  'sốt', 'ho', 'sổ mũi', 'cảm', 'nghẹt mũi', 'y khoa', 'sức khỏe', 'bác sĩ',
  'khám', 'bệnh', 'thuốc', 'điều trị', 'lịch hẹn', 'đặt lịch', 'khoa', 'tim mạch',
  'tai - mũi - họng', 'nhi khoa', 'xương khớp', 'da liễu', 'lên lịch', 'đăng ký khám', 'hẹn khám', 'book', 'schedule'
];

const NON_MEDICAL_PATTERNS = [
  /làm bánh/i, /nấu ăn/i, /công thức/i, /lập trình/i, /code/i,
  /thời tiết/i, /game/i, /chơi game/i, /pizza/i, /tin tức thời sự/i
];

export interface GuardrailResult {
  isAllowed: boolean;
  blockedType?: 'PRIVACY' | 'OUT_OF_SCOPE';
  response?: string;
}

/**
 * Validates the patient's message locally against safety boundaries before transmission.
 */
export function evaluateAgentGuardrail(query: string): GuardrailResult {
  const trimmed = query.trim();

  // 1. Privacy/RBAC Boundary Violation Detection
  const hasPrivacyViolation = PRIVACY_VIOLATION_PATTERNS.some(regex => regex.test(trimmed));
  if (hasPrivacyViolation) {
    return {
      isAllowed: false,
      blockedType: 'PRIVACY',
      response: 'Tôi không thể cung cấp thông tin cá nhân hoặc riêng tư của người khác. Tôi chỉ hỗ trợ các vấn đề liên quan đến sức khỏe của riêng bạn.'
    };
  }

  // 2. Out-of-Scope Detection
  const hasNonMedicalTrigger = NON_MEDICAL_PATTERNS.some(regex => regex.test(trimmed));
  const hasMedicalContext = MEDICAL_KEYWORDS.some(keyword => trimmed.toLowerCase().includes(keyword));

  if (hasNonMedicalTrigger || (!hasMedicalContext && trimmed.split(/\s+/).length > 3)) {
    return {
      isAllowed: false,
      blockedType: 'OUT_OF_SCOPE',
      response: 'Tôi là Trợ lý Y tế MedConcierge AI. Câu hỏi của bạn nằm ngoài phạm vi y học và sức khỏe. Tôi chỉ có thể hỗ trợ các vấn đề liên quan đến lâm sàng, lịch hẹn và hồ sơ bệnh án của bạn.'
    };
  }

  return { isAllowed: true };
}
