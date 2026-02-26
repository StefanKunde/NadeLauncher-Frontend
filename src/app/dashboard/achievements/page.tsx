'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Lock, Loader2, Crown } from 'lucide-react';
import { achievementsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { MAPS } from '@/lib/constants';
import type { AchievementWithStatus, AchievementTier } from '@/lib/types';

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

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#B9F2FF',
};

const ICON_MAP: Record<string, string> = {
  trophy: '\uD83C\uDFC6',
  star: '\u2B50',
  flame: '\uD83D\uDD25',
  crown: '\uD83D\uDC51',
  target: '\uD83C\uDFAF',
  map: '\uD83D\uDDFA\uFE0F',
  medal: '\uD83C\uDFC5',
  zap: '\u26A1',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? 's' : ''} ago`;
}

export default function AchievementsPage() {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.isPremium ?? false;
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    achievementsApi
      .getAll()
      .then((data) => setAchievements(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPremium]);

  const unlocked = achievements.filter((a) => a.isUnlocked);
  const globalAchievements = achievements.filter((a) => !a.mapName);
  const mapAchievements = achievements.filter((a) => a.mapName);

  // Group map achievements
  const byMap = new Map<string, AchievementWithStatus[]>();
  for (const a of mapAchievements) {
    const arr = byMap.get(a.mapName!) || [];
    arr.push(a);
    byMap.set(a.mapName!, arr);
  }

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
            <Trophy className="h-5 w-5 text-[#f0a500]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#e8e8e8]">Achievements</h1>
            <p className="text-sm text-[#6b6b8a]">
              {isPremium
                ? `${unlocked.length} of ${achievements.length} unlocked`
                : 'Track your milestones and earn rewards'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Premium gate */}
      {!isPremium && (
        <motion.div variants={fadeUp} custom={1} className="mb-10">
          <div className="rounded-xl border border-[#f0a500]/20 bg-[#12121a] overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-[#f0a500] via-[#f0a500]/40 to-transparent" />
            <div className="px-6 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0a500]/10 border border-[#f0a500]/15 mx-auto mb-4">
                <Crown className="h-6 w-6 text-[#f0a500]" />
              </div>
              <h3 className="text-lg font-semibold text-[#e8e8e8] mb-2">
                Achievements are a Premium Feature
              </h3>
              <p className="text-sm text-[#6b6b8a] mb-5 max-w-md mx-auto">
                Upgrade to Premium to unlock achievements, track milestones, and showcase your progress.
              </p>
              <Link
                href="/dashboard/premium"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f0a500] to-[#d4920a] px-5 py-2.5 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition-all"
              >
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {isPremium && achievements.length === 0 && (
        <motion.div variants={fadeUp} custom={1}>
          <div className="text-center py-16 rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]">
            <Trophy className="h-10 w-10 text-[#2a2a3e] mx-auto mb-3" />
            <p className="text-sm text-[#6b6b8a] mb-1">No achievements available yet</p>
            <p className="text-xs text-[#6b6b8a]/60">
              Achievements will appear here once they are set up
            </p>
          </div>
        </motion.div>
      )}

      {/* Global Achievements */}
      {isPremium && globalAchievements.length > 0 && (
        <motion.div variants={fadeUp} custom={1} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-[#f0a500]" />
            <h2 className="text-lg font-semibold text-[#e8e8e8]">Global</h2>
            <span className="text-[11px] text-[#6b6b8a]">
              {globalAchievements.filter((a) => a.isUnlocked).length}/{globalAchievements.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {globalAchievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Per-Map Achievements */}
      {isPremium &&
        MAPS.map((map, mapIdx) => {
          const mapAchs = byMap.get(map.name);
          if (!mapAchs || mapAchs.length === 0) return null;
          const mapUnlocked = mapAchs.filter((a) => a.isUnlocked).length;

          return (
            <motion.div
              key={map.name}
              variants={fadeUp}
              custom={mapIdx + 2}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-[#e8e8e8]">
                  {map.displayName}
                </h2>
                <span className="text-[11px] text-[#6b6b8a]">
                  {mapUnlocked}/{mapAchs.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mapAchs.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </motion.div>
          );
        })}
    </motion.div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementWithStatus }) {
  const tierColor = TIER_COLORS[achievement.tier];
  const isUnlocked = achievement.isUnlocked;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isUnlocked
          ? 'bg-[#12121a] border-[#2a2a3e]/50'
          : 'bg-[#0a0a12] border-[#2a2a3e]/20 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{
            backgroundColor: isUnlocked ? `${tierColor}15` : '#1a1a2e',
          }}
        >
          {isUnlocked ? (
            ICON_MAP[achievement.icon] || '\uD83C\uDFC6'
          ) : (
            <Lock className="h-4 w-4 text-[#6b6b8a]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium truncate ${
                isUnlocked ? 'text-[#e8e8e8]' : 'text-[#6b6b8a]'
              }`}
            >
              {achievement.name}
            </p>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: `${tierColor}20`,
                color: tierColor,
              }}
            >
              {achievement.tier}
            </span>
          </div>
          <p className="text-xs text-[#6b6b8a] mt-0.5">{achievement.description}</p>
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-[10px] text-[#6b6b8a]/60 mt-1">
              Unlocked {timeAgo(achievement.unlockedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
