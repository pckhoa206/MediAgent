import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '../store/useChatStore';
import { useChatStream } from '../hooks/useChatStream';
import { createMockSSEResponse } from '../services/mockAdapter';

// Mock fetch for server-sent events testing in JSDOM
global.fetch = vi.fn().mockImplementation((url, options) => {
  if (url === '/api/chat/stream') {
    const body = JSON.parse(options.body);
    return Promise.resolve(createMockSSEResponse({ message: body.message }));
  }
  return Promise.reject(new Error('Unknown fetch URL: ' + url));
});

describe('AI Token Streaming Integration & Performance', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    const { clearSession, initializeSession } = useChatStore.getState();
    clearSession();
    initializeSession();
  });

  it('should batch stream tokens and update store message content correctly', async () => {
    const { result } = renderHook(() => useChatStream());

    // Dispatch a message containing emergency triggers to initiate streaming
    await act(async () => {
      await result.current.sendMessage('Tôi bị đau ngực trái lan ra tay');
    });

    const store = useChatStore.getState();
    
    // The user message and the streamed assistant message should be present
    expect(store.messages.length).toBe(2);
    expect(store.messages[0].role).toBe('user');
    expect(store.messages[1].role).toBe('assistant');
    
    // The assistant message should contain the full text streamed by mockAdapter
    expect(store.messages[1].content).toContain('cảnh báo cấp cứu');
    
    // The emergency status should be correctly updated
    expect(store.isEmergency).toBe(true);
  });

  it('should not trigger emergency flag for normal symptoms', async () => {
    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage('Tôi chỉ bị ho nhẹ thôi');
    });

    const store = useChatStore.getState();
    expect(store.isEmergency).toBe(false);
    expect(store.messages[1].content).toContain('bình thường');
  });
});
