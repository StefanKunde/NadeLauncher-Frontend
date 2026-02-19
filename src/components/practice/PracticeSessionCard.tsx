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
  AlertTriangle,
  UserX,
  Users,
  Terminal,
  RefreshCw,
  ChevronDown,
  Map,
} from 'lucide-react';
import Link from 'next/link';
import { sessionsApi, collectionsApi, userCollectionsApi } from '@/lib/api';
import { MAPS } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import { useSessionSocket } from '@/hooks/useSessionSocket';
import type { Session, UsageStats, LineupCollection } from '@/lib/types';

function groupCollections(collections: LineupCollection[], userId?: string) {
  const pro: LineupCollection[] = [];
  const own: LineupCollection[] = [];
  const community: LineupCollection[] = [];
  for (const c of collections) {
    if (c.autoManaged && !c.ownerId) pro.push(c);
    else if (c.ownerId === userId) own.push(c);
    else community.push(c);
  }
  return { pro, own, community };
}

function CollectionOptgroups({ collections, userId }: { collections: LineupCollection[]; userId?: string }) {
  const { pro, own, community } = groupCollections(collections, userId);
  return (
    <>
      {own.length > 0 && (
        <optgroup label="My Collections">
          {own.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.lineupCount})</option>
          ))}
        </optgroup>
      )}
      {pro.length > 0 && (
        <optgroup label="Pro Collections">
          {pro.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.lineupCount})</option>
          ))}
        </optgroup>
      )}
      {community.length > 0 && (
        <optgroup label="Community">
          {community.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.lineupCount})</option>
          ))}
        </optgroup>
      )}
    </>
  );
}

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

function CommandsList() {
  return (
    <div className="rounded-lg bg-[#0a0a12] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="h-4 w-4 text-[#f0a500]" />
        <span className="text-xs font-semibold text-[#e8e8e8] uppercase tracking-wider">
          Available Commands
        </span>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!save</code>
          <span className="text-[#6b6b8a]">Save current position as a lineup <span className="text-[#88bbee]">(!s)</span></span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!savelast</code>
          <span className="text-[#6b6b8a]">Save your last thrown grenade <span className="text-[#88bbee]">(!sl)</span></span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!desc</code>
          <span className="text-[#6b6b8a]">Set description for last saved lineup</span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!rethrow</code>
          <span className="text-[#6b6b8a]">Rethrow last grenade <span className="text-[#88bbee]">(!r)</span></span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!back</code>
          <span className="text-[#6b6b8a]">Teleport back to last lineup</span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!clear</code>
          <span className="text-[#6b6b8a]">Remove smokes, molotovs & decoys <span className="text-[#88bbee]">(!c)</span></span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!show</code>
          <span className="text-[#6b6b8a]">Show all lineup markers</span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!hide</code>
          <span className="text-[#6b6b8a]">Hide all lineup markers</span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!filter</code>
          <span className="text-[#6b6b8a]">Filter by grenade type (smoke, flash, he, molotov, all) <span className="text-[#88bbee]">(!f)</span></span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!noflash</code>
          <span className="text-[#6b6b8a]">Toggle flash blindness</span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!ff</code>
          <span className="text-[#6b6b8a]">Fast-forward time (skip smokes)</span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!maps</code>
          <span className="text-[#6b6b8a]">Change to a different map</span>
        </div>
        <div className="flex items-start gap-2">
          <code className="text-[#f0a500] bg-[#12121a] px-1.5 py-0.5 rounded shrink-0">!pos</code>
          <span className="text-[#6b6b8a]">Show current position and angles</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#6b6b8a] italic">
        Tip: You can also use <code className="text-[#88bbee]">.command</code> instead of <code className="text-[#88bbee]">!command</code>
      </p>
      <Link
        href="/dashboard/guide"
        className="mt-2 inline-flex items-center gap-1 text-xs text-[#f0a500] hover:text-[#f0b530] transition-colors"
      >
        View full guide for more commands & tips →
      </Link>
    </div>
  );
}

export default function PracticeSessionCard() {
  const user = useAuthStore((s) => s.user);
  const [session, setSession] = useState<Session | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [selectedMap, setSelectedMap] = useState<string>(MAPS[0].name);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collections, setCollections] = useState<LineupCollection[]>([]);
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
  const [connectionCountdown, setConnectionCountdown] = useState<number | null>(null);
  const connectionCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastEndReason, setLastEndReason] = useState<Session['endReason'] | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [showCollectionChanger, setShowCollectionChanger] = useState(false);
  const [changingCollection, setChangingCollection] = useState(false);
  const [activeCollections, setActiveCollections] = useState<LineupCollection[]>([]);

  // WebSocket connection for real-time updates
  const { sendHeartbeat } = useSessionSocket({
    enabled: !!user,
    onStatusUpdate: (updatedSession) => {
      console.log('[PracticeCard] WebSocket session update:', updatedSession.status);
      setSession(updatedSession);
      if (updatedSession.queuePosition !== undefined) {
        setQueuePosition(updatedSession.queuePosition);
      }
    },
    onQueuePosition: (position) => {
      console.log('[PracticeCard] WebSocket queue position:', position);
      setQueuePosition(position);
    },
    onSessionEnded: (reason) => {
      console.log('[PracticeCard] WebSocket session ended:', reason);
      setLastEndReason(reason as Session['endReason']);
      setSession(null);
      // Refresh usage stats
      sessionsApi.getUsage().then(setUsage).catch(() => {});
    },
  });

  const fetchState = useCallback(async () => {
    try {
      const [activeSession, usageData] = await Promise.all([
        sessionsApi.getActive(),
        sessionsApi.getUsage(),
      ]);

      // Track if session just ended and capture the reason
      if (session?.isActive && !activeSession?.isActive) {
        // Session ended - get the end reason from the old session if available
        // or from the new inactive session data
        const reason = activeSession?.endReason || session?.endReason;
        if (reason) {
          setLastEndReason(reason);
        }
      }

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
  }, [session?.isActive, session?.endReason]);

  // Initial load
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Poll while session is active (faster during provisioning)
  useEffect(() => {
    if (session?.isActive) {
      const isProvisioning = session.status === 'pending' || session.status === 'provisioning';
      const interval = isProvisioning ? 2000 : 5000; // Poll every 2s during provisioning
      pollRef.current = setInterval(fetchState, interval);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session?.isActive, session?.status, fetchState]);

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

  // Connection timeout countdown (when waiting for connection)
  useEffect(() => {
    if (session?.isActive && !session.startedAt && session.connectionTimeoutAt) {
      const updateCountdown = () => {
        const remaining = Math.max(
          0,
          Math.floor((new Date(session.connectionTimeoutAt!).getTime() - Date.now()) / 1000)
        );
        setConnectionCountdown(remaining);

        // If countdown reaches zero, refetch to get updated session state
        if (remaining <= 0) {
          fetchState();
        }
      };

      updateCountdown();
      connectionCountdownRef.current = setInterval(updateCountdown, 1000);
    } else {
      setConnectionCountdown(null);
    }
    return () => {
      if (connectionCountdownRef.current) clearInterval(connectionCountdownRef.current);
    };
  }, [session?.isActive, session?.startedAt, session?.connectionTimeoutAt, fetchState]);

  // Send heartbeat when in queue to keep position alive
  useEffect(() => {
    if (session?.isActive && session.status === 'queued') {
      // Send heartbeat immediately
      sendHeartbeat();
      // Then every 30 seconds
      const heartbeatInterval = setInterval(sendHeartbeat, 30000);
      return () => clearInterval(heartbeatInterval);
    }
  }, [session?.isActive, session?.status, sendHeartbeat]);

  // Update queue position from session when it changes
  useEffect(() => {
    if (session?.queuePosition !== undefined) {
      setQueuePosition(session.queuePosition);
    }
  }, [session?.queuePosition]);

  // Fetch collections for active session's map (for collection switcher)
  const isPremium = user?.isPremium ?? false;
  useEffect(() => {
    if (!session?.isActive || !session.startedAt) {
      setActiveCollections([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const fetches: Promise<LineupCollection[]>[] = [
          userCollectionsApi.getMy(session.mapName),
        ];
        if (isPremium) {
          fetches.push(collectionsApi.getAll(session.mapName));
        }
        // Fetch subscribed community collections
        fetches.push(
          collectionsApi.getSubscriptions().then((subs) =>
            subs
              .filter((s) => s.collection.mapName === session.mapName)
              .map((s) => s.collection),
          ),
        );
        const results = await Promise.all(fetches);
        if (cancelled) return;
        const userColls = results[0];
        const metaColls = isPremium && results[1]
          ? results[1].filter((c) => c.proCategory === 'meta' || c.proCategory === 'meta_all')
          : [];
        const subscribedColls = isPremium ? results[2] : results[1];
        // Deduplicate by id
        const seen = new Set<string>();
        const all: LineupCollection[] = [];
        for (const c of [...userColls, ...metaColls, ...(subscribedColls || [])]) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            all.push(c);
          }
        }
        setActiveCollections(all);
      } catch {
        if (!cancelled) setActiveCollections([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [session?.isActive, session?.startedAt, session?.mapName, isPremium]);

  // Fetch collections when selected map changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const fetches: Promise<LineupCollection[]>[] = [
          userCollectionsApi.getMy(selectedMap),
        ];
        // Only fetch pro collections for premium users
        if (isPremium) {
          fetches.push(collectionsApi.getAll(selectedMap));
        }
        // Fetch subscribed community collections
        fetches.push(
          collectionsApi.getSubscriptions().then((subs) =>
            subs
              .filter((s) => s.collection.mapName === selectedMap)
              .map((s) => s.collection),
          ),
        );
        const results = await Promise.all(fetches);
        if (cancelled) return;
        const userColls = results[0];
        const metaColls = isPremium && results[1]
          ? results[1].filter((c) => c.proCategory === 'meta' || c.proCategory === 'meta_all')
          : [];
        const subscribedColls = isPremium ? results[2] : results[1];
        // Deduplicate by id
        const seen = new Set<string>();
        const all: LineupCollection[] = [];
        for (const c of [...userColls, ...metaColls, ...(subscribedColls || [])]) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            all.push(c);
          }
        }
        setCollections(all);
        // Pre-select the first collection (users must always have one)
        setSelectedCollection(all.length > 0 ? all[0].id : '');
      } catch {
        if (!cancelled) setCollections([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedMap, isPremium]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setLastEndReason(null); // Clear any previous end reason
    try {
      const created = await sessionsApi.create(selectedMap, selectedCollection || undefined);
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

  const handleChangeCollection = async (collectionId: string | null) => {
    setChangingCollection(true);
    try {
      const updated = await sessionsApi.updateCollection(collectionId ?? undefined);
      setSession(updated);
      setShowCollectionChanger(false);
    } catch {
      // ignore
    } finally {
      setChangingCollection(false);
    }
  };

  const copyConnectCommand = async () => {
    if (!session?.serverIp || !session?.serverPort || !session?.serverPassword) return;
    const command = `connect ${session.serverIp}:${session.serverPort}; password ${session.serverPassword}`;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectUrl =
    session?.serverIp && session?.serverPort && session?.serverPassword
      ? `steam://run/730//+connect%20${session.serverIp}:${session.serverPort}%20+password%20${session.serverPassword}`
      : null;

  const limitLabel = usage
    ? usage.limitSeconds < 120
      ? `${usage.limitSeconds} seconds`
      : `${Math.round(usage.limitSeconds / 60)} minutes`
    : '30 minutes';
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
        className="grid grid-cols-1 xl:grid-cols-[1fr_380px] items-start gap-6"
      >
        {/* Session Card */}
        <div
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

            <div className="grid grid-cols-2 gap-4 mb-4">
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

            {/* Collection Switcher */}
            <div className="rounded-lg bg-[#0a0a12] p-4 mb-4">
              <label className="flex items-center gap-1.5 text-xs text-[#6b6b8a] mb-2">
                <Shield className="h-3.5 w-3.5" />
                Collection
              </label>
              <div className="relative">
                <select
                  value={session.practiceCollectionId ?? ''}
                  onChange={(e) => {
                    if (e.target.value && e.target.value !== session.practiceCollectionId) {
                      handleChangeCollection(e.target.value);
                    }
                  }}
                  disabled={changingCollection}
                  className="w-full appearance-none rounded-lg border border-[#2a2a3e] bg-[#12121a] pl-3 pr-9 py-2 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#4a9fd4]/60 transition-colors cursor-pointer hover:border-[#3a3a5e] disabled:opacity-60"
                >
                  <CollectionOptgroups collections={activeCollections} userId={user?.id} />
                </select>
                {changingCollection ? (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b6b8a] animate-spin pointer-events-none" />
                ) : (
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b6b8a] pointer-events-none" />
                )}
              </div>
            </div>

            {/* Connection Details */}
            {session.serverIp && session.serverPort && session.serverPassword && (
              <div className="rounded-lg bg-[#0a0a12] p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#6b6b8a]">Console Command</span>
                  <button
                    onClick={copyConnectCommand}
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#1a1a2e] transition-colors text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#00c850]" />
                        <span className="text-[#00c850]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#6b6b8a]" />
                        <span className="text-[#6b6b8a]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <code className="block text-sm font-mono text-[#e8e8e8] bg-[#12121a] rounded px-3 py-2 break-all">
                  connect {session.serverIp}:{session.serverPort}; password {session.serverPassword}
                </code>
              </div>
            )}

            <button
              onClick={handleEnd}
              disabled={ending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#ff4444] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#cc3333] disabled:opacity-50"
            >
              {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              End Session
            </button>
          </div>
        </div>

        {/* How It Works Card */}
        <div className="glass rounded-xl overflow-hidden" style={{ borderTop: '2px solid #f0a500' }}>
          <div className="p-6 space-y-4">
            <CommandsList />

            {/* AFK Warning */}
            <div className="rounded-lg bg-[#ff444410] border border-[#ff444430] p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[#ff4444] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#ff4444] font-medium mb-1">AFK Warning</p>
                  <p className="text-[#6b6b8a]">
                    You will be kicked after 5 minutes of inactivity and your session will end.
                    Move around or throw grenades to stay active.
                  </p>
                </div>
              </div>
            </div>

            {/* Practice Mode Info */}
            <div className="rounded-lg bg-[#00c85010] border border-[#00c85030] p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-[#00c850] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#00c850] font-medium mb-1">Practice Mode Active</p>
                  <p className="text-[#6b6b8a]">
                    Godmode, infinite ammo, and grenade trajectories are enabled.
                    Your lineups are automatically synced with your collections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // State: Queued (waiting for server slot)
  if (session?.isActive && session.status === 'queued') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #6366f1' }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#6366f115]">
            <Users className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#e8e8e8] mb-2">
            Waiting in Queue
          </h3>
          <p className="text-sm text-[#6b6b8a] mb-4">
            All servers are currently busy. You are in position:
          </p>
          <div className="text-5xl font-bold text-[#6366f1] mb-4 tabular-nums">
            #{queuePosition ?? session.queuePosition ?? '...'}
          </div>
          <p className="text-xs text-[#6b6b8a] mb-4">
            Your server will start automatically when a slot opens.
          </p>
          <div className="rounded-lg bg-[#0a0a12] p-3 mb-4">
            <p className="text-xs text-[#6b6b8a]">
              Map: {MAPS.find((m) => m.name === session.mapName)?.displayName ?? session.mapName}
            </p>
          </div>

          <button
            onClick={handleEnd}
            disabled={ending}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#2a2a3e] bg-transparent px-4 py-2.5 text-sm font-medium text-[#6b6b8a] transition-all hover:border-[#ff4444] hover:text-[#ff4444] disabled:opacity-50"
          >
            {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            Leave Queue
          </button>
        </div>
      </motion.div>
    );
  }

  // State: Provisioning (pending or provisioning status)
  if (session?.isActive && (session.status === 'pending' || session.status === 'provisioning')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 xl:grid-cols-[1fr_380px] items-start gap-6"
      >
        {/* Provisioning Card */}
        <div
          className="glass rounded-xl overflow-hidden"
          style={{ borderTop: '2px solid #4a9fd4' }}
        >
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#4a9fd4]" />
            </div>
            <h3 className="text-lg font-semibold text-[#e8e8e8] mb-2">
              Starting Your Server
            </h3>
            <p className="text-sm text-[#6b6b8a] mb-4">
              {session.status === 'pending'
                ? 'Preparing resources...'
                : 'Provisioning server (usually around 2 minutes)...'}
            </p>
            <div className="rounded-lg bg-[#0a0a12] p-3">
              <p className="text-xs text-[#6b6b8a]">
                Map: {MAPS.find((m) => m.name === session.mapName)?.displayName ?? session.mapName}
              </p>
            </div>

            <button
              onClick={handleEnd}
              disabled={ending}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-[#2a2a3e] bg-transparent px-4 py-2.5 text-sm font-medium text-[#6b6b8a] transition-all hover:border-[#ff4444] hover:text-[#ff4444] disabled:opacity-50"
            >
              {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Cancel
            </button>
          </div>
        </div>

        {/* How It Works Card */}
        <div className="glass rounded-xl overflow-hidden" style={{ borderTop: '2px solid #f0a500' }}>
          <div className="p-6 space-y-4">
            <CommandsList />

            {/* AFK Warning */}
            <div className="rounded-lg bg-[#ff444410] border border-[#ff444430] p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[#ff4444] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#ff4444] font-medium mb-1">AFK Warning</p>
                  <p className="text-[#6b6b8a]">
                    You will be kicked after 5 minutes of inactivity and your session will end.
                    Move around or throw grenades to stay active.
                  </p>
                </div>
              </div>
            </div>

            {/* Practice Mode Info */}
            <div className="rounded-lg bg-[#00c85010] border border-[#00c85030] p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-[#00c850] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#00c850] font-medium mb-1">Practice Mode Active</p>
                  <p className="text-[#6b6b8a]">
                    Godmode, infinite ammo, and grenade trajectories are enabled.
                    Your lineups are automatically synced with your collections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // State: Provisioning failed
  if (session?.isActive && session.status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #ff4444' }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff444415]">
            <AlertTriangle className="h-6 w-6 text-[#ff4444]" />
          </div>
          <h3 className="text-lg font-semibold text-[#e8e8e8] mb-2">
            Server Failed to Start
          </h3>
          <p className="text-sm text-[#6b6b8a] mb-4">
            {session.provisioningError || 'An error occurred while starting the server.'}
          </p>
          <button
            onClick={async () => {
              await handleEnd();
              setLastEndReason(null);
            }}
            disabled={ending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a9fd4] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a8fc4] disabled:opacity-50 mb-3"
          >
            {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Try Again
          </button>
          <p className="text-xs text-[#6b6b8a]">
            If this persists, please contact support.
          </p>
        </div>
      </motion.div>
    );
  }

  // State 2: Created but not connected (waiting for player - status is 'ready')
  if (session?.isActive && !session.startedAt && session.status === 'ready' && session.serverIp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 xl:grid-cols-[1fr_380px] items-start gap-6"
      >
        {/* Server Ready Card */}
        <div
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

            {/* Connection Timeout Warning */}
            {connectionCountdown !== null && (
              <div className="rounded-lg bg-[#f0a50015] border border-[#f0a50030] p-3 mb-4">
                <div className="flex items-center gap-2 text-[#f0a500]">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Connect within {formatTime(connectionCountdown)}
                  </span>
                </div>
                <p className="text-xs text-[#6b6b8a] mt-1">
                  Session will expire if you don&apos;t connect in time
                </p>
              </div>
            )}

            {/* Connection Details */}
            <div className="rounded-lg bg-[#0a0a12] p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6b6b8a]">Console Command</span>
                <button
                  onClick={copyConnectCommand}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#1a1a2e] transition-colors text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#00c850]" />
                      <span className="text-[#00c850]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#6b6b8a]" />
                      <span className="text-[#6b6b8a]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <code className="block text-sm font-mono text-[#e8e8e8] bg-[#12121a] rounded px-3 py-2 break-all">
                connect {session.serverIp}:{session.serverPort}; password {session.serverPassword}
              </code>
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
        </div>

        {/* How It Works Card */}
        <div className="glass rounded-xl overflow-hidden" style={{ borderTop: '2px solid #f0a500' }}>
          <div className="p-6 space-y-4">
            <CommandsList />

            {/* AFK Warning */}
            <div className="rounded-lg bg-[#ff444410] border border-[#ff444430] p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[#ff4444] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#ff4444] font-medium mb-1">AFK Warning</p>
                  <p className="text-[#6b6b8a]">
                    You will be kicked after 5 minutes of inactivity and your session will end.
                    Move around or throw grenades to stay active.
                  </p>
                </div>
              </div>
            </div>

            {/* Practice Mode Info */}
            <div className="rounded-lg bg-[#00c85010] border border-[#00c85030] p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-[#00c850] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#00c850] font-medium mb-1">Practice Mode Active</p>
                  <p className="text-[#6b6b8a]">
                    Godmode, infinite ammo, and grenade trajectories are enabled.
                    Your lineups are automatically synced with your collections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // State: Session ended due to connection timeout
  if (!session && lastEndReason === 'connection_timeout') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #ff4444' }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff444415]">
            <AlertTriangle className="h-6 w-6 text-[#ff4444]" />
          </div>
          <p className="text-sm text-[#e8e8e8] mb-1 font-medium">Session Expired</p>
          <p className="text-xs text-[#6b6b8a] mb-4">
            Your session timed out because you didn&apos;t connect within 5 minutes.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a9fd4] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a8fc4] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start New Session
          </button>
        </div>
      </motion.div>
    );
  }

  // State: Session ended due to AFK
  if (!session && lastEndReason === 'afk_timeout') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #ff4444' }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff444415]">
            <UserX className="h-6 w-6 text-[#ff4444]" />
          </div>
          <p className="text-sm text-[#e8e8e8] mb-1 font-medium">Kicked for AFK</p>
          <p className="text-xs text-[#6b6b8a] mb-4">
            Your session ended because you were inactive for too long.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a9fd4] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a8fc4] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start New Session
          </button>
        </div>
      </motion.div>
    );
  }

  // State: Session ended due to provisioning failure
  if (!session && lastEndReason === 'provisioning_failed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #ff4444' }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff444415]">
            <AlertTriangle className="h-6 w-6 text-[#ff4444]" />
          </div>
          <p className="text-sm text-[#e8e8e8] mb-1 font-medium">Server Failed to Start</p>
          <p className="text-xs text-[#6b6b8a] mb-4">
            There was an error starting your practice server. Please try again.
          </p>
          <button
            onClick={() => {
              setLastEndReason(null);
              handleCreate();
            }}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a9fd4] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a8fc4] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  // State: Server was preempted (Spot VM reclaimed by cloud provider)
  if (!session && lastEndReason === 'server_preempted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #f59e0b' }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f59e0b15]">
            <AlertTriangle className="h-6 w-6 text-[#f59e0b]" />
          </div>
          <p className="text-sm text-[#e8e8e8] mb-1 font-medium">Server Shut Down Unexpectedly</p>
          <p className="text-xs text-[#6b6b8a] mb-4">
            Your server shut down unexpectedly. This is rare — sorry for the interruption.
          </p>
          <button
            onClick={() => {
              setLastEndReason(null);
              handleCreate();
            }}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a9fd4] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a8fc4] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start New Server
          </button>
        </div>
      </motion.div>
    );
  }

  // State: Removed from queue due to inactivity
  if (!session && lastEndReason === 'queue_stale') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
        style={{ borderTop: '2px solid #6366f1' }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f115]">
            <Users className="h-6 w-6 text-[#6366f1]" />
          </div>
          <p className="text-sm text-[#e8e8e8] mb-1 font-medium">Removed from Queue</p>
          <p className="text-xs text-[#6b6b8a] mb-4">
            You were removed from the queue due to inactivity. Please try again.
          </p>
          <button
            onClick={() => {
              setLastEndReason(null);
              handleCreate();
            }}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a9fd4] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a8fc4] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Join Queue Again
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
      className="rounded-xl overflow-hidden border border-[#2a2a3e]/50 bg-[#12121a] max-w-lg"
    >
      {/* Top gradient accent */}
      <div className="h-[3px] bg-gradient-to-r from-[#4a9fd4] via-[#4a9fd4]/60 to-transparent" />

      <div className="p-6">
        {/* Usage bar for free users (only when time is not exhausted) */}
        {usage && !usage.isPremium && !timeExhausted && (
          <div className="mb-6 rounded-lg bg-[#0a0a12] border border-[#2a2a3e]/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#6b6b8a]" />
                <span className="text-xs font-medium text-[#b8b8cc]">Weekly Usage</span>
              </div>
              <span className="text-xs font-mono text-[#6b6b8a]">
                {formatMinutes(usage.usedSeconds)} / {formatMinutes(usage.limitSeconds)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background:
                    usagePercent >= 90
                      ? 'linear-gradient(90deg, #ff4444, #ff6666)'
                      : usagePercent >= 70
                        ? 'linear-gradient(90deg, #f0a500, #ffd700)'
                        : 'linear-gradient(90deg, #00c850, #22e070)',
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
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f0a500]/20 to-[#f0a500]/5 border border-[#f0a500]/15">
                <Crown className="h-7 w-7 text-[#f0a500]" />
              </div>
              <p className="text-sm text-[#e8e8e8] mb-1 font-semibold">Weekly limit reached</p>
              <p className="text-xs text-[#6b6b8a] mb-5 leading-relaxed">
                Your free {limitLabel} this week are used up.<br />Come back next week or upgrade for unlimited practice.
              </p>
              <Link
                href="/dashboard/premium"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f0a500] to-[#d4900a] px-6 py-3 text-sm font-bold text-[#0a0a12] transition-all hover:shadow-lg hover:shadow-[#f0a50030] hover:-translate-y-0.5"
              >
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </Link>
            </motion.div>
          ) : (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Map selector */}
              <div className="mb-4">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#b8b8cc] mb-2">
                  <Map className="h-3.5 w-3.5 text-[#6b6b8a]" />
                  Map
                </label>
                <div className="relative">
                  <select
                    value={selectedMap}
                    onChange={(e) => setSelectedMap(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#2a2a3e] bg-[#0a0a12] pl-4 pr-10 py-3 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#4a9fd4]/60 focus:ring-1 focus:ring-[#4a9fd4]/20 transition-all cursor-pointer hover:border-[#3a3a5e]"
                  >
                    {MAPS.map((map) => (
                      <option key={map.name} value={map.name}>
                        {map.displayName} ({map.name})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b8a] pointer-events-none" />
                </div>
              </div>

              {/* Collection selector */}
              {collections.length > 0 && (
                <div className="mb-5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#b8b8cc] mb-2">
                    <Shield className="h-3.5 w-3.5 text-[#6b6b8a]" />
                    Collection
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#2a2a3e] bg-[#0a0a12] pl-4 pr-10 py-3 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#4a9fd4]/60 focus:ring-1 focus:ring-[#4a9fd4]/20 transition-all cursor-pointer hover:border-[#3a3a5e]"
                    >
                      <CollectionOptgroups collections={collections} userId={user?.id} />
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b8a] pointer-events-none" />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-[#ff4444]/8 border border-[#ff4444]/15 px-3 py-2 mb-4">
                  <p className="text-xs text-[#ff4444]">{error}</p>
                </div>
              )}

              {/* Start button */}
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                style={{
                  background: creating
                    ? '#2a2a3e'
                    : 'linear-gradient(135deg, #4a9fd4, #3a7fb8)',
                  boxShadow: creating
                    ? 'none'
                    : '0 2px 12px rgba(74, 159, 212, 0.15)',
                }}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {creating ? 'Starting...' : 'Start Practice'}
              </button>

              {usage && !usage.isPremium && (
                <p className="mt-3 text-center text-[11px] text-[#6b6b8a]">
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
