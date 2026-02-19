'use client';

import Link from 'next/link';
import { Clock, BarChart3, Map, Folder, Globe, Users, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import type { PracticeStats, LineupCollection, UserSubscription } from '@/lib/types';

interface StatsGridProps {
  practiceStats: PracticeStats | null;
  myCollections: LineupCollection[];
  subscriptions: UserSubscription[];
  loading: boolean;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function getMapDisplayName(mapName: string): string {
  return MAPS.find((m) => m.name === mapName)?.displayName ?? mapName;
}

// ── Skeleton ────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-[#1a1a2e]" />
        <div className="h-3 w-24 rounded bg-[#1a1a2e]" />
      </div>
      <div className="h-8 w-20 rounded bg-[#1a1a2e] mb-2" />
      <div className="h-3 w-32 rounded bg-[#1a1a2e]" />
    </div>
  );
}

// ── Tile wrapper ────────────────────────────────────────────

function TileHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color }} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]">{label}</p>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────

export default function StatsGrid({ practiceStats, myCollections, subscriptions, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
    );
  }

  const stats = practiceStats ?? {
    totalSeconds: 0,
    totalSessions: 0,
    weekSeconds: 0,
    monthSeconds: 0,
    yearSeconds: 0,
    mapBreakdown: [],
  };

  const totalLineups = myCollections.reduce((sum, c) => sum + c.lineupCount, 0);
  const publishedCollections = myCollections.filter((c) => c.isPublished);
  const topCollections = [...myCollections]
    .sort((a, b) => b.lineupCount - a.lineupCount)
    .slice(0, 3);
  const communitySubscriptions = subscriptions.filter((s) => s.collection.ownerId);
  const topSubscriptions = communitySubscriptions.slice(0, 3);
  const maxMapSeconds = stats.mapBreakdown[0]?.totalSeconds || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Tile 1: Total Practice Time */}
      <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-5">
        <TileHeader icon={Clock} label="Total Practice Time" color="#22c55e" />
        <p className="text-3xl font-bold text-[#e8e8e8]">
          {stats.totalSeconds > 0 ? formatDuration(stats.totalSeconds) : '0m'}
        </p>
        <p className="text-xs text-[#6b6b8a] mt-1">
          {stats.totalSessions} session{stats.totalSessions !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tile 2: Practice Breakdown */}
      <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-5">
        <TileHeader icon={BarChart3} label="Practice Breakdown" color="#4a9fd4" />
        <div className="space-y-0">
          {([
            { label: 'This Week', value: stats.weekSeconds },
            { label: 'This Month', value: stats.monthSeconds },
            { label: 'This Year', value: stats.yearSeconds },
          ] as const).map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex items-center justify-between py-2.5 ${
                i < 2 ? 'border-b border-[#2a2a3e]/30' : ''
              }`}
            >
              <span className="text-xs text-[#8888aa]">{label}</span>
              <span className={`text-sm font-semibold ${value > 0 ? 'text-[#e8e8e8]' : 'text-[#6b6b8a]'}`}>
                {value > 0 ? formatDuration(value) : '0m'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tile 3: Most Practiced Maps */}
      <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-5">
        <TileHeader icon={Map} label="Most Practiced Maps" color="#f0a500" />
        {stats.mapBreakdown.length > 0 ? (
          <div className="space-y-3">
            {stats.mapBreakdown.slice(0, 5).map((m) => {
              const barColor = MAP_COLORS[m.mapName] || '#f0a500';
              const pct = (m.totalSeconds / maxMapSeconds) * 100;
              return (
                <div key={m.mapName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#e8e8e8] font-medium">{getMapDisplayName(m.mapName)}</span>
                    <span className="text-[10px] text-[#6b6b8a] tabular-nums">{formatDuration(m.totalSeconds)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1a1a2e]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#6b6b8a] text-center py-4">No practice sessions yet</p>
        )}
      </div>

      {/* Tile 4: My Collections */}
      <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-5">
        <TileHeader icon={Folder} label="My Collections" color="#f0a500" />
        <p className="text-3xl font-bold text-[#e8e8e8]">{myCollections.length}</p>
        <p className="text-xs text-[#6b6b8a] mt-1">{totalLineups} total lineups</p>
        {topCollections.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {topCollections.map((c) => (
              <Link key={c.id} href={`/dashboard/collections/${c.id}`} className="flex items-center gap-2 group">
                <div
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: MAP_COLORS[c.mapName] || '#f0a500' }}
                />
                <span className="text-xs text-[#8888aa] group-hover:text-[#e8e8e8] transition-colors truncate flex-1">{c.name}</span>
                <span className="text-[10px] text-[#6b6b8a] tabular-nums shrink-0">{c.lineupCount}</span>
              </Link>
            ))}
          </div>
        )}
        <Link
          href="/dashboard/maps"
          className="flex items-center gap-1 mt-3 text-[11px] font-medium text-[#f0a500]/70 hover:text-[#f0a500] transition-colors"
        >
          Manage collections <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Tile 5: Published Collections */}
      <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-5">
        <TileHeader icon={Globe} label="Published" color="#6c5ce7" />
        <p className="text-3xl font-bold text-[#e8e8e8]">{publishedCollections.length}</p>
        {publishedCollections.length > 0 ? (
          <div className="mt-3 space-y-2">
            {publishedCollections.slice(0, 3).map((c) => (
              <Link key={c.id} href={`/dashboard/collections/${c.id}`} className="flex items-center gap-2 group">
                <span className="text-xs text-[#8888aa] group-hover:text-[#e8e8e8] transition-colors truncate flex-1">{c.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(c.ratingCount ?? 0) > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-[#f0a500]" />
                      <span className="text-[10px] text-[#b8b8cc] tabular-nums">
                        {(c.averageRating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5">
                    <Users className="h-3 w-3 text-[#6b6b8a]" />
                    <span className="text-[10px] text-[#6b6b8a] tabular-nums">{c.subscriberCount ?? 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6b6b8a] mt-2">Share your lineups with the community</p>
        )}
      </div>

      {/* Tile 6: Subscribed Collections */}
      <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-5">
        <TileHeader icon={Users} label="Subscriptions" color="#6c5ce7" />
        <p className="text-3xl font-bold text-[#e8e8e8]">{communitySubscriptions.length}</p>
        {topSubscriptions.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {topSubscriptions.map((s) => (
              <Link key={s.id} href={`/dashboard/community/${s.collection.id}`} className="flex items-center gap-2 group">
                <div
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: MAP_COLORS[s.collection.mapName] || '#6c5ce7' }}
                />
                <span className="text-xs text-[#8888aa] group-hover:text-[#e8e8e8] transition-colors truncate flex-1">{s.collection.name}</span>
                <span className="text-[10px] text-[#6b6b8a] tabular-nums shrink-0">{s.collection.lineupCount}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6b6b8a] mt-2">Subscribe to community collections</p>
        )}
        <Link
          href="/dashboard/community"
          className="flex items-center gap-1 mt-3 text-[11px] font-medium text-[#6c5ce7]/70 hover:text-[#6c5ce7] transition-colors"
        >
          Browse community <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
