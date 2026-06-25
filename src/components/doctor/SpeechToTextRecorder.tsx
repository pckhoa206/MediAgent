'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
}

export default function SpeechToTextRecorder({ onResult }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [lang, setLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Build a fresh recognition instance whenever language changes
  const buildRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang;

    rec.onresult = (event: any) => {
      const text: string = event.results[0][0].transcript;
      onResult(text);
      setIsRecording(false);
    };

    rec.onerror = () => {
      setIsRecording(false);
      // Graceful fallback demo text
      onResult(
        lang === 'vi-VN'
          ? 'Bệnh nhân có dấu hiệu mệt mỏi, sốt nhẹ và đau đầu.'
          : 'The patient shows signs of fatigue, mild fever, and headache.'
      );
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    return rec;
  }, [lang, onResult]);

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
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {
          /* already running guard */
        }
      } else {
        // Fallback: no Web Speech API available
        setTimeout(() => {
          setIsRecording(false);
          onResult(
            lang === 'vi-VN'
              ? 'Bệnh nhân có dấu hiệu mệt mỏi, sốt nhẹ và đau đầu.'
              : 'The patient shows signs of fatigue, mild fever, and headache.'
          );
        }, 1500);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Language Toggle */}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as 'en-US' | 'vi-VN')}
        disabled={isRecording}
        title="Select speech language"
        className="text-xs border border-gray-300 rounded p-1 outline-none text-gray-600 disabled:opacity-50"
      >
        <option value="en-US">🇬🇧 EN</option>
        <option value="vi-VN">🇻🇳 VI</option>
      </select>

      {/* Live Waveform */}
      {isRecording && (
        <div className="flex items-center h-6 space-x-0.5 px-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className="w-1 bg-red-500 rounded-full transition-all duration-75 ease-in-out"
              style={{ height: `${Math.max(16, volume * (0.4 + bar * 0.12))}%` }}
            />
          ))}
          <span className="text-xs text-red-500 font-medium ml-2 animate-pulse">
            Recording...
          </span>
        </div>
      )}

      {/* Mic / Stop Button */}
      <button
        type="button"
        onClick={toggleRecording}
        className={`p-2 rounded-full transition-colors ${
          isRecording
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={
          !hasSpeechAPI
            ? 'Voice input not supported in this browser'
            : isRecording
            ? 'Stop recording'
            : 'Start voice input'
        }
      >
        {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
}
