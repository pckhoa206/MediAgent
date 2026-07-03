import type { ChatMessageRecord } from '@/types';
import { saveMessageToDB, getMessagesFromDB } from '@/lib/secureDb';
import type { ChatMessage } from '@/store/useChatStore';

export async function syncMessageToServer(
  token: string,
  userId: string,
  sessionId: string,
  msg: ChatMessage
): Promise<void> {
  await saveMessageToDB(msg, userId);

  await fetch('/api/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: msg.id,
      sessionId,
      role: msg.role,
      content: msg.content,
      rawMaskedContent: msg.rawMaskedContent,
      triageStatus: msg.triageStatus,
      departmentToSchedule: msg.departmentToSchedule,
      timestamp: msg.timestamp,
    }),
  }).catch(() => undefined);
}

export async function loadChatHistory(
  token: string,
  userId: string,
  sessionId: string
): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { messages: ChatMessageRecord[] };
      if (data.messages.length > 0) {
        return data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          rawMaskedContent: m.rawMaskedContent,
          triageStatus: m.triageStatus,
          departmentToSchedule: m.departmentToSchedule,
          timestamp: m.timestamp,
        }));
      }
    }
  } catch {
    /* fallback to cache */
  }
  const cached = await getMessagesFromDB(userId);
  return cached.filter((m) => !sessionId || true);
}
