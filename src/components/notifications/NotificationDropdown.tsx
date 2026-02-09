'use client';

import { CheckCheck } from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';

interface NotificationDropdownProps {
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  return (
    <div className="w-80 rounded-xl border border-[#2a2a3e] bg-[#12121a] shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a3e] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#e8e8e8]">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1 text-xs text-[#6b6b8a] transition-colors hover:text-[#f0a500]"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-32 rounded bg-[#1a1a2e] animate-pulse" />
                <div className="h-2.5 w-48 rounded bg-[#1a1a2e] animate-pulse" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#6b6b8a]">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.isRead) markAsRead(n.id);
              }}
              className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1a1a2e] ${
                !n.isRead ? 'bg-[#f0a500]/5' : ''
              }`}
            >
              {/* Unread dot */}
              <div className="mt-1.5 shrink-0">
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-[#f0a500]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#e8e8e8]">
                  {n.title}
                </p>
                <p className="mt-0.5 text-xs text-[#6b6b8a] line-clamp-2">
                  {n.message}
                </p>
                <p className="mt-1 text-[10px] text-[#4a4a6a]">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
