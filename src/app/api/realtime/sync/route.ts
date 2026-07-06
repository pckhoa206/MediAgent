import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { getDatabaseAdapter } from '@/lib/db/adapter';
import { getBearerToken } from '@/lib/auth/middleware';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const queryToken = searchParams.get('token');
  const headerToken = getBearerToken(req);
  const token = queryToken || headerToken;

  if (!token) {
    return new Response('Unauthorized: Missing token', { status: 401 });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return new Response('Unauthorized: Invalid token', { status: 401 });
  }

  const encoder = new TextEncoder();
  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      let lastAppointmentCount = 0;
      let lastAppointmentStatusHash = '';
      let lastAuditLogId = '';

      try {
        const adapter = getDatabaseAdapter();

        // 1. Initial State Fetch
        const initialAppointments = await adapter.all<{ id: string; status: string }>(
          "SELECT id, status FROM appointments"
        );
        lastAppointmentCount = initialAppointments.length;
        lastAppointmentStatusHash = initialAppointments.map(a => `${a.id}:${a.status}`).join(',');

        const latestAudit = await adapter.get<{ id: string }>(
          "SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT 1"
        );
        lastAuditLogId = latestAudit?.id || '';

        // Send initial connection successful event
        sendEvent('connected', { timestamp: Date.now() });

        // Stream polling loop
        const intervalMs = 2000;
        const totalDurationMs = 28000; // ~28s limit to fit serverless limits (max 30s)
        let elapsedMs = 0;

        while (elapsedMs < totalDurationMs) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          elapsedMs += intervalMs;

          // Poll appointments
          const currentAppointments = await adapter.all<{ id: string; status: string }>(
            "SELECT id, status FROM appointments"
          );
          const currentStatusHash = currentAppointments.map(a => `${a.id}:${a.status}`).join(',');

          // Poll audit logs
          const currentAudit = await adapter.get<{ id: string }>(
            "SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT 1"
          );
          const currentAuditId = currentAudit?.id || '';

          let changed = false;

          if (currentAppointments.length !== lastAppointmentCount || currentStatusHash !== lastAppointmentStatusHash) {
            changed = true;
            lastAppointmentCount = currentAppointments.length;
            lastAppointmentStatusHash = currentStatusHash;

            sendEvent('APPOINTMENT_UPDATED', {
              timestamp: Date.now(),
              count: lastAppointmentCount
            });
          }

          if (currentAuditId && currentAuditId !== lastAuditLogId) {
            lastAuditLogId = currentAuditId;
            if (!changed) {
              sendEvent('QUEUE_UPDATE', {
                timestamp: Date.now(),
                waitingCount: currentAppointments.filter(a => a.status === 'BOOKED').length
              });
            }
          }
        }
      } catch (err) {
        console.error('SSE Stream error:', err);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, { headers: responseHeaders });
}
