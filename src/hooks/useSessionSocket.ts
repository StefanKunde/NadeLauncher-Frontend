'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import type { Session } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nadelauncher-backend-a99d397c.apps.deploypilot.stefankunde.dev';

interface UseSessionSocketOptions {
  onStatusUpdate?: (session: Session) => void;
  onQueuePosition?: (position: number) => void;
  onSessionEnded?: (reason: string) => void;
  enabled?: boolean;
}

interface UseSessionSocketReturn {
  sendHeartbeat: () => void;
  isConnected: boolean;
  connectionError: string | null;
}

export function useSessionSocket(options: UseSessionSocketOptions = {}): UseSessionSocketReturn {
  const { onStatusUpdate, onQueuePosition, onSessionEnded, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Store callbacks in refs to avoid reconnecting on callback changes
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const onQueuePositionRef = useRef(onQueuePosition);
  const onSessionEndedRef = useRef(onSessionEnded);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
    onQueuePositionRef.current = onQueuePosition;
    onSessionEndedRef.current = onSessionEnded;
  }, [onStatusUpdate, onQueuePosition, onSessionEnded]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }

    // Create socket connection to the /sessions namespace
    const socket = io(`${API_URL}/sessions`, {
      auth: { token: accessToken },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to sessions namespace');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on('session:status-update', (session: Session) => {
      console.log('[WebSocket] Session status update:', session.status);
      onStatusUpdateRef.current?.(session);
    });

    socket.on('session:queue-position', (data: { position: number }) => {
      console.log('[WebSocket] Queue position update:', data.position);
      onQueuePositionRef.current?.(data.position);
    });

    socket.on('session:ended', (data: { reason: string }) => {
      console.log('[WebSocket] Session ended:', data.reason);
      onSessionEndedRef.current?.(data.reason);
    });

    return () => {
      console.log('[WebSocket] Cleaning up connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, enabled]);

  const sendHeartbeat = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('queue:heartbeat', {}, (response: { success?: boolean; error?: string }) => {
        if (response?.error) {
          console.warn('[WebSocket] Heartbeat error:', response.error);
        }
      });
    }
  }, []);

  return { sendHeartbeat, isConnected, connectionError };
}
