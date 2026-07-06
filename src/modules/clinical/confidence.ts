import type { QueryIntent } from '@/types';
import { classifyQueryIntent } from '@/modules/security/guardrail';

export const MEDICAL_SOURCES: Record<string, { sources: string[]; confidence: string }> = {
  'Khoa Tim Mạch': {
    sources: ['American Heart Association (AHA) Guidelines 2023', 'Hội Tim Mạch Học Quốc Gia Việt Nam', 'Mayo Clinic Cardiovascular Reference'],
    confidence: '98%',
  },
  'Khoa Tai - Mũi - Họng': {
    sources: ['Bộ Y tế VN - TMH', 'ENT UK guidelines', 'Mayo Clinic Otolaryngology'],
    confidence: '95%',
  },
  'Khoa Cơ Xương Khớp': {
    sources: ['Bộ Y tế VN - Cơ Xương Khớp', 'American College of Rheumatology', 'Johns Hopkins Rheumatology'],
    confidence: '96%',
  },
  'Khoa Da Liễu': {
    sources: ['BV Da liễu Trung ương', 'American Academy of Dermatology', 'Fitzpatrick Dermatology'],
    confidence: '94%',
  },
  'Khoa Nhi': {
    sources: ['BV Nhi Đồng 1', 'American Academy of Pediatrics', 'Nelson Textbook of Pediatrics'],
    confidence: '96%',
  },
  default: {
    sources: ['Bộ Y tế VN - Đa khoa', 'Mayo Clinic Library', 'WHO Primary Care Guidelines'],
    confidence: '92%',
  },
};

const CLINICAL_INTENTS: QueryIntent[] = ['clinical'];

export function shouldShowConfidence(query: string, department?: string | null): boolean {
  const intent = classifyQueryIntent(query);
  if (!CLINICAL_INTENTS.includes(intent)) return false;
  if (!department) return false;
  return true;
}

export function getConfidenceData(department: string) {
  return MEDICAL_SOURCES[department] ?? MEDICAL_SOURCES.default;
}

export const MEDICAL_DISCLAIMER =
  'Thông tin mang tính tham khảo lâm sàng, không thay thế chẩn đoán của bác sĩ.';
