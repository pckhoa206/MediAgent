import React, { useState } from 'react';
import { useCalendarStore } from '../../store/useCalendarStore';
import { Calendar, Clock, CheckCircle2, User, ChevronRight } from 'lucide-react';

interface SchedulingCardProps {
  department: string;
  patientCccd: string;
  patientName: string;
  onBookSuccess?: () => void;
}

export function SchedulingCard({ department, patientCccd, patientName, onBookSuccess }: SchedulingCardProps) {
  const { slots, bookAppointment } = useCalendarStore();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<any | null>(null);

  // Filter slots for this department that are not yet booked
  const availableSlots = slots.filter((slot) => slot.department === department && !slot.isBooked);

  const handleBook = () => {
    if (!selectedSlotId) return;

    const appointment = bookAppointment({
      patientCccd,
      patientName,
      slotId: selectedSlotId,
    });

    if (appointment) {
      setBookedAppointment(appointment);
      if (onBookSuccess) onBookSuccess();
    }
  };

  if (bookedAppointment) {
    return (
      <div 
        role="status" 
        className="my-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 text-slate-200 space-y-3"
      >
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
          <CheckCircle2 className="h-5 w-5 animate-scaleIn" />
          <span>ĐẶT LỊCH HẸN THÀNH CÔNG!</span>
        </div>
        <div className="text-xs space-y-1.5 text-slate-300">
          <p className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Khoa khám:</span> {bookedAppointment.department}
          </p>
          <p className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Giờ khám:</span> {bookedAppointment.slot}
          </p>
          <p className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Mã Bác sĩ:</span> {bookedAppointment.doctorId}
          </p>
          <p className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Bệnh nhân:</span> {bookedAppointment.patientName} ({bookedAppointment.patientCccd})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
      <div className="flex items-center gap-2.5 text-slate-200">
        <Calendar className="h-5 w-5 text-emerald-400" />
        <div>
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">Đặt lịch khám chuyên khoa</h3>
          <p className="text-xxs text-slate-400">{department}</p>
        </div>
      </div>

      {availableSlots.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          Rất tiếc, hiện tại không còn lịch trống nào cho {department}. Vui lòng thử lại sau.
        </p>
      ) : (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400">Chọn khung giờ phù hợp:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotId(slot.id)}
                aria-label={`Chọn khung giờ ${slot.time}`}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  selectedSlotId === slot.id
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                    : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{slot.time}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!selectedSlotId}
            onClick={handleBook}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 py-3 text-xs font-bold text-white transition-all shadow-md"
          >
            <span>Xác Nhận Đặt Lịch</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
