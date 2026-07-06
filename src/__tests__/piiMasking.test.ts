import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatStream } from '../hooks/useChatStream';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

describe('PII Leakage Integration Verification', () => {
  beforeEach(() => {
    // 1. Authenticate user in mock store
    useAuthStore.setState({
      isAuthenticated: true,
      role: 'patient',
      userName: 'Nguyễn Văn A',
      userCccd: '079123456789',
      token: 'mock-token'
    });

    // 2. Initialize chat store
    const { clearSession, initializeSession } = useChatStore.getState();
    clearSession();
    initializeSession();

    // 3. Clear mock registers
    vi.restoreAllMocks();
  });

  it('should guarantee that raw PII identifiers are replaced before transmission', async () => {
    let capturedRequestBody: any = null;

    // Spy on global fetch and capture the request body payload
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
      if (options && options.body) {
        capturedRequestBody = JSON.parse(options.body as string);
      }
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type": "token", "content": "Ok"}\n\n'));
          controller.close();
        }
      });
      return Promise.resolve(new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }));
    });

    const { result } = renderHook(() => useChatStream());

    // Trigger a query containing sensitive PII name and ID format along with medical symptom
    await act(async () => {
      await result.current.sendMessage('Tôi là Nguyễn Văn A, bị đau đầu và có số định danh CCCD: 079123456789');
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(capturedRequestBody).not.toBeNull();

    const transmittedMessage = capturedRequestBody.message;

    // Assert: Raw PII values are replaced and do not leak
    expect(transmittedMessage).toContain('[MASKED_NAME_1]');
    expect(transmittedMessage).toContain('[MASKED_ID_1]');
    
    // Assert: Raw PII is 100% absent from payload
    expect(transmittedMessage).not.toContain('Nguyễn Văn A');
    expect(transmittedMessage).not.toContain('079123456789');
  });
});
