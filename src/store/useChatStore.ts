import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PIIMapping } from '../security/piiFilter';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string; // Restored (unmasked) content for client-side rendering
  rawMaskedContent?: string; // PII-masked content sent/received from public LLM
  triageStatus?: 'NORMAL' | 'WARNING' | 'EMERGENCY';
  isTriageCard?: boolean; // True if it is the injected emergency triage card
  isStreaming?: boolean;
  departmentToSchedule?: string; // If set, renders a scheduling card for this department
  timestamp: number;
}

interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  piiMappings: PIIMapping[];
  isEmergency: boolean;
  
  // Actions
  initializeSession: () => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateStreamingMessage: (id: string, content: string, status?: 'NORMAL' | 'WARNING' | 'EMERGENCY') => void;
  finishStreamingMessage: (id: string) => void;
  addPiiMappings: (mappings: PIIMapping[]) => void;
  setEmergency: (value: boolean) => void;
  clearSession: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessionId: '',
      messages: [],
      piiMappings: [],
      isEmergency: false,

  initializeSession: () => {
    set({
      sessionId: crypto.randomUUID(),
      messages: [],
      piiMappings: [],
      isEmergency: false,
    });
  },

  addMessage: (msg) => {
    const id = crypto.randomUUID();
    const newMessage: ChatMessage = {
      ...msg,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    return id;
  },

  updateStreamingMessage: (id, content, status) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content, triageStatus: status || msg.triageStatus, isStreaming: true } : msg
      ),
    }));
  },

  finishStreamingMessage: (id) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, isStreaming: false } : msg
      ),
    }));
  },

  addPiiMappings: (mappings) => {
    set((state) => {
      // Avoid duplicate mappings
      const existingTokens = new Set(state.piiMappings.map((m) => m.token));
      const newMappings = mappings.filter((m) => !existingTokens.has(m.token));
      return {
        piiMappings: [...state.piiMappings, ...newMappings],
      };
    });
  },

  setEmergency: (value) => {
    set({ isEmergency: value });
  },

    clearSession: () => {
      set({
        sessionId: '',
        messages: [],
        piiMappings: [],
        isEmergency: false,
      });
    },
  }),
  {
    name: 'chat-storage', // key in localStorage
    partialize: (state) => ({ 
      sessionId: state.sessionId, 
      messages: state.messages,
      piiMappings: state.piiMappings,
      isEmergency: state.isEmergency
    }),
  }
));
