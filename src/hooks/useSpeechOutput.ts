'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechOptions {
  lang?: 'vi-VN' | 'en-US';
}

export function useSpeechOutput({ lang = 'vi-VN' }: UseSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, excludePatterns: RegExp[] = []) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;

      stop();
      let content = text;
      for (const pattern of excludePatterns) {
        content = content.replace(pattern, '');
      }
      content = content.replace(/\[\d+%\]/g, '').trim();
      if (!content) return;

      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = lang;
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [lang, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, isSpeaking };
}

export const CONFIDENCE_STRIP_PATTERNS = [
  /Độ tin cậy[^.]*\.?/gi,
  /Clinical Diagnostic Confidence[^.]*\.?/gi,
  /Nguồn tham khảo[^.]*\.?/gi,
  /Medical Evidence[^.]*\.?/gi,
  /Thông tin mang tính tham khảo[^.]*\.?/gi,
  /\d{2,3}%/g,
];
