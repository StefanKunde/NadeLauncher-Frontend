'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import type { Notification } from '@/lib/types';
import NotificationDropdown from './NotificationDropdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nadelauncher-backend-a99d397c.apps.deploypilot.stefankunde.dev';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { unreadCount, fetchUnreadCount, fetch, addNotification } = useNotificationStore();

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // WebSocket listener for real-time notifications
  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${API_URL}/sessions`, {
      auth: { token: accessToken },
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('notification', (notification: Notification) => {
      addNotification(notification);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, addNotification]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = useCallback(() => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      fetch();
    }
  }, [open, fetch]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center rounded-lg p-2 text-[#6b6b8a] transition-colors hover:bg-[#1a1a2e] hover:text-[#e8e8e8]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f0a500] px-1 text-[10px] font-bold text-black"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2"
          >
            <NotificationDropdown onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
