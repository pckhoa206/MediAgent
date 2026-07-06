/**
 * Symptom-to-Medical Department Routing Matrix
 */

export interface DepartmentMapping {
  name: string;
  keywords: string[];
  description: string;
}

export const MEDICAL_DEPARTMENTS: DepartmentMapping[] = [
  {
    name: 'Khoa Tai - Mũi - Họng',
    keywords: ['ù tai', 'chóng mặt', 'đau tai', 'viêm họng', 'khản tiếng', 'sổ mũi', 'nghẹt mũi', 'xoang'],
    description: 'Chuyên điều trị các bệnh lý về tai, mũi, họng và vùng cổ.'
  },
  {
    name: 'Khoa Tim Mạch',
    keywords: ['đau ngực', 'tức ngực', 'khó thở', 'tim đập nhanh', 'nhịp tim', 'huyết áp', 'nhồi máu'],
    description: 'Chuyên điều trị các bệnh lý tim mạch, mạch vành, huyết áp.'
  },
  {
    name: 'Khoa Cơ Xương Khớp',
    keywords: ['đau khớp', 'mỏi gối', 'xương khớp', 'cột sống', 'thoái hóa', 'căng cơ', 'đau lưng'],
    description: 'Chuyên khám và điều trị các bệnh cơ, xương, khớp nội khoa.'
  },
  {
    name: 'Khoa Da Liễu',
    keywords: ['mẩn ngứa', 'mụn nhọt', 'dị ứng da', 'phát ban', 'chàm', 'vảy nến', 'nấm da', 'mụn', 'ngứa', 'nổi mẩn', 'da mặt'],
    description: 'Chuyên điều trị các bệnh lý về da, tóc, móng.'
  },
  {
    name: 'Khoa Nhi',
    keywords: ['trẻ em', 'nhi khoa', 'bé bị', 'trẻ sơ sinh', 'tiêm chủng nhi'],
    description: 'Chuyên chăm sóc sức khỏe toàn diện cho trẻ em dưới 16 tuổi.'
  }
];

/**
 * Intelligent keyword matching to determine the appropriate department.
 */
export function matchDepartment(query: string): string | null {
  const lowercaseQuery = query.toLowerCase();
  
  for (const dept of MEDICAL_DEPARTMENTS) {
    const hasMatch = dept.keywords.some(keyword => lowercaseQuery.includes(keyword));
    if (hasMatch) {
      return dept.name;
    }
  }
  
  return null;
}
