import React, { useEffect, useRef } from 'react';
import { Phone, AlertOctagon, HeartPulse, ChevronRight } from 'lucide-react';

interface TriageCardProps {
  status: 'NORMAL' | 'WARNING' | 'EMERGENCY';
  flags?: string[];
}

export function TriageCard({ status, flags = [] }: TriageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus management: when the emergency triage card appears, immediately set focus
  // to grab screen reader attention.
  useEffect(() => {
    if (status === 'EMERGENCY' && cardRef.current) {
      cardRef.current.focus();
    }
  }, [status]);

  if (status !== 'EMERGENCY') return null;

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="my-4 overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 to-red-900/10 p-5 backdrop-blur-md shadow-lg shadow-red-950/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-red-500/20 p-3 text-red-400 animate-pulse">
          <AlertOctagon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-lg font-bold text-red-200 flex items-center gap-2">
            <span>CẢNH BÁO SỨC KHỎE KHẨN CẤP</span>
          </h2>
          <p className="text-sm text-red-300/90 leading-relaxed">
            Hệ thống phát hiện dấu hiệu nguy hiểm liên quan đến tim mạch/đau ngực từ mô tả của bạn. 
            Vui lòng thực hiện các biện pháp an toàn ngay lập tức.
          </p>
          
          {flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {flags.map((flag) => (
                <span 
                  key={flag} 
                  className="rounded-md bg-red-950/60 border border-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300 uppercase tracking-wider"
                >
                  {flag === 'chest_pain' ? 'Đau Ngực Trái' : flag === 'cardiac_alert' ? 'Dấu Hiệu Tim Mạch' : flag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <a
          href="tel:115"
          aria-label="Gọi cấp cứu ngay lập tức số 115"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-red-950 transition-all duration-200"
        >
          <Phone className="h-4 w-4 animate-bounce" aria-hidden="true" />
          <span>Gọi Cấp Cứu Ngay (115)</span>
        </a>
        <button
          onClick={() => {
            alert('Thông tin hướng dẫn sơ cứu khẩn cấp đang được kích hoạt.');
          }}
          aria-label="Xem hướng dẫn sơ cứu tại chỗ"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          <HeartPulse className="h-4 w-4 text-red-400" aria-hidden="true" />
          <span>Hướng Dẫn Sơ Cứu</span>
          <ChevronRight className="h-4 w-4 ml-auto" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
