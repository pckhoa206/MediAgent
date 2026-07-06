'use client';

import React, { useState } from 'react';
import { useCalendarStore } from '../../store/useCalendarStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CalendarRange, Sparkles } from 'lucide-react';

export default function BookingForm() {
  const { slots, bookAppointment } = useCalendarStore();
  const { userCccd, userName } = useAuthStore();

  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter unbooked slots
  const availableSlots = slots.filter(s => !s.isBooked);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSuccess(false);

    if (!selectedSlotId) {
      setErrorMsg('Vui lòng chọn khung giờ khám.');
      return;
    }

    if (!userCccd || !userName) {
      setErrorMsg('Không thể xác thực thông tin bệnh nhân. Vui lòng đăng nhập lại.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate slight delay for realistic API simulation
    setTimeout(() => {
      const appointment = bookAppointment({
        patientCccd: userCccd,
        patientName: userName,
        slotId: selectedSlotId
      });

      setIsSubmitting(false);

      if (appointment) {
        setIsSuccess(true);
        setSelectedSlotId('');
        setTimeout(() => setIsSuccess(false), 4000);
      } else {
        setErrorMsg('Không thể đăng ký lịch khám. Khung giờ này có thể đã bị đặt.');
      }
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSuccess && (
        <div className="bg-emerald-950/40 text-emerald-400 p-4 rounded-xl border border-emerald-500/20 text-xs font-semibold animate-pulse-subtle flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>Đặt lịch khám thành công! Theo dõi lịch hẹn tại bảng bên cạnh hoặc trang Chat.</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/40 text-red-400 p-4 rounded-xl border border-red-500/20 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="slotSelect" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Khung giờ & Chuyên khoa có sẵn
        </label>
        
        {availableSlots.length === 0 ? (
          <p className="text-xs text-red-400 italic font-medium">Hiện tại không còn khung giờ khám trống nào.</p>
        ) : (
          <select 
            id="slotSelect"
            required
            className="w-full border border-slate-800 bg-slate-900/40 rounded-xl p-3 text-xs text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
          >
            <option value="" className="bg-slate-950 text-slate-400">-- Chọn khoa và khung giờ trống --</option>
            {availableSlots.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-950 text-slate-200">
                {s.department} · {s.time} (Bác sĩ: {s.assignedDoctorId})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button 
          type="submit" 
          disabled={isSubmitting || availableSlots.length === 0}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600"
        >
          {isSubmitting ? 'Đang đặt lịch...' : 'Xác Nhận Đặt Lịch'}
        </button>
      </div>
    </form>
  );
}


