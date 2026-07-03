export const PHONE_REGEX = /(?:\+84|0)(?:3|5|7|8|9)\d{8}\b/g;
export const CITIZEN_ID_REGEX = /\b\d{12}\b|\b\d{9}\b/g;
export const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
export const BHYT_REGEX = /\bBHYT[:\s-]*\d{10,15}\b|\b\d{10}(?:\d{2})?\b(?=\s*(?:BHYT|bảo hiểm|bhyt))/gi;
export const ADDRESS_REGEX =
  /\b(?:số\s*\d+[A-Za-z]?\s*(?:đường|phố|ngõ|hẻm)|(?:đường|phố)\s+[\wÀ-ỹ\s]+|phường\s+[\wÀ-ỹ\s]+|quận\s+[\wÀ-ỹ\s]+|thành phố\s+[\wÀ-ỹ\s]+|xã\s+[\wÀ-ỹ\s]+|huyện\s+[\wÀ-ỹ\s]+|tỉnh\s+[\wÀ-ỹ\s]+)\b/gi;
export const FOREIGN_NAME_REGEX =
  /\b(?:Dr|Mr|Mrs|Ms|Prof)\.?\s+[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,}){0,2}\b/g;
export const ASCII_FULL_NAME_REGEX = /\b[A-Z][a-z]{3,}\s[A-Z][a-z]{3,}\b/g;

export const VIETNAMESE_SURNAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ',
  'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Lâm', 'Đoàn', 'Trịnh',
  'Mai', 'Đinh', 'Tống', 'Tạ', 'Quách',
];

const surnamePattern = VIETNAMESE_SURNAMES.join('|');
const wordPattern =
  '[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐ][a-zàáâãèéêìíòóôõùúýỳỹỷỵđắằẳẵặấầẩẫậếềểễệốồổỗộưứừửữựăắằẳẵặơớờởỡợíìỉĩịúùủũụéèẻẽẹóòỏõọáàảãạýỳỷỹỵ]*';

export const VIETNAMESE_NAME_REGEX = new RegExp(
  `\\b(?:${surnamePattern})\\s${wordPattern}(?:\\s${wordPattern}){0,3}\\b`,
  'g'
);
