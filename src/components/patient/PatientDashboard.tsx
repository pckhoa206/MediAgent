'use client';

import React, { useEffect } from 'react';
import { CalendarDays, Pill, Activity, Trash2, CalendarRange, Heart } from 'lucide-react';
import BookingForm from './BookingForm';
import { useCalendarStore } from '../../store/useCalendarStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cancelAppointmentOnServer, fetchAppointments } from '../../modules/booking/service';
import { decryptData } from '../../lib/aesGcm';
import { useRehabStore } from '../../store/useRehabStore';
import Link from 'next/link';

export function PatientDashboard() {
  const { getAppointmentsForUser, cancelAppointment, setAppointments } = useCalendarStore();
  const { userCccd, userName, token } = useAuthStore();
  const { exercises, deleteExercise, completeExercise, resetExercises } = useRehabStore();

  useEffect(() => {
    const syncAppointments = async () => {
      if (!token || !userCccd) return;
      try {
        const dbAppointments = await fetchAppointments(token);
        const baseSecret = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_CRYPTO_SECRET
          ? process.env.NEXT_PUBLIC_CRYPTO_SECRET
          : 'mediagent-default-secret-key-32-chars';
        const secretKey = `${baseSecret}_${userCccd}`;

        const decryptedAppointments = await Promise.all(
          dbAppointments.map(async (apt) => {
            let decryptedName = apt.patientName;
            let decryptedCccd = apt.patientCccd;
            try {
              decryptedName = await decryptData(apt.patientName, secretKey);
              decryptedCccd = await decryptData(apt.patientCccd, secretKey);
            } catch (e) {
              // Ignore decryption errors
            }
            return {
              id: apt.id,
              patientCccd: decryptedCccd,
              patientName: decryptedName,
              department: apt.department,
              slot: apt.slot,
              doctorId: apt.doctorId,
              status: apt.status as 'BOOKED' | 'CANCELLED',
            };
          })
        );
        setAppointments(decryptedAppointments);
      } catch (e) {
        console.error("Failed to fetch appointments in dashboard:", e);
      }
    };

    syncAppointments();
  }, [token, userCccd, setAppointments]);

  const patientAppointments = getAppointmentsForUser('patient', userCccd || '');
  const activeAppointments = patientAppointments.filter(apt => apt.status === 'BOOKED');

  const handleCancel = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      cancelAppointment('patient', userCccd || '', id);
      if (token) {
        try {
          await cancelAppointmentOnServer(token, id);
        } catch (e) {
          console.error("Failed to cancel appointment on server", e);
        }
      }
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-5 rounded-2xl border border-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-200 flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-400" />
            Tổng Quan Sức Khỏe Bệnh Nhân
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chào mừng trở lại, <span className="font-semibold text-teal-400">{userName || 'Bệnh nhân'}</span>. Bạn có thể đặt lịch khám và theo dõi lịch trình tại đây.
          </p>
        </div>
        <Link 
          href="/chat"
          className="bg-indigo-950/40 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-300 hover:bg-indigo-950/80 transition-all shrink-0 text-center"
        >
          Trò chuyện với Trợ lý AI ➔
        </Link>
      </div>
      
      {/* Mini Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Medications */}
        <div className="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-900 flex items-start space-x-4 shadow-xl">
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/15">
            <Pill className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Lịch Uống Thuốc</h3>
            <p className="text-xs text-slate-200 mt-1.5 font-medium">Paracetamol 500mg - 1 viên lúc 08:00 sáng</p>
          </div>
        </div>

        {/* Card 2: Vitals */}
        <div className="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-900 flex items-start space-x-4 shadow-xl">
          <div className="bg-teal-500/10 p-3 rounded-xl border border-teal-500/15">
            <Activity className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Chỉ Số Sinh Tồn</h3>
            <p className="text-xs text-slate-200 mt-1.5 font-medium">Huyết áp: 120/80 mmHg (Bình thường)</p>
          </div>
        </div>

        {/* Card 3: Next Appointments */}
        <div className="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-900 flex items-start space-x-4 shadow-xl">
          <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/15">
            <CalendarDays className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Lịch Hẹn Sắp Tới</h3>
            {activeAppointments.length === 0 ? (
              <p className="text-xs text-slate-500 mt-1.5 italic">Chưa đăng ký lịch hẹn nào.</p>
            ) : (
              <p className="text-xs text-purple-400 font-bold mt-1.5">
                {activeAppointments.length} lịch khám đã được lên lịch
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Main Grid: Booking Form & Active Appointments List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Book New Appointment Form */}
        <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-900 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <CalendarRange className="w-4.5 h-4.5 text-teal-400" />
            Đăng Ký Lịch Khám Mới
          </h2>
          <BookingForm />
        </div>

        {/* Booked Appointments List */}
        <div className="lg:col-span-5 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-900 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Danh Sách Lịch Khám Đã Đặt</h2>
          
          {activeAppointments.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Không có lịch hẹn nào đang hoạt động.</p>
          ) : (
            <div className="space-y-3">
              {activeAppointments.map((apt) => (
                <div key={apt.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2 relative hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{apt.department}</span>
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-1.5 rounded-lg transition-all"
                      title="Hủy lịch hẹn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-sans leading-relaxed">
                    <p><span className="font-semibold text-slate-500">Khung giờ:</span> {apt.slot}</p>
                    <p><span className="font-semibold text-slate-500">Mã bác sĩ:</span> {apt.doctorId}</p>
                    <p><span className="font-semibold text-slate-500">Bệnh nhân:</span> {apt.patientName} ({apt.patientCccd})</p>
                  </div>
                  
                  <div className="pt-1 flex">
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-emerald-950/40 text-emerald-400 border border-emerald-500/15 tracking-wide">
                      ĐÃ XÁC NHẬN
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Rehab Workout Schedule Section */}
      <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-900 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-teal-400" />
          Lịch Tập Luyện Phục Hồi Chức Năng
        </h2>
        
        {exercises.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 italic">
            Không có bài tập phục hồi nào được lên lịch hoặc tất cả đã bị xóa.
            <button onClick={resetExercises} className="ml-2 text-teal-400 hover:text-teal-300 font-semibold underline">
              Khôi phục mặc định
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exercises.map((ex) => (
              <div key={ex.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 relative hover:border-slate-700 transition-colors flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-bold ${ex.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {ex.name}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này khỏi lịch trình?')) {
                          deleteExercise(ex.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-1.5 rounded-lg transition-all shrink-0"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5 leading-relaxed font-sans">
                    <p><span className="font-semibold text-slate-500">Thời gian:</span> {ex.duration}</p>
                    <p><span className="font-semibold text-slate-500">Tần suất:</span> {ex.frequency}</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-900">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wide border ${
                    ex.status === 'COMPLETED' 
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/15' 
                      : 'bg-amber-950/40 text-amber-400 border-amber-500/15'
                  }`}>
                    {ex.status === 'COMPLETED' ? 'ĐÃ HOÀN THÀNH' : 'CHƯA HOÀN THÀNH'}
                  </span>
                  
                  <button
                    onClick={() => completeExercise(ex.id)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${
                      ex.status === 'COMPLETED'
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-teal-900/40 text-teal-300 border border-teal-500/20 hover:bg-teal-900'
                    }`}
                  >
                    {ex.status === 'COMPLETED' ? 'Làm lại' : 'Hoàn thành'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}


