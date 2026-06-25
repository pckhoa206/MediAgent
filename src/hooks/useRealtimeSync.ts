'use client';

import { useEffect, useState } from 'react';

type SyncStatus = 'connected' | 'connecting' | 'disconnected';

export function useRealtimeSync() {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    // Simulate WebSocket connection
    const connectTimer = setTimeout(() => {
      setStatus('connected');
    }, 1000);

    // Simulate receiving periodic updates from server
    const updateInterval = setInterval(() => {
      if (status === 'connected') {
        const mockEvents = [
          { type: 'QUEUE_UPDATE', payload: { waitingCount: Math.floor(Math.random() * 10) } },
          { type: 'PATIENT_STATUS_CHANGED', payload: { patientId: 'P123', newStatus: 'Đang khám' } },
        ];
        // Pick a random event to simulate real-time activity
        const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        setLastMessage({ ...randomEvent, timestamp: Date.now() });
      }
    }, 5000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(updateInterval);
      setStatus('disconnected');
    };
  }, [status]);

  return {
    status,
    lastMessage,
  };
}
