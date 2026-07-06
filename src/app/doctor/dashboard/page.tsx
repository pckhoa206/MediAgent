'use client';

import React, { useState } from 'react';
import EMRForm from '@/components/doctor/EMRForm';
import { RoleGuard } from '@/components/security/RoleGuard';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useCalendarStore, Appointment } from '@/store/useCalendarStore';
import { useAuthStore } from '@/store/useAuthStore';
import { completeAppointment, fetchAppointments } from '@/modules/booking/service';
import { Users, CheckCircle2, Clock, LogOut, ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';

export default function DoctorPage() {
  const { status, lastMessage } = useRealtimeSync();
  const { getAppointmentsForUser, cancelAppointment, setAppointments } = useCalendarStore();
  const { doctorId, userName, token, logout } = useAuthStore();

  const [activePatient, setActivePatient] = useState<Appointment | null>(null);

  React.useEffect(() => {
    const syncAppointments = async () => {
      if (!token || !doctorId) return;
      try {
        const dbAppointments = await fetchAppointments(token);
        const mappedAppointments = dbAppointments.map((apt) => ({
          id: apt.id,
          patientCccd: apt.patientCccd,
          patientName: apt.patientName,
          department: apt.department,
          slot: apt.slot,
          doctorId: apt.doctorId,
          status: apt.status as 'BOOKED' | 'CANCELLED',
        }));
        setAppointments(mappedAppointments);
      } catch (e) {
        console.error("Failed to fetch appointments in doctor dashboard:", e);
      }
    };

    syncAppointments();
  }, [token, doctorId, setAppointments]);

  const appointments = getAppointmentsForUser('doctor', doctorId || '');
  const activeQueue = appointments.filter(apt => apt.status === 'BOOKED');

  const handleEMRComplete = async (appointmentId: string) => {
    // Process/checkout appointment by canceling it from the queue
    cancelAppointment('doctor', doctorId || '', appointmentId);
    setActivePatient(null);
    if (token) {
      try {
        await completeAppointment(token, appointmentId);
      } catch (e) {
        console.error("Failed to complete appointment on server", e);
      }
    }
  };

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <main className="min-h-screen bg-slate-950 py-8 px-4 font-sans text-slate-100">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-5 rounded-2xl border border-slate-900 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <Link 
                href="/chat"
                className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                aria-label="Quay lại phòng chat"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-200 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-teal-400 animate-pulse" />
                  Doctor Workspace
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Bác sĩ: <span className="font-semibold text-teal-400">{userName || 'Dr. Demo Account'}</span> (Mã: {doctorId || 'DOC-XXXXX'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sync: {status === 'connected' ? 'Connected' : 'Connecting'}
              </div>
              
              <button
                onClick={() => logout()}
                aria-label="Đăng xuất"
                className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/20 px-3.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-950/80 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Sync Event log banner */}
          {lastMessage && (
            <div className="bg-slate-900/10 border border-slate-900 rounded-xl px-4 py-2.5 text-xxs text-slate-500 font-mono flex items-center gap-2 shadow-inner">
              <span className="text-indigo-400">● Broadcast Event:</span>
              <span>{lastMessage.type} · {String(lastMessage.payload?.department ?? 'queue-update')}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Active Patients Queue (Cols 4) */}
            <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-900 shadow-xl space-y-4">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                Hàng Đợi Bệnh Nhân ({activeQueue.length})
              </h2>

              {activeQueue.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-500 italic">Đã chẩn đoán xong mọi bệnh án hôm nay!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeQueue.map((apt) => {
                    const isSelected = activePatient?.id === apt.id;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setActivePatient(apt)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1.5 focus:outline-none ${
                          isSelected 
                            ? 'bg-teal-950/30 border-teal-500 shadow-sm ring-1 ring-teal-500' 
                            : 'bg-slate-950/40 hover:bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-teal-300' : 'text-slate-200'}`}>
                            {apt.patientName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {apt.slot}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-normal font-sans">
                          CCCD: {apt.patientCccd} · Khoa: {apt.department}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* EMR Writing Workspace (Cols 8) */}
            <div className="lg:col-span-8">
              <EMRForm 
                activePatient={activePatient ? {
                  id: activePatient.id,
                  patientName: activePatient.patientName,
                  patientCccd: activePatient.patientCccd,
                  department: activePatient.department
                } : null}
                onComplete={handleEMRComplete}
              />
            </div>

          </div>

        </div>
      </main>
    </RoleGuard>
  );
}


