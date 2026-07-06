'use client';

import { useEffect, useState } from 'react';
import { useCalendarStore } from '../store/useCalendarStore';
import { useAuthStore } from '../store/useAuthStore';
import { fetchAppointments } from '../modules/booking/service';
import { decryptData } from '../lib/aesGcm';

type SyncStatus = 'connected' | 'connecting' | 'disconnected';

interface SyncEvent {
  type: 'QUEUE_UPDATE' | 'PATIENT_STATUS_CHANGED' | 'APPOINTMENT_UPDATED';
  payload: Record<string, unknown>;
  timestamp: number;
}

export function useRealtimeSync() {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [lastMessage, setLastMessage] = useState<SyncEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('mediagent-realtime') : null;
    
    const updateSyncState = (event: SyncEvent) => {
      setStatus('connected');
      setLastMessage(event);
      channel?.postMessage(event);
    };

    const syncDbAppointments = async () => {
      const auth = useAuthStore.getState();
      if (!auth.isAuthenticated || !auth.token || !auth.userCccd) return;

      try {
        const dbAppointments = await fetchAppointments(auth.token);

        let finalAppointments = [];
        if (auth.role === 'patient') {
          const baseSecret = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_CRYPTO_SECRET
            ? process.env.NEXT_PUBLIC_CRYPTO_SECRET
            : 'mediagent-default-secret-key-32-chars';
          const secretKey = `${baseSecret}_${auth.userCccd}`;

          finalAppointments = await Promise.all(
            dbAppointments.map(async (apt) => {
              let decryptedName = apt.patientName;
              let decryptedCccd = apt.patientCccd;
              try {
                decryptedName = await decryptData(apt.patientName, secretKey);
                decryptedCccd = await decryptData(apt.patientCccd, secretKey);
              } catch (e) {
                // Ignore decryption errors
              }
              return {
                id: apt.id,
                patientCccd: decryptedCccd,
                patientName: decryptedName,
                department: apt.department,
                slot: apt.slot,
                doctorId: apt.doctorId,
                status: apt.status as 'BOOKED' | 'CANCELLED' | 'COMPLETED',
              };
            })
          );
        } else {
          // Doctor / Admin
          finalAppointments = dbAppointments.map((apt) => ({
            id: apt.id,
            patientCccd: apt.patientCccd,
            patientName: apt.patientName,
            department: apt.department,
            slot: apt.slot,
            doctorId: apt.doctorId,
            status: apt.status as 'BOOKED' | 'CANCELLED' | 'COMPLETED',
          }));
        }

        useCalendarStore.getState().setAppointments(finalAppointments);
      } catch (e) {
        console.error('[useRealtimeSync] Failed to sync db appointments:', e);
      }
    };

    // Listen to local store mutations to broadcast to other tabs
    const unsubscribeCalendar = useCalendarStore.subscribe((state, prevState) => {
      const latestAppointment = state.appointments[state.appointments.length - 1];
      const prevLatestAppointment = prevState.appointments[prevState.appointments.length - 1];

      if (latestAppointment && latestAppointment.id !== prevLatestAppointment?.id) {
        updateSyncState({
          type: 'APPOINTMENT_UPDATED',
          payload: {
            appointmentId: latestAppointment.id,
            department: latestAppointment.department,
            status: latestAppointment.status,
          },
          timestamp: Date.now(),
        });
      }
    });

    if (channel) {
      channel.onmessage = (event: MessageEvent<SyncEvent>) => {
        if (event.data?.type) {
          setStatus('connected');
          setLastMessage(event.data);
          void syncDbAppointments();
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'calendar-storage') {
        updateSyncState({
          type: 'PATIENT_STATUS_CHANGED',
          payload: { source: 'storage-sync' },
          timestamp: Date.now(),
        });
        void syncDbAppointments();
      }
    };

    window.addEventListener('storage', handleStorage);

    // ─────────────────────── Real SSE Connection ───────────────────────
    let eventSource: EventSource | null = null;
    const auth = useAuthStore.getState();

    if (auth.isAuthenticated && auth.token) {
      const url = `/api/realtime/sync?token=${encodeURIComponent(auth.token)}`;
      eventSource = new EventSource(url);

      eventSource.addEventListener('connected', () => {
        setStatus('connected');
      });

      eventSource.addEventListener('APPOINTMENT_UPDATED', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>;
          setStatus('connected');
          const syncEvent: SyncEvent = {
            type: 'APPOINTMENT_UPDATED',
            payload: data,
            timestamp: Date.now(),
          };
          setLastMessage(syncEvent);
          channel?.postMessage(syncEvent);
          void syncDbAppointments();
        } catch (e) {
          console.error('[useRealtimeSync] Error parsing APPOINTMENT_UPDATED event:', e);
        }
      });

      eventSource.addEventListener('QUEUE_UPDATE', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>;
          setStatus('connected');
          const syncEvent: SyncEvent = {
            type: 'QUEUE_UPDATE',
            payload: data,
            timestamp: Date.now(),
          };
          setLastMessage(syncEvent);
          channel?.postMessage(syncEvent);
          void syncDbAppointments();
        } catch (e) {
          console.error('[useRealtimeSync] Error parsing QUEUE_UPDATE event:', e);
        }
      });

      eventSource.onerror = () => {
        setStatus('connecting');
      };
    } else {
      setStatus('disconnected');
    }

    // Trigger initial database fetch on mount
    void syncDbAppointments();

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.close();
      unsubscribeCalendar();
      if (eventSource) {
        eventSource.close();
      }
      setStatus('disconnected');
    };
  }, []);

  return {
    status,
    lastMessage,
  };
}
