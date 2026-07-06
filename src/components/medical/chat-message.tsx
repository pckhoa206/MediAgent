import React from 'react';
import { User, Bot } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuthStore } from '../../store/useAuthStore';
import { SchedulingCard } from './scheduling-card';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  departmentToSchedule?: string;
}

export function ChatMessage({ role, content, isStreaming = false, departmentToSchedule }: ChatMessageProps) {
  const isUser = role === 'user';
  const { userCccd, userName } = useAuthStore();
  
  // Safe HTML content rendering (DOMPurify for zero-trust client output protection)
  const cleanHTML = typeof window !== 'undefined' ? DOMPurify.sanitize(content) : content;

  return (
    <div
      role="log"
      className={`flex w-full gap-4 py-4 px-2 md:px-4 rounded-xl transition-colors duration-150 ${
        isUser ? 'bg-transparent' : 'bg-slate-900/30 border border-slate-800/20'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl shadow-md ${
          isUser
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
            : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
        }`}
      >
        {isUser ? (
          <User className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Bot className="h-5 w-5" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
          {isUser ? 'Bệnh Nhân' : 'Trợ Lý Y Khoa AI'}
        </span>
        <div 
          aria-live={isStreaming ? 'polite' : 'off'} 
          className="text-slate-100 text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap font-sans"
        >
          {cleanHTML || (
            <span className="text-slate-500 italic flex items-center gap-1">
              Đang phân tích triệu chứng...
              <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400"></span>
            </span>
          )}
        </div>

        {/* Dynamic Scheduling Card Render */}
        {!isStreaming && departmentToSchedule && userCccd && userName && (
          <SchedulingCard
            department={departmentToSchedule}
            patientCccd={userCccd}
            patientName={userName}
          />
        )}
      </div>
    </div>
  );
}
