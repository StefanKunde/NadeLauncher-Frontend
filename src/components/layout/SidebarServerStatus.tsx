'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Server, Wifi, Copy, Check, XCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionsApi } from '@/lib/api';
import { useSessionSocket } from '@/hooks/useSessionSocket';
import { useAuthStore } from '@/store/auth-store';
import { MAPS } from '@/lib/constants';
import type { Session } from '@/lib/types';

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function SidebarServerStatus() {
  const user = useAuthStore((s) => s.user);
  const [session, setSession] = useState<Session | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  // WebSocket for real-time updates
  useSessionSocket({
    enabled: !!user,
    onStatusUpdate: (updated) => setSession(updated),
    onSessionEnded: () => setSession(null),
  });

  // Poll for active session
  useEffect(() => {
    if (!user) return;
    let active = true;
    const poll = async () => {
      try {
        const s = await sessionsApi.getActive();
        if (active) setSession(s);
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [user]);

  // Elapsed timer for active sessions
  useEffect(() => {
    if (!session?.startedAt || session.status !== 'active') {
      setElapsed(0);
      return;
    }
    const start = new Date(session.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.startedAt, session?.status]);

  const handleCopy = useCallback(() => {
    if (!session?.serverIp) return;
    const cmd = `connect ${session.serverIp}:${session.serverPort}; password ${session.serverPassword}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [session]);

  const mapDisplay = session
    ? MAPS.find((m) => m.name === session.mapName)?.displayName ?? session.mapName
    : '';

  const status = session?.status;
  const hasSession = session && status !== 'ended' && status !== 'ending';

  if (!user) return null;

  return (
    <div className="mx-4 mb-2">
      <AnimatePresence mode="wait">
        {!hasSession ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-[#12121a] border border-[#2a2a3e] p-3"
          >
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-[#6b6b8a]/40 flex-shrink-0" />
              <p className="text-[10px] text-[#6b6b8a]/60">No active server</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
        <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e] p-3 space-y-2">
          {/* Queued */}
          {status === 'queued' && (
            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <Users className="h-4 w-4 text-[#f0a500]" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f0a500] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f0a500]" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#e8e8e8] truncate">In Queue</p>
                <p className="text-[10px] text-[#6b6b8a]">
                  Position #{session.queuePosition ?? '...'} — {mapDisplay}
                </p>
              </div>
            </div>
          )}

          {/* Provisioning / Pending */}
          {(status === 'pending' || status === 'provisioning') && (
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 text-[#f0a500] animate-spin flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#e8e8e8] truncate">Starting Server</p>
                <p className="text-[10px] text-[#6b6b8a]">{mapDisplay} — please wait...</p>
              </div>
            </div>
          )}

          {/* Ready */}
          {status === 'ready' && (
            <>
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <Server className="h-4 w-4 text-[#22c55e]" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#22c55e] truncate">Server Ready</p>
                  <p className="text-[10px] text-[#6b6b8a]">{mapDisplay} — connect now</p>
                </div>
              </div>
              {session.serverIp && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[10px] font-mono text-[#22c55e] hover:bg-[#22c55e]/15 transition-colors truncate"
                >
                  {copied ? <Check className="h-3 w-3 flex-shrink-0" /> : <Copy className="h-3 w-3 flex-shrink-0" />}
                  <span className="truncate">{copied ? 'Copied!' : `connect ${session.serverIp}:${session.serverPort}`}</span>
                </button>
              )}
            </>
          )}

          {/* Active */}
          {status === 'active' && (
            <>
              <div className="flex items-center gap-2.5">
                <Wifi className="h-4 w-4 text-[#22c55e] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#e8e8e8] truncate">{mapDisplay}</p>
                  <p className="text-[10px] text-[#6b6b8a]">
                    <span className="font-mono">{formatTime(elapsed)}</span> elapsed
                  </p>
                </div>
                <span className="flex h-2 w-2 flex-shrink-0">
                  <span className="animate-pulse inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
                </span>
              </div>
              {session.serverIp && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg bg-[#0a0a0f] border border-[#2a2a3e] text-[10px] font-mono text-[#6b6b8a] hover:text-[#e8e8e8] hover:border-[#3a3a5e] transition-colors truncate"
                >
                  {copied ? <Check className="h-3 w-3 flex-shrink-0" /> : <Copy className="h-3 w-3 flex-shrink-0" />}
                  <span className="truncate">{copied ? 'Copied!' : `connect ${session.serverIp}:${session.serverPort}`}</span>
                </button>
              )}
            </>
          )}

          {/* Failed */}
          {status === 'failed' && (
            <div className="flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-[#ff4444] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#ff4444] truncate">Server Failed</p>
                <p className="text-[10px] text-[#6b6b8a] truncate">{session.provisioningError || 'Try again from Dashboard'}</p>
              </div>
            </div>
          )}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
