'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Target, Trophy, ChevronRight, Loader2, Crosshair, Users } from 'lucide-react';
import { trainingApi, collectionsApi } from '@/lib/api';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import type { TrainingCollection, UserSubscription } from '@/lib/types';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[10px] text-[#6b6b8a]">No attempts</span>;
  const color =
    score >= 80 ? '#22c55e' : score >= 50 ? '#f0a500' : score >= 20 ? '#f97316' : '#ef4444';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <Trophy className="h-3 w-3" />
      {score}%
    </span>
  );
}

export default function TrainingPage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<TrainingCollection[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

  useEffect(() => {
    Promise.all([
      trainingApi.getCollections(),
      collectionsApi.getSubscriptions().catch(() => [] as UserSubscription[]),
    ])
      .then(([cols, subs]) => {
        setCollections(cols);
        setSubscriptions(subs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group collections by map
  const byMap = useMemo(() => {
    const map = new Map<string, TrainingCollection[]>();
    for (const c of collections) {
      const arr = map.get(c.mapName) || [];
      arr.push(c);
      map.set(c.mapName, arr);
    }
    return map;
  }, [collections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#f0a500]" />
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-7xl">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0a500]/10 border border-[#f0a500]/15">
            <Target className="h-5 w-5 text-[#f0a500]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#e8e8e8]">Training</h1>
            <p className="text-sm text-[#6b6b8a]">
              Practice grenade lineups and track your accuracy
            </p>
          </div>
        </div>
      </motion.div>

      {/* How it works — show when no collections */}
      {collections.length === 0 && (
        <motion.div variants={fadeUp} custom={1} className="mb-10">
          <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-[#f0a500] via-[#f0a500]/40 to-transparent" />
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Crosshair className="h-4 w-4 text-[#f0a500]" />
                <h3 className="text-sm font-semibold text-[#e8e8e8]">How Training Works</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {[
                  { step: '1', text: 'Add lineups to a Training collection', desc: 'Use "Add to Training" on any lineup in your Nades tab' },
                  { step: '2', text: 'Start a Practice Server and use !training', desc: 'The plugin teleports you through each lineup for practice' },
                  { step: '3', text: 'Review your scores and climb the leaderboard', desc: 'Track accuracy per lineup and compare with other players' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 flex-1 rounded-xl bg-[#0a0a12] border border-[#2a2a3e]/30 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/12 text-[#f0a500] text-xs font-bold border border-[#f0a500]/10">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#e8e8e8] leading-snug">{item.text}</p>
                      <p className="mt-1 text-[11px] text-[#6b6b8a] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Collections grouped by map */}
      {collections.length > 0 ? (
        Array.from(byMap.entries()).map(([mapName, cols], mapIdx) => {
          const mapInfo = MAPS.find((m) => m.name === mapName);
          const color = MAP_COLORS[mapName] || '#f0a500';

          return (
            <motion.div key={mapName} variants={fadeUp} custom={mapIdx + 1} className="mb-8">
              {/* Map header */}
              <div className="flex items-center gap-3 mb-4">
                {mapInfo && (
                  <div className="relative h-10 w-16 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={mapInfo.screenshot}
                      alt={mapInfo.displayName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0f]/80" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-[#e8e8e8]">
                    {mapInfo?.displayName || mapName}
                  </h2>
                  <p className="text-[11px] text-[#6b6b8a]">
                    {cols.length} training collection{cols.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Collection cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cols.map((col) => (
                  <Link
                    key={col.id}
                    href={`/dashboard/training/${col.id}`}
                    className="group block rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] p-4 transition-all duration-200 hover:border-[#2a2a3e] hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Target className="h-4 w-4" style={{ color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#e8e8e8] truncate group-hover:text-[#f0a500] transition-colors">
                            {col.name}
                          </p>
                          <p className="text-[10px] text-[#6b6b8a]">
                            {col.lineupCount} lineup{col.lineupCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#2a2a3e] group-hover:text-[#6b6b8a] transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={col.bestScore} />
                      {col.bestAccuracy !== null && (
                        <span className="text-[10px] text-[#6b6b8a]">
                          {col.bestAccuracy}% accuracy
                        </span>
                      )}
                      {col.totalSessions > 0 && (
                        <span className="text-[10px] text-[#6b6b8a] ml-auto">
                          {col.totalSessions} session{col.totalSessions !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    {col.bestScore !== null && (
                      <div className="mt-3 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(col.bestScore, 100)}%`,
                            background: `linear-gradient(to right, ${color}, ${color}80)`,
                          }}
                        />
                      </div>
                    )}

                    {col.isDefault && (
                      <div className="mt-2">
                        <span className="text-[9px] uppercase tracking-wider text-[#6b6b8a]/50 font-medium">
                          Default
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          );
        })
      ) : (
        <motion.div variants={fadeUp} custom={2}>
          <div className="text-center py-16 rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]">
            <Target className="h-10 w-10 text-[#2a2a3e] mx-auto mb-3" />
            <p className="text-sm text-[#6b6b8a] mb-1">No training collections yet</p>
            <p className="text-xs text-[#6b6b8a]/60">
              Add lineups to training from any map page, or toggle training on a collection
            </p>
          </div>
        </motion.div>
      )}

      {/* Subscribed Community Collections */}
      {subscriptions.length > 0 && (
        <motion.div variants={fadeUp} custom={byMap.size + 2} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-[#6c5ce7]" />
            <h2 className="text-lg font-semibold text-[#e8e8e8]">Subscribed Collections</h2>
            <span className="text-[11px] text-[#6b6b8a]">Train with collections you've subscribed to</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subscriptions.map((sub) => {
              const col = sub.collection;
              const mapInfo = MAPS.find((m) => m.name === col.mapName);
              const mapColor = MAP_COLORS[col.mapName] || '#6c5ce7';
              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/community/${col.id}`}
                  className="group block rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] p-4 transition-all duration-200 hover:border-[#2a2a3e] hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${mapColor}15` }}
                      >
                        <Users className="h-4 w-4" style={{ color: mapColor }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#e8e8e8] truncate group-hover:text-[#6c5ce7] transition-colors">
                          {col.name}
                        </p>
                        <p className="text-[10px] text-[#6b6b8a]">
                          {mapInfo?.displayName || col.mapName} &middot; {col.lineupCount} lineup{col.lineupCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#2a2a3e] group-hover:text-[#6b6b8a] transition-colors shrink-0 mt-1" />
                  </div>
                  {col.subscriberCount !== undefined && col.subscriberCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-[#6b6b8a]">
                      <Users className="h-3 w-3" />
                      {col.subscriberCount} subscriber{col.subscriberCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
