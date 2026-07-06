import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getChatMessages, saveChatMessage, getChatSessions, deleteChatSession } from '@/lib/db/store';
import type { ChatMessageRecord } from '@/types';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const listSessions = req.nextUrl.searchParams.get('listSessions') === 'true';
  if (listSessions) {
    const sessions = await getChatSessions(user.cccd);
    return NextResponse.json({ sessions });
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId') || undefined;
  const messages = await getChatMessages(user.cccd, sessionId);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const record: ChatMessageRecord = {
    id: body.id || crypto.randomUUID(),
    userId: user.cccd,
    sessionId: body.sessionId,
    role: body.role,
    content: body.content,
    rawMaskedContent: body.rawMaskedContent,
    triageStatus: body.triageStatus,
    departmentToSchedule: body.departmentToSchedule,
    timestamp: body.timestamp || Date.now(),
  };

  await saveChatMessage(record);
  return NextResponse.json({ message: record }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ message: 'Missing sessionId parameter' }, { status: 400 });
  }

  await deleteChatSession(user.cccd, sessionId);
  return NextResponse.json({ success: true });
}
