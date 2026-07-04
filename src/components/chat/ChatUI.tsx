'use client';

import DOMPurify from 'dompurify';
import { Activity, AlertCircle, Award, Calendar, ChevronRight, Send, Shield, User, Volume2, VolumeX, MessageSquare, Plus, Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/store/useChatStore';
import { shouldShowConfidence, getConfidenceData, MEDICAL_DISCLAIMER } from '@/modules/clinical/confidence';
import { CONFIDENCE_STRIP_PATTERNS } from '@/hooks/useSpeechOutput';
import type { Lang, TranslationKey } from '@/constants/translations';
import SpeechToTextRecorder from '../doctor/SpeechToTextRecorder';

interface ChatUIProps {
  lang: Lang;
  t: (key: TranslationKey) => string;
  messages: ChatMessage[];
  chatInputText: string;
  chatLoading: boolean;
  isEmergency: boolean;
  lastUserQuery: string;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onPreset: (text: string) => void;
  onBookDept: (dept: string) => void;
  onDismissEmergency: () => void;
  onSpeak: (text: string) => void;
  onStopSpeak: () => void;
  isSpeaking: boolean;
  onVoiceResult?: (text: string) => void;

  // Multiple Sessions Props
  sessions: string[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatUI({
  lang,
  t,
  messages,
  chatInputText,
  chatLoading,
  isEmergency,
  lastUserQuery,
  chatScrollRef,
  chatInputRef,
  onInputChange,
  onSubmit,
  onPreset,
  onBookDept,
  onDismissEmergency,
  onSpeak,
  onStopSpeak,
  isSpeaking,
  onVoiceResult,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}: ChatUIProps) {
  return (
    <div className="flex-1 flex md:flex-row flex-col overflow-hidden">
      
      {/* LEFT COLUMN: Gemini-Style Chat Sessions Sidebar */}
      <aside className="w-full md:w-64 bg-[#090e0b] border-b md:border-b-0 md:border-r border-[#1c2e24] flex flex-col overflow-hidden select-none shrink-0">
        {/* New Chat Button */}
        <div className="p-4 border-b border-[#1c2e24]">
          <button
            type="button"
            onClick={onCreateSession}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#132219] hover:bg-[#1c2e24] border border-[#233c2e] text-[#aef0c7] hover:text-[#c4f8d9] text-xs font-bold transition-all duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {lang === 'vi' ? 'Cuộc trò chuyện mới' : 'New Chat'}
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-[#132219]">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium italic">
              {lang === 'vi' ? 'Chưa có cuộc trò chuyện nào' : 'No chats yet'}
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess === activeSessionId;
              // Format a nice display name: e.g. "Session-172..." to "Cuộc hội thoại 172..." or a shorter date
              const cleanName = sess.startsWith('chat-')
                ? (lang === 'vi' ? 'Hội thoại ' : 'Chat ') + new Date(parseInt(sess.split('-')[1])).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(parseInt(sess.split('-')[1])).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'numeric', day: 'numeric' })
                : sess.substring(0, 12) + '...';

              return (
                <div
                  key={sess}
                  onClick={() => onSelectSession(sess)}
                  className={`group flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-[#1c2e24]/40 text-[#aef0c7] border border-[#233c2e]/40'
                      : 'text-slate-400 hover:bg-[#0f1612] hover:text-slate-200'
                  }`}
                >
                  <div className="flex-1 flex items-center gap-2 overflow-hidden py-1">
                    <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-[#7FB08E]' : 'text-slate-500'}`} />
                    <span className="truncate">{cleanName}</span>
                  </div>
                  
                  {/* Delete button (hidden by default, shown on hover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sess);
                    }}
                    className="opacity-50 group-hover:opacity-100 p-1 hover:bg-[#2b1b1b] rounded-lg text-slate-500 hover:text-red-400 transition-all duration-150"
                    title={lang === 'vi' ? 'Xóa cuộc trò chuyện' : 'Delete chat'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT COLUMN: Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div
          ref={chatScrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={lang === 'vi' ? 'Khu vực hội thoại tư vấn y khoa' : 'Medical chat conversation'}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-[#1c2e24]"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
            <div className="rounded-full bg-[#0f1712] p-6 border border-[#1c2e24] text-[#7FB08E]">
              <Activity className="h-10 w-10" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">{t('assistantTitle')}</h3>
            <p className="text-xs text-slate-400">{t('chatbotIntro')}</p>
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() =>
                  onPreset(
                    lang === 'vi'
                      ? 'Tôi bị đau ngực trái lan ra cánh tay trái, khó thở dữ dội.'
                      : 'I have severe left chest pain and difficulty breathing.'
                  )
                }
                className="w-full p-3.5 rounded-2xl bg-[#0f1712]/50 border border-red-500/20 text-red-300 text-xs font-semibold text-left"
              >
                {t('emergencyPreset1')}
              </button>
              <button
                type="button"
                onClick={() =>
                  onPreset(
                    lang === 'vi' ? 'Tôi bị ngứa da nổi mụn nước ở bắp chân.' : 'Itchy blisters on my calf.'
                  )
                }
                className="w-full p-3.5 rounded-2xl bg-[#0f1712]/50 border border-[#1c2e24] text-slate-300 text-xs font-semibold text-left"
              >
                {t('emergencyPreset2')}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const clean =
                typeof window !== 'undefined' ? DOMPurify.sanitize(msg.content) : msg.content;
              const showConfidence =
                !isUser &&
                !msg.isStreaming &&
                !!msg.content &&
                shouldShowConfidence(lastUserQuery, msg.departmentToSchedule);
              const sourceData = getConfidenceData(msg.departmentToSchedule || 'default');

              return (
                <article key={msg.id} className="space-y-2">
                  <div
                    className={`flex gap-4 py-4 px-4 rounded-2xl border ${
                      isUser ? 'border-transparent' : 'bg-[#0f1712]/45 border-[#1c2e24]/40'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isUser
                          ? 'bg-[#4d7c5d]/10 text-[#7FB08E] border border-[#4d7c5d]/20'
                          : 'bg-[#3d634a]/20 text-[#7FB08E] border border-[#4d7c5d]/20'
                      }`}
                      aria-hidden="true"
                    >
                      {isUser ? <User className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {isUser ? (lang === 'vi' ? 'Bệnh nhân' : 'Patient') : 'CareAgent AI'}
                        </span>
                        {!isUser && !msg.isStreaming && msg.content && (
                          <button
                            type="button"
                            onClick={() => (isSpeaking ? onStopSpeak() : onSpeak(msg.content))}
                            aria-label={lang === 'vi' ? 'Phát âm câu trả lời' : 'Speak response'}
                            className="p-1.5 rounded-lg text-[#7FB08E] hover:bg-[#14231b]"
                          >
                            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      <div
                        aria-live={msg.isStreaming ? 'polite' : 'off'}
                        aria-atomic="true"
                        className="text-slate-100 text-sm leading-relaxed break-words whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: clean || (lang === 'vi' ? 'Đang phân tích...' : 'Analyzing...'),
                        }}
                      />
                      {!msg.isStreaming && msg.departmentToSchedule && (
                        <div className="mt-3 p-4 bg-[#0f1712] border border-[#1c2e24] rounded-2xl max-w-md space-y-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#7FB08E]" aria-hidden="true" />
                            <span className="text-xs font-bold text-slate-200">{t('suggestedBooking')}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {t('suggestedBookingSub')} <strong>{msg.departmentToSchedule}</strong>
                          </p>
                          <button
                            type="button"
                            onClick={() => onBookDept(msg.departmentToSchedule!)}
                            className="w-full bg-[#4d7c5d] hover:bg-[#5e8c6a] text-white font-bold text-xs py-2 rounded-xl"
                          >
                            {t('bookNowBtn')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {showConfidence && (
                    <aside
                      className="ml-0 sm:ml-14 max-w-2xl bg-[#070b09]/80 border border-[#111a14] rounded-2xl p-4 space-y-3"
                      aria-label={t('confidenceTitle')}
                    >
                      <div className="flex items-center justify-between border-b border-[#1c2e24] pb-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <Award className="w-3.5 h-3.5 text-[#7FB08E]" aria-hidden="true" />
                          {t('confidenceTitle')}
                        </div>
                        <span className="text-xs font-bold text-[#7FB08E] font-mono">{sourceData.confidence}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0f1712] rounded-full overflow-hidden" role="progressbar" aria-valuenow={parseInt(sourceData.confidence)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-gradient-to-r from-[#4d7c5d] to-[#7FB08E]" style={{ width: sourceData.confidence }} />
                      </div>
                      <ul className="text-[10px] text-slate-400 space-y-1 list-disc pl-4">
                        {sourceData.sources.map((src) => (
                          <li key={src}>{src}</li>
                        ))}
                      </ul>
                      <p className="text-[9px] text-slate-500">{MEDICAL_DISCLAIMER}</p>
                    </aside>
                  )}
                </article>
              );
            })}
            {isEmergency && (
              <div role="alert" aria-live="assertive" className="border border-red-500/30 bg-red-950/20 p-5 rounded-2xl flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0" aria-hidden="true" />
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-red-400">{t('emergencyWarningTitle')}</h4>
                  <p className="text-xs text-slate-300">{t('emergencyWarningText')}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href="tel:115" className="px-4 py-1.5 bg-red-600 text-white font-bold text-xs rounded-xl">
                      {t('call115')}
                    </a>
                    <button type="button" onClick={onDismissEmergency} className="px-3 py-1.5 border border-[#1c2e24] text-slate-400 text-xs rounded-xl">
                      {t('closeWarning')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="shrink-0 border-t border-[#111a14] bg-[#070b09] p-3 sm:p-4">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative flex items-end gap-2 bg-[#0f1712]/60 border border-[#1c2e24] rounded-2xl p-2">
          <textarea
            ref={chatInputRef}
            rows={1}
            value={chatInputText}
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={t('symptomPlaceholderText')}
            aria-label={t('symptomPlaceholderText')}
            className="flex-1 max-h-24 min-h-[2.5rem] bg-transparent pl-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
          />
          {onVoiceResult && (
            <SpeechToTextRecorder
              onResult={onVoiceResult}
              className="self-center pr-2"
            />
          )}
          <button
            type="submit"
            disabled={chatLoading || !chatInputText.trim()}
            aria-label={lang === 'vi' ? 'Gửi tin nhắn' : 'Send message'}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4d7c5d] text-white disabled:bg-slate-800 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>
      </div> {/* End of RIGHT COLUMN */}
    </div>
  );
}
