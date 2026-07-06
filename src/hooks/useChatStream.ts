import { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { maskPII } from '../security/piiFilter';
import { restorePII } from '../security/tokenMapper';
import { createMockSSEResponse } from '../services/mockAdapter';

import { matchDepartment } from '../utils/medical-departments';
import { evaluateAgentGuardrail } from '../security/agentGuardrail';
import { detectLanguage } from '../utils/language';

export function useChatStream() {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    sessionId, 
    addMessage, 
    updateStreamingMessage, 
    finishStreamingMessage,
    addPiiMappings, 
    piiMappings,
    setEmergency 
  } = useChatStore();

  const sendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const detectedLang = detectLanguage(userText);

    // 1. Evaluate Agent Guardrail (out-of-scope & privacy violations)
    const guardrail = evaluateAgentGuardrail(userText, detectedLang);
    if (!guardrail.isAllowed) {
      addMessage({
        role: 'user',
        content: userText,
        rawMaskedContent: userText,
      });

      addMessage({
        role: 'assistant',
        content: guardrail.response || '',
        rawMaskedContent: guardrail.response || '',
      });
      return;
    }

    setIsLoading(true);

    // 1. Perform client-side zero-trust PII masking
    const { maskedText, mappings } = maskPII(userText);
    
    // Save PII mappings locally in Zustand store memory
    addPiiMappings(mappings);

    // 2. Add User Message to Chat History (restore for user display immediately)
    addMessage({
      role: 'user',
      content: userText, // Show raw text to the user who wrote it
      rawMaskedContent: maskedText,
    });

    // Match department based on symptoms
    const matchedDept = matchDepartment(userText);

    // 3. Create Placeholder Assistant Message for Streaming
    const assistantMsgId = addMessage({
      role: 'assistant',
      content: '',
      rawMaskedContent: '',
      departmentToSchedule: matchedDept || undefined,
    });

    try {
      // 4. Dispatch call to our backend API route
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: maskedText,
          sessionId: sessionId,
          lang: detectedLang,
        }),
      });
      
      if (!response.body) {
        throw new Error('No response body from stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      
      // Client-side emergency trigger phrases (in Vietnamese)
      const emergencyKeywords = [
        'đau ngực', 'đau ngực trái', 'khó thở', 'gọi cấp cứu', 'tức ngực',
        'ngực trái lan ra tay', 'nhồi máu cơ tim', 'đau tim'
      ];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE messages are separated by double newlines
        const lines = buffer.split('\n\n');
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.type === 'token') {
                accumulatedText += parsed.content;

                // Restore PII tokens in streamed text on-the-fly for rendering
                const restoredText = restorePII(accumulatedText, piiMappings.concat(mappings));
                
                updateStreamingMessage(assistantMsgId, restoredText);

                // Perform rolling client-side emergency checks (fallback matching)
                const lowercaseRestored = restoredText.toLowerCase();
                const hasEmergencyKeyword = emergencyKeywords.some(keyword => 
                  lowercaseRestored.includes(keyword)
                );
                
                if (hasEmergencyKeyword) {
                  setEmergency(true);
                }
              } else if (parsed.type === 'triage') {
                if (parsed.status === 'EMERGENCY') {
                  setEmergency(true);
                }
              }
            } catch (err) {
              console.error('Error parsing SSE line:', err);
            }
          }
        }
      }

      // Finish streaming and update message state
      finishStreamingMessage(assistantMsgId);
    } catch (error) {
      console.error('Streaming failed:', error);
      updateStreamingMessage(
        assistantMsgId, 
        'Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại.'
      );
      finishStreamingMessage(assistantMsgId);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
  };
}
