'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useChatStream } from '../../hooks/useChatStream';
import { useAuthStore } from '../../store/useAuthStore';
import { useCalendarStore } from '../../store/useCalendarStore';
import { cancelAppointmentOnServer } from '../../modules/booking/service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatMessage } from '../../components/medical/chat-message';
import { TriageCard } from '../../components/medical/triage-card';
import { Send, Heart, Activity, AlertCircle, RefreshCw, ChevronRight, User, Trash2, Calendar as CalendarIcon, LogOut, BarChart3 } from 'lucide-react';

export default function ChatPage() {
  const { messages, sessionId, isEmergency, initializeSession, clearSession } = useChatStore();
  const { sendMessage, isLoading } = useChatStream();
  const { isAuthenticated, userName, userCccd, token, logout } = useAuthStore();
  const { getAppointmentsForUser, cancelAppointment } = useCalendarStore();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const patientAppointments = getAppointmentsForUser('patient', userCccd || '');

  // Authentication Route Guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Initialize session on mount
  useEffect(() => {
    if (isAuthenticated) {
      initializeSession();
    }
    return () => clearSession();
  }, [initializeSession, clearSession, isAuthenticated]);

  // Ref-based scrolling to prevent rendering freeze or scroll jitter
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const text = inputText;
    setInputText('');
    
    // Auto-resize input back to default
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Adjust text area height automatically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const triggerSampleQuery = async (query: string) => {
    if (isLoading) return;
    setInputText('');
    await sendMessage(query);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Banner Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400 border border-emerald-500/20">
            <Heart className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-200 uppercase">
              Hệ Thống Trợ Lý Y Khoa AI
            </h1>
            <p className="text-xxs text-slate-500 flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-500" />
              Bảo mật client-side đầu-cuối
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-xxs text-slate-500">
            <span>MÃ PHIÊN KHÁM</span>
            <span className="font-mono font-semibold text-slate-400 select-all">
              {sessionId || 'ĐANG TẠO...'}
            </span>
          </div>

          <button
            onClick={() => initializeSession()}
            aria-label="Tạo mới phiên khám"
            className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Làm mới phiên</span>
          </button>

          <Link
            href="/tracker"
            className="flex items-center gap-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-950/80 transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Remediation Tracker</span>
          </Link>
          
          <button
            onClick={() => logout()}
            aria-label="Đăng xuất"
            className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-950/80 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Chat List Container */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="rounded-full bg-slate-900/60 p-6 border border-slate-800/40 text-emerald-400/80 shadow-inner">
                <Heart className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-200">Bắt đầu tư vấn triệu chứng</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Nhập triệu chứng của bạn để nhận phân tích y khoa sơ bộ từ AI. 
                  Thông tin cá nhân (Tên, SĐT, CCCD) được mã hóa cục bộ tuyệt đối trước khi gửi đi.
                </p>
              </div>

              {/* Sample Queries */}
              <div className="w-full space-y-3 pt-4">
                <div className="text-xxs font-bold text-slate-500 uppercase tracking-widest text-left pl-1">
                  Mẫu truy vấn thử nghiệm
                </div>
                <button
                  onClick={() => triggerSampleQuery('Tôi bị đau ngực trái lan ra tay')}
                  className="w-full flex items-center justify-between text-left p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-red-500/20 text-red-300/90 text-sm font-medium transition-all"
                >
                  <span>1. Đau ngực trái lan ra tay (Mẫu Cấp Cứu)</span>
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                </button>
                <button
                  onClick={() => triggerSampleQuery('Tôi bị ho nhẹ và sổ mũi 2 ngày nay')}
                  className="w-full flex items-center justify-between text-left p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium transition-all"
                >
                  <span>2. Ho nhẹ và sổ mũi (Mẫu Bình Thường)</span>
                  <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                  departmentToSchedule={msg.departmentToSchedule}
                />
              ))}

              {/* Emergency Alert Card (assertive live area) */}
              {isEmergency && (
                <TriageCard status="EMERGENCY" flags={['chest_pain', 'cardiac_alert']} />
              )}
            </div>
          )}
        </div>

        {/* Sidebar panels (Hồ sơ & Lịch hẹn) */}
        <div className="hidden lg:flex w-80 shrink-0 flex-col border-l border-slate-900 bg-slate-950 p-6 space-y-6 overflow-y-auto">
          {/* Medical Profile Section */}
          <div className="space-y-4 rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              <span>Hồ Sơ Bệnh Nhân</span>
            </h3>
            <div className="text-xs space-y-2 text-slate-300">
              <p><span className="font-semibold text-slate-500 font-sans">Họ và Tên:</span> {userName}</p>
              <p><span className="font-semibold text-slate-500 font-sans">Số CCCD:</span> {userCccd}</p>
              <p><span className="font-semibold text-slate-500 font-sans">Nhóm máu:</span> A+</p>
              <p><span className="font-semibold text-slate-500 font-sans">Tiền sử:</span> Cao huyết áp nhẹ</p>
              <p><span className="font-semibold text-slate-500 font-sans">Dị ứng:</span> Không phát hiện</p>
            </div>
          </div>

          {/* Booked Appointments Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-emerald-400" />
              <span>Lịch Khám Đã Đặt</span>
            </h3>

            {patientAppointments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Chưa có lịch hẹn nào được đăng ký.</p>
            ) : (
              <div className="space-y-3">
                {patientAppointments.map((apt) => (
                  <div key={apt.id} className="rounded-xl border border-slate-900 bg-slate-900/30 p-3 space-y-2 relative">
                    <div className="text-xs font-semibold text-slate-200">{apt.department}</div>
                    <div className="text-xxs text-slate-400 flex flex-col gap-0.5">
                      <span>Khung giờ: {apt.slot}</span>
                      <span>Mã Bác sĩ: {apt.doctorId}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        apt.status === 'BOOKED' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950/40 text-red-400'
                      }`}>
                        {apt.status === 'BOOKED' ? 'ĐÃ ĐẶT' : 'ĐÃ HỦY'}
                      </span>
                      {apt.status === 'BOOKED' && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
                              cancelAppointment('patient', userCccd || '', apt.id);
                              if (token) {
                                try {
                                  await cancelAppointmentOnServer(token, apt.id);
                                } catch (e) {
                                  console.error("Failed to cancel appointment on server", e);
                                }
                              }
                            }
                          }}
                          aria-label="Hủy lịch hẹn"
                          className="text-red-400 hover:text-red-300 p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Chat Input Area */}
      <footer className="shrink-0 border-t border-slate-900 bg-slate-950 px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập triệu chứng của bạn (Ví dụ: Tôi bị đau đầu từ sáng nay...)"
              aria-label="Khung nhập nội dung tư vấn triệu chứng"
              className="flex-1 max-h-32 min-h-[2.5rem] bg-transparent pl-3 pr-12 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none overflow-y-auto"
            />
            
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              aria-label="Gửi tin nhắn"
              className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          
          <div className="mt-2 text-center text-[10px] text-slate-600 leading-tight">
            * Khuyến cáo: Trợ lý AI chỉ mang tính chất tham khảo y khoa sơ bộ, không thay thế chẩn đoán y khoa chính thức.
          </div>
        </div>
      </footer>
    </div>
  );
}
