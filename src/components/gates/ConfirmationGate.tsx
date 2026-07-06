import React, { useEffect, useRef } from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';

interface ConfirmationGateProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationGate({
  isOpen,
  title,
  description,
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  onConfirm,
  onCancel
}: ConfirmationGateProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus management: Trap focus inside modal when open for accessibility (WCAG)
  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      aria-describedby="gate-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md scale-95 transform rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-2xl transition-all space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-red-500/10 p-3 text-red-400">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 id="gate-title" className="text-base font-bold text-slate-100 uppercase tracking-wide">
              {title}
            </h2>
            <p id="gate-desc" className="text-xs text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 py-3 text-xs font-semibold text-slate-300 transition-all"
          >
            <X className="h-4 w-4" />
            <span>{cancelText}</span>
          </button>
          
          <button
            type="button"
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-bold text-white shadow-md transition-all"
          >
            <Check className="h-4 w-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
