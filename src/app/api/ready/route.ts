import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    checks: {
      auth: 'ok',
      storage: 'ok',
      ai: 'demo-mode',
    },
  });
}
