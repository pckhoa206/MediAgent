'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  uiLang?: 'vi' | 'en';
  hideLangToggle?: boolean;
}

export default function SpeechToTextRecorder({
  onResult,
  onError,
  className = '',
  uiLang = 'vi',
  hideLangToggle = false
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [lang, setLang] = useState<'en-US' | 'vi-VN'>('vi-VN'); // Default to vi-VN for better localization
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);

  // Sync lang state with uiLang prop
  useEffect(() => {
    setLang(uiLang === 'en' ? 'en-US' : 'vi-VN');
  }, [uiLang]);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Build a fresh recognition instance whenever language changes
  const buildRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = true; // Upgrade: continuous listening
    rec.interimResults = true; // Upgrade: interim results
    rec.lang = lang;

    rec.onresult = (event: any) => {
      let newlyFinalized = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newlyFinalized += event.results[i][0].transcript + ' ';
        }
      }
      if (newlyFinalized) {
        onResult(newlyFinalized.trim());
      }
    };

    rec.onerror = (event: any) => {
      setIsRecording(false);
      const errorMsg = event.error ? `Speech recognition error: ${event.error}` : 'Microphone access error';
      if (onError) {
        onError(errorMsg);
      } else {
        alert(
          lang === 'vi-VN'
            ? `Lỗi nhận diện giọng nói: ${event.error || 'không thể truy cập micro'}.`
            : `Speech recognition error: ${event.error || 'cannot access microphone'}.`
        );
      }
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    return rec;
  }, [lang, onResult, onError]);

  // Initialise / reinitialise when lang changes
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSpeechAPI(!!SpeechRecognition);

    // Stop any active session before rebuilding
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    recognitionRef.current = buildRecognition();
    setIsRecording(false);
  }, [lang, buildRecognition]);

  // Waveform animation
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setVolume(Math.random() * 100);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setVolume(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        setIsRecording(true);
        try {
          recognitionRef.current.start();
        } catch (_) {
          /* already running guard */
        }
      } else {
        const noSupportMsg =
          lang === 'vi-VN'
            ? 'Trình duyệt không hỗ trợ Web Speech API. Vui lòng dùng Chrome.'
            : 'Browser does not support Web Speech API. Please use Chrome.';
        if (onError) {
          onError(noSupportMsg);
        } else {
          alert(noSupportMsg);
        }
      }
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Language Toggle */}
      {!hideLangToggle && (
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'en-US' | 'vi-VN')}
          disabled={isRecording}
          title="Select speech language"
          className="text-[10px] border border-slate-800 bg-[#0f1712] rounded p-1 outline-none text-slate-400 disabled:opacity-50"
        >
          <option value="en-US">🇬🇧 EN</option>
          <option value="vi-VN">🇻🇳 VI</option>
        </select>
      )}

      {/* Live Waveform */}
      {isRecording && (
        <div className="flex items-center h-6 space-x-0.5 px-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className="w-1 bg-[#4d7c5d] rounded-full transition-all duration-75 ease-in-out"
              style={{ height: `${Math.max(16, volume * (0.4 + bar * 0.12))}%` }}
            />
          ))}
          <span className="text-[10px] text-[#7FB08E] font-medium ml-2 animate-pulse">
            Listening...
          </span>
        </div>
      )}

      {/* Mic / Stop Button */}
      <button
        type="button"
        onClick={toggleRecording}
        className={`p-2 rounded-full transition-colors ${
          isRecording
            ? 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/50'
            : 'bg-[#0f1712]/50 text-slate-400 border border-[#1c2e24] hover:bg-[#14231b]'
        }`}
        title={
          !hasSpeechAPI
            ? 'Voice input not supported in this browser'
            : isRecording
            ? 'Stop recording'
            : 'Start voice input'
        }
      >
        {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
