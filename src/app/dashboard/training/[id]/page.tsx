'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Target,
  Trophy,
  Medal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  TrendingUp,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { trainingApi, collectionsApi } from '@/lib/api';
import { MAPS, MAP_COLORS, GRENADE_TYPES } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import type {
  TrainingStats,
  LeaderboardEntry,
  Lineup,
  LineupCollection,
} from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

function StatCard({
  label,
  value,
  sub,
  color = '#f0a500',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] p-4">
      <p className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[#6b6b8a] mt-0.5">{sub}</p>}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ffd700]/15 text-[#ffd700] text-xs font-bold">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#c0c0c0]/15 text-[#c0c0c0] text-xs font-bold">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#cd7f32]/15 text-[#cd7f32] text-xs font-bold">
        3
      </span>
    );
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a2e] text-[#6b6b8a] text-[10px] font-medium">
      {rank}
    </span>
  );
}

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<LineupCollection | null>(null);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardTotal, setLeaderboardTotal] = useState(0);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>('stats');

  const map = collection ? MAPS.find((m) => m.name === collection.mapName) : null;
  const color = collection ? MAP_COLORS[collection.mapName] || '#f0a500' : '#f0a500';

  // Load collection + stats + leaderboard
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [colData, statsData, lbData, rankData] = await Promise.all([
          collectionsApi.getById(collectionId),
          trainingApi.getStats(collectionId).catch(() => null),
          trainingApi.getLeaderboard(collectionId, 1, 10).catch(() => null),
          trainingApi.getRank(collectionId).catch(() => ({ rank: null })),
        ]);
        setCollection(colData.collection);
        setLineups(colData.lineups);
        setStats(statsData);
        if (lbData) {
          setLeaderboard(lbData.entries);
          setLeaderboardTotal(lbData.total);
        }
        setMyRank(rankData.rank);
      } catch {
        toast.error('Failed to load training collection');
        router.push('/dashboard/training');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collectionId, router]);

  // Load leaderboard page
  const loadLeaderboardPage = async (page: number) => {
    try {
      const data = await trainingApi.getLeaderboard(collectionId, page, 10);
      setLeaderboard(data.entries);
      setLeaderboardTotal(data.total);
      setLeaderboardPage(page);
    } catch {
      toast.error('Failed to load leaderboard');
    }
  };

  const totalPages = Math.ceil(leaderboardTotal / 10);

  // Sort lineup stats by success rate (worst first for improvement hints)
  const sortedLineupStats = useMemo(() => {
    if (!stats?.perLineup) return [];
    return [...stats.perLineup].sort((a, b) => a.successRate - b.successRate);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#f0a500]" />
      </div>
    );
  }

  if (!collection) return null;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/training"
          className="flex items-center gap-1 text-sm text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Training
        </Link>
        <div className="h-4 w-px bg-[#2a2a3e] shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15` }}
          >
            <Target className="h-4 w-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#e8e8e8] truncate">{collection.name}</h1>
            {map && (
              <span
                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {map.displayName}
              </span>
            )}
          </div>
        </div>
        {/* Rank badge */}
        {myRank !== null && (
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-[#2a2a3e]/50 bg-[#12121a] px-3 py-2">
            <Medal className="h-4 w-4 text-[#f0a500]" />
            <span className="text-sm font-semibold text-[#e8e8e8]">#{myRank}</span>
            <span className="text-[10px] text-[#6b6b8a]">Your Rank</span>
          </div>
        )}
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Best Score"
          value={stats?.bestScore !== null ? `${stats?.bestScore}%` : '—'}
          color={color}
        />
        <StatCard
          label="Best Accuracy"
          value={stats?.bestAccuracy !== null ? `${stats?.bestAccuracy}%` : '—'}
          sub="Perfect + Good hits"
          color="#22c55e"
        />
        <StatCard
          label="Sessions"
          value={String(stats?.totalSessions ?? 0)}
          sub="Training runs completed"
        />
        <StatCard
          label="Total Attempts"
          value={String(stats?.totalAttempts ?? 0)}
          sub={`${lineups.length} lineup${lineups.length !== 1 ? 's' : ''} in collection`}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#2a2a3e]/50">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'stats'
              ? 'text-[#f0a500]'
              : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Per-Lineup Stats
          </div>
          {activeTab === 'stats' && (
            <motion.div
              layoutId="training-tab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f0a500]"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'leaderboard'
              ? 'text-[#f0a500]'
              : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
            {leaderboardTotal > 0 && (
              <span className="ml-1 rounded-full bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] tabular-nums text-[#6b6b8a]">
                {leaderboardTotal}
              </span>
            )}
          </div>
          {activeTab === 'leaderboard' && (
            <motion.div
              layoutId="training-tab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f0a500]"
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' ? (
        <div className="space-y-2">
          {sortedLineupStats.length > 0 ? (
            sortedLineupStats.map((ls) => {
              const gType = ls.grenadeType as keyof typeof GRENADE_TYPES | null;
              const gColor = gType && GRENADE_TYPES[gType] ? GRENADE_TYPES[gType].color : '#6b6b8a';
              const barColor =
                ls.successRate >= 80
                  ? '#22c55e'
                  : ls.successRate >= 50
                    ? '#f0a500'
                    : ls.successRate >= 20
                      ? '#f97316'
                      : '#ef4444';
              return (
                <div
                  key={ls.lineupId}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3e]/30 bg-[#12121a] px-4 py-3"
                >
                  {/* Grenade icon */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${gColor}15` }}
                  >
                    {gType ? (
                      <GrenadeIcon type={gType} size={16} />
                    ) : (
                      <Crosshair className="h-4 w-4 text-[#6b6b8a]" />
                    )}
                  </div>

                  {/* Lineup name + throw type */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#e8e8e8] truncate">{ls.lineupName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ls.throwType && (
                        <span className="text-[10px] text-[#6b6b8a]">{ls.throwType}</span>
                      )}
                      <span className="text-[10px] text-[#6b6b8a]">
                        {ls.attempts} attempt{ls.attempts !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Success bar + rate */}
                  <div className="w-24 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[11px] font-bold tabular-nums"
                        style={{ color: barColor }}
                      >
                        {ls.successRate}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${ls.successRate}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Distance info */}
                  <div className="w-16 shrink-0 text-right">
                    {ls.bestDistance !== null ? (
                      <>
                        <p className="text-[11px] font-medium text-[#e8e8e8] tabular-nums">
                          {ls.bestDistance}u
                        </p>
                        <p className="text-[9px] text-[#6b6b8a]">best dist</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-[#6b6b8a]">—</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]">
              <TrendingUp className="h-8 w-8 text-[#2a2a3e] mx-auto mb-2" />
              <p className="text-sm text-[#6b6b8a]">No training data yet</p>
              <p className="text-xs text-[#6b6b8a]/60 mt-1">
                Use <span className="text-[#f0a500] font-mono">!training</span> in-game to start practicing
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Leaderboard */
        <div>
          {leaderboard.length > 0 ? (
            <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2a2a3e]/30 text-[10px] uppercase tracking-wider text-[#6b6b8a]">
                <div className="w-8 text-center">
                  <Hash className="h-3 w-3 inline" />
                </div>
                <div className="flex-1">Player</div>
                <div className="w-20 text-right">Score</div>
                <div className="w-20 text-right">Accuracy</div>
              </div>

              {/* Entries */}
              {leaderboard.map((entry) => {
                const isMe = user?.id === entry.userId;
                return (
                  <div
                    key={`${entry.userId}-${entry.rank}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3e]/15 last:border-0 transition-colors ${
                      isMe ? 'bg-[#f0a500]/[0.04]' : 'hover:bg-[#1a1a2e]/50'
                    }`}
                  >
                    <div className="w-8 flex justify-center shrink-0">
                      <RankBadge rank={entry.rank} />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {entry.avatar ? (
                        <img
                          src={entry.avatar}
                          alt=""
                          className="h-7 w-7 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-[#2a2a3e] shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium truncate ${
                          isMe ? 'text-[#f0a500]' : 'text-[#e8e8e8]'
                        }`}
                      >
                        {entry.username}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] text-[#f0a500]/60">(you)</span>
                        )}
                      </span>
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-sm font-bold text-[#e8e8e8] tabular-nums">
                        {entry.bestScore}%
                      </span>
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-xs text-[#6b6b8a] tabular-nums">
                        {entry.accuracyPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a3e]/30">
                  <button
                    onClick={() => loadLeaderboardPage(leaderboardPage - 1)}
                    disabled={leaderboardPage <= 1}
                    className="flex items-center gap-1 text-xs text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <span className="text-[10px] text-[#6b6b8a] tabular-nums">
                    Page {leaderboardPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => loadLeaderboardPage(leaderboardPage + 1)}
                    disabled={leaderboardPage >= totalPages}
                    className="flex items-center gap-1 text-xs text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]">
              <Trophy className="h-8 w-8 text-[#2a2a3e] mx-auto mb-2" />
              <p className="text-sm text-[#6b6b8a]">No leaderboard entries yet</p>
              <p className="text-xs text-[#6b6b8a]/60 mt-1">
                Complete a training session to appear on the leaderboard
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lineup list (below tabs) */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-[#e8e8e8] mb-3">
          Lineups in this Collection ({lineups.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {lineups.map((lineup) => {
            const gType = lineup.grenadeType as keyof typeof GRENADE_TYPES;
            const gColor = GRENADE_TYPES[gType]?.color ?? '#6b6b8a';
            return (
              <div
                key={lineup.id}
                className="flex items-center gap-3 rounded-xl border border-[#2a2a3e]/30 bg-[#12121a] px-3.5 py-2.5"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${gColor}15` }}
                >
                  <GrenadeIcon type={gType} size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#e8e8e8] truncate">{lineup.name}</p>
                  <p className="text-[10px] text-[#6b6b8a]">
                    {GRENADE_TYPES[gType]?.label} &middot; {lineup.throwType}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
