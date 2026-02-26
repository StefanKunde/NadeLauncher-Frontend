'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight, Lock } from 'lucide-react';
import { achievementsApi } from '@/lib/api';
import type { AchievementWithStatus, AchievementTier } from '@/lib/types';

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
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function AchievementsCard() {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    achievementsApi
      .getAll()
      .then((data) => setAchievements(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || achievements.length === 0) return null;

  const unlocked = achievements.filter((a) => a.isUnlocked);
  const locked = achievements.filter((a) => !a.isUnlocked);

  // Show max 3 unlocked (most recent) + 3 locked
  const showUnlocked = unlocked
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);
  const showLocked = locked.slice(0, 3);

  return (
    <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#f0a500]" />
            <h3 className="text-sm font-semibold text-[#e8e8e8]">Achievements</h3>
            {unlocked.length > 0 && (
              <span className="text-[10px] text-[#6b6b8a]">
                {unlocked.length}/{achievements.length}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/achievements"
            className="text-xs font-medium text-[#f0a500] hover:text-[#ffd700] transition-colors flex items-center gap-0.5"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Unlocked achievements */}
        {showUnlocked.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {showUnlocked.map((a) => {
              const tierColor = TIER_COLORS[a.tier];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 border transition-colors"
                  style={{
                    borderColor: `${tierColor}30`,
                    backgroundColor: `${tierColor}08`,
                  }}
                >
                  <span className="text-base">{ICON_MAP[a.icon] || '\uD83C\uDFC6'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#e8e8e8] truncate">{a.name}</p>
                    <p className="text-[9px] text-[#6b6b8a]">
                      <span
                        className="font-semibold capitalize"
                        style={{ color: tierColor }}
                      >
                        {a.tier}
                      </span>
                      {a.unlockedAt && <> &middot; {timeAgo(a.unlockedAt)}</>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Locked preview */}
        {showLocked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {showLocked.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-lg px-3 py-2 border border-[#2a2a3e]/30 bg-[#0a0a12] opacity-50"
              >
                <Lock className="h-3.5 w-3.5 text-[#6b6b8a]" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#6b6b8a] truncate">{a.name}</p>
                  <p className="text-[9px] text-[#6b6b8a]/60 capitalize">{a.tier}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
