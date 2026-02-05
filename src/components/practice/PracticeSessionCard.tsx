'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Play,
  Square,
  Copy,
  Check,
  Clock,
  Shield,
  ExternalLink,
  Crown,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { sessionsApi } from '@/lib/api';
import { MAPS } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import type { Session, UsageStats } from '@/lib/types';

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatMinutes(totalSeconds: number): string {
  if (totalSeconds < 120) return `${totalSeconds} sec`;
  const mins = Math.round(totalSeconds / 60);
  return `${mins} min`;
}

export default function PracticeSessionCard() {
  const user = useAuthStore((s) => s.user);
  const [session, setSession] = useState<Session | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [selectedMap, setSelectedMap] = useState<string>(MAPS[0].name);
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localRemaining, setLocalRemaining] = useState<number | null>(null);
  const localRemainingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const [activeSession, usageData] = await Promise.all([
        sessionsApi.getActive(),
        sessionsApi.getUsage(),
      ]);
      setSession(activeSession ?? null);
      setUsage(usageData);
      // Sync local countdown with polled remaining seconds
      if (usageData) {
        setLocalRemaining(Math.max(0, Math.min(usageData.remainingSeconds, usageData.limitSeconds)));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Poll while session is active
  useEffect(() => {
    if (session?.isActive) {
      pollRef.current = setInterval(fetchState, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session?.isActive, fetchState]);

  // Elapsed timer when connected
  useEffect(() => {
    if (session?.startedAt) {
      const startTime = new Date(session.startedAt).getTime();
      const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
      update();
      elapsedRef.current = setInterval(update, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [session?.startedAt]);

  // Tick down local remaining every second while connected
  useEffect(() => {
    if (session?.isActive && session.startedAt && localRemaining !== null) {
      localRemainingRef.current = setInterval(() => {
        setLocalRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      }, 1000);
    }
    return () => {
      if (localRemainingRef.current) clearInterval(localRemainingRef.current);
    };
  }, [session?.isActive, session?.startedAt, localRemaining !== null]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await sessionsApi.create(selectedMap);
      setSession(created);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg ?? 'Failed to create session. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEnd = async () => {
    if (!session) return;
    setEnding(true);
    try {
      await sessionsApi.end(session.id);
      setSession(null);
      await fetchState();
    } catch {
      setError('Failed to end session.');
    } finally {
      setEnding(false);
    }
  };

  const copyPassword = async () => {
    if (!session?.serverPassword) return;
    await navigator.clipboard.writeText(session.serverPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectUrl =
    session?.serverIp && session?.serverPort && session?.serverPassword
      ? `steam://connect/${session.serverIp}:${session.serverPort}/${session.serverPassword}`
      : null;

  const limitLabel = usage
    ? usage.limitSeconds < 120
      ? `${usage.limitSeconds} seconds`
      : `${Math.round(usage.limitSeconds / 60)} minutes`
    : '60 minutes';
  const usagePercent = usage ? Math.min(100, (usage.usedSeconds / usage.limitSeconds) * 100) : 0;
  const timeExhausted = usage && !usage.isPremium && usage.remainingSeconds <= 30;

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6b6b8a] mx-auto" />
      </div>
    );
  }

  // State 3: Connected (startedAt is set)
  if (session?.isActive && session.startedAt) {
    const remaining = localRemaining ?? 0;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #00c850' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00c85015]">
                <Server className="h-5 w-5 text-[#00c850]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#e8e8e8]">Practice Session Active</h3>
                <p className="text-xs text-[#6b6b8a]">
                  {MAPS.find((m) => m.name === session.mapName)?.displayName ?? session.mapName}
                </p>
              </div>
            </div>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00c850] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#00c850]" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="rounded-lg bg-[#0a0a12] p-4 text-center">
              <Clock className="h-4 w-4 text-[#6b6b8a] mx-auto mb-1" />
              <p className="text-xs text-[#6b6b8a] mb-1">Elapsed</p>
              <p className="text-xl font-mono font-bold text-[#e8e8e8]">{formatTime(elapsed)}</p>
            </div>
            <div className="rounded-lg bg-[#0a0a12] p-4 text-center">
              <Shield className="h-4 w-4 text-[#6b6b8a] mx-auto mb-1" />
              <p className="text-xs text-[#6b6b8a] mb-1">Remaining</p>
              <p
                className="text-xl font-mono font-bold"
                style={{
                  color:
                    usage?.isPremium
                      ? '#f0a500'
                      : remaining < 300
                        ? '#ff4444'
                        : remaining < 900
                          ? '#f0a500'
                          : '#e8e8e8',
                }}
              >
                {usage?.isPremium ? 'Unlimited' : formatTime(remaining)}
              </p>
            </div>
          </div>

          <button
            onClick={handleEnd}
            disabled={ending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#ff4444] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#cc3333] disabled:opacity-50"
          >
            {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            End Session
          </button>
        </div>
      </motion.div>
    );
  }

  // State 2: Created but not connected (waiting for player)
  if (session?.isActive && !session.startedAt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #f0a500' }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0a50015]">
              <Server className="h-5 w-5 text-[#f0a500]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#e8e8e8]">Server Ready</h3>
              <p className="text-xs text-[#6b6b8a]">
                {MAPS.find((m) => m.name === session.mapName)?.displayName ?? session.mapName}
                {' — '}Waiting for you to connect
              </p>
            </div>
          </div>

          {/* Connection Details */}
          <div className="rounded-lg bg-[#0a0a12] p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6b6b8a]">Server</span>
              <span className="text-sm font-mono text-[#e8e8e8]">
                {session.serverIp}:{session.serverPort}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6b6b8a]">Password</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-[#e8e8e8]">{session.serverPassword}</span>
                <button
                  onClick={copyPassword}
                  className="p-1 rounded hover:bg-[#1a1a2e] transition-colors"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-[#00c850]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-[#6b6b8a]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          {connectUrl && (
            <a
              href={connectUrl}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f0a500] px-4 py-3 text-sm font-bold text-[#0a0a12] transition-all hover:bg-[#d4900a] mb-3"
            >
              <ExternalLink className="h-4 w-4" />
              Connect via Steam
            </a>
          )}

          <button
            onClick={handleEnd}
            disabled={ending}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#2a2a3e] bg-transparent px-4 py-2.5 text-sm font-medium text-[#6b6b8a] transition-all hover:border-[#ff4444] hover:text-[#ff4444] disabled:opacity-50"
          >
            {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            Cancel Session
          </button>
        </div>
      </motion.div>
    );
  }

  // State 1: No session — show map selector + start button
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl overflow-hidden"
      style={{ borderTop: '2px solid #4a9fd4' }}
    >
      <div className="p-6">
        {/* Usage bar for free users (only when time is not exhausted) */}
        {usage && !usage.isPremium && !timeExhausted && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#6b6b8a]">Weekly usage</span>
              <span className="text-xs font-mono text-[#6b6b8a]">
                {formatMinutes(usage.usedSeconds)} / {formatMinutes(usage.limitSeconds)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundColor:
                    usagePercent >= 90 ? '#ff4444' : usagePercent >= 70 ? '#f0a500' : '#00c850',
                }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {timeExhausted ? (
            <motion.div
              key="exhausted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0a50015]">
                <Crown className="h-6 w-6 text-[#f0a500]" />
              </div>
              <p className="text-sm text-[#e8e8e8] mb-1 font-medium">Weekly limit reached</p>
              <p className="text-xs text-[#6b6b8a] mb-4">
                Your free {limitLabel} this week are used up. Come back next week or upgrade for unlimited practice.
              </p>
              <Link
                href="/dashboard/premium"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f0a500] to-[#d4900a] px-5 py-2.5 text-sm font-bold text-[#0a0a12] transition-all hover:shadow-lg hover:shadow-[#f0a50030]"
              >
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </Link>
            </motion.div>
          ) : (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Map selector */}
              <label className="block text-xs text-[#6b6b8a] mb-2">Select Map</label>
              <select
                value={selectedMap}
                onChange={(e) => setSelectedMap(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a12] px-3 py-2.5 text-sm text-[#e8e8e8] mb-4 focus:outline-none focus:border-[#4a9fd4] transition-colors"
              >
                {MAPS.map((map) => (
                  <option key={map.name} value={map.name}>
                    {map.displayName} ({map.name})
                  </option>
                ))}
              </select>

              {error && (
                <p className="text-xs text-[#ff4444] mb-3">{error}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a9fd4] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a8fc4] disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Practice
              </button>

              {usage && !usage.isPremium && (
                <p className="mt-3 text-center text-xs text-[#6b6b8a]">
                  {formatMinutes(usage.remainingSeconds)} remaining this week
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
