import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '../app/chat/page';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn()
    };
  }
}));

describe('Chat Guardrail UI Integration Tests', () => {
  beforeEach(() => {
    // 1. Authenticate user in mock store
    useAuthStore.setState({
      isAuthenticated: true,
      role: 'patient',
      userName: 'Bệnh Nhân Minh Khoa',
      userCccd: '079123456789',
      token: 'mock-token'
    });

    // 2. Initialize chat store
    const { clearSession, initializeSession } = useChatStore.getState();
    clearSession();
    initializeSession();

    // 3. Clear fetch mocks
    vi.restoreAllMocks();
  });

  it('should intercept out-of-scope queries and display system warning without fetching network', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    
    render(<ChatPage />);

    // Mock typing a non-medical out-of-scope prompt
    const textarea = screen.getByPlaceholderText(/Nhập triệu chứng của bạn/i);
    fireEvent.change(textarea, { target: { value: 'Giá cổ phiếu Tesla hôm nay bao nhiêu?' } });

    // Click submit/send button
    const sendButton = screen.getByRole('button', { name: /Gửi tin nhắn/i });
    fireEvent.click(sendButton);

    // Verify:
    // 1. Fetch should NOT be called to LLM gateway
    expect(fetchSpy).not.toHaveBeenCalled();

    // 2. The out-of-scope rejection message should appear on the screen
    await waitFor(() => {
      expect(screen.getByText(/Tôi là Trợ lý Y tế MedConcierge AI. Câu hỏi của bạn nằm ngoài phạm vi y học và sức khỏe./i)).toBeInTheDocument();
    });
  });

  it('should allow medical symptoms and execute network stream requests', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() => {
      // Mock standard stream response
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type": "token", "content": "Chào bạn"}\n\n'));
          controller.close();
        }
      });
      return Promise.resolve(new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }));
    });

    render(<ChatPage />);

    const textarea = screen.getByPlaceholderText(/Nhập triệu chứng của bạn/i);
    fireEvent.change(textarea, { target: { value: 'Tôi bị đau tai và chóng mặt' } });

    const sendButton = screen.getByRole('button', { name: /Gửi tin nhắn/i });
    fireEvent.click(sendButton);

    // Verify network fetch is called for medical queries
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
  });
});
