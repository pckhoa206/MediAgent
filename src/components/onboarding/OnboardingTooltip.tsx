import type { Lang } from '@/constants/translations';

export function OnboardingTooltip({
  lang,
  step,
  onDismiss,
}: {
  lang: Lang;
  step: number;
  onDismiss: () => void;
}) {
  const tips =
    lang === 'vi'
      ? [
          'Chào mừng! Tab Tư vấn AI giúp bạn mô tả triệu chứng an toàn (PII được che tự động).',
          'Tab Đặt lịch mã hóa tên và CCCD trước khi lưu.',
          'Nhấn biểu tượng loa để nghe câu trả lời AI (không đọc phần độ tin cậy).',
        ]
      : [
          'Welcome! The AI Consult tab masks PII before sending to the model.',
          'Booking encrypts name and ID before storage.',
          'Tap the speaker icon to hear AI replies (confidence section excluded).',
        ];

  return (
    <div
      role="tooltip"
      className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 rounded-2xl border border-[#4d7c5d]/30 bg-[#0f1712] p-4 shadow-xl"
    >
      <p className="text-xs text-slate-300 leading-relaxed">{tips[step] ?? tips[0]}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 text-[10px] font-bold text-[#7FB08E] uppercase tracking-wider"
        aria-label={lang === 'vi' ? 'Đóng hướng dẫn' : 'Dismiss guide'}
      >
        {lang === 'vi' ? 'Đã hiểu' : 'Got it'}
      </button>
    </div>
  );
}
