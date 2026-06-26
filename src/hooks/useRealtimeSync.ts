'use client';

import { useEffect, useState } from 'react';
import { useCalendarStore } from '../store/useCalendarStore';

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

    const connectTimer = window.setTimeout(() => {
      setStatus('connected');
    }, 700);

    const unsubscribe = useCalendarStore.subscribe((state, prevState) => {
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

    const updateInterval = window.setInterval(() => {
      if (status === 'connected') {
        const waitingCount = Math.max(1, Math.floor(Math.random() * 6));
        const event: SyncEvent = {
          type: 'QUEUE_UPDATE',
          payload: { waitingCount },
          timestamp: Date.now(),
        };
        updateSyncState(event);
      }
    }, 5000);

    if (channel) {
      channel.onmessage = (event: MessageEvent<SyncEvent>) => {
        if (event.data?.type) {
          setStatus('connected');
          setLastMessage(event.data);
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
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.clearTimeout(connectTimer);
      window.clearInterval(updateInterval);
      window.removeEventListener('storage', handleStorage);
      channel?.close();
      unsubscribe();
      setStatus('disconnected');
    };
  }, []);

  return {
    status,
    lastMessage,
  };
}
