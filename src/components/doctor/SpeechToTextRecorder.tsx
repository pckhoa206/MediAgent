'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
}

export default function SpeechToTextRecorder({ onResult }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0); // Mock volume for waveform
  const [recognition, setRecognition] = useState<any>(null);
  const [lang, setLang] = useState('en-US'); // Language toggle
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang; // Use selected language

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onResult(text);
        setIsRecording(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        // Fallback for demo purposes if it fails
        onResult(lang === 'vi-VN' ? "bệnh nhân có dấu hiệu mệt mỏi, sốt nhẹ và đau đầu." : "the patient shows signs of fatigue, mild fever, and headache.");
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, [onResult, lang]);

  useEffect(() => {
    if (isRecording) {
      // Mock volume changes for the waveform
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
      // Stop recording
      if (recognition) {
        recognition.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          // Fallback if already started
        }
      } else {
        // Fallback if no Web Speech API
        setTimeout(() => {
          setIsRecording(false);
          onResult(lang === 'vi-VN' ? "bệnh nhân có dấu hiệu mệt mỏi, sốt nhẹ và đau đầu." : "the patient shows signs of fatigue, mild fever, and headache.");
        }, 1500);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <select 
        value={lang} 
        onChange={(e) => setLang(e.target.value)}
        className="text-xs border border-gray-300 rounded p-1 outline-none text-gray-600"
      >
        <option value="en-US">EN</option>
        <option value="vi-VN">VI</option>
      </select>
      
      {isRecording && (
        <div className="flex items-center h-6 space-x-1 px-2">
          {/* Mock Waveform bars */}
          {[1, 2, 3, 4, 5].map((bar) => (
            <div 
              key={bar}
              className="w-1 bg-red-500 rounded-full transition-all duration-100 ease-in-out"
              style={{ height: `${Math.max(20, Math.random() * volume)}%` }}
            />
          ))}
          <span className="text-xs text-red-500 font-medium ml-2 animate-pulse">Recording...</span>
        </div>
      )}
      <button
        type="button"
        onClick={toggleRecording}
        className={`p-2 rounded-full transition-colors ${
          isRecording 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={isRecording ? "Stop recording" : "Record with voice"}
      >
        {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
}
