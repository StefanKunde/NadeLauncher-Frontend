'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Loader2, Trophy, Clock, CheckCircle2, Circle, ArrowRight, Crown } from 'lucide-react';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import type { CourseWithProgress, CourseDifficulty, CollectionDifficulty } from '@/lib/types';

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

const DIFFICULTY_COLORS: Record<CourseDifficulty, string> = {
  beginner: '#22c55e',
  intermediate: '#06b6d4',
  advanced: '#f59e0b',
  expert: '#ef4444',
};

const COLL_DIFF_COLORS: Record<CollectionDifficulty, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

function formatDuration(ms: number | null): string {
  if (ms == null) return '\u2014';
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toFixed(0)}s`;
}

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.isPremium ?? false;
  const [course, setCourse] = useState<CourseWithProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !isPremium) {
      setLoading(false);
      return;
    }
    coursesApi
      .getById(id)
      .then((data) => setCourse(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isPremium]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#f0a500]" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="max-w-7xl">
        <div className="rounded-xl border border-[#f0a500]/20 bg-[#12121a] overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#f0a500] via-[#f0a500]/40 to-transparent" />
          <div className="px-6 py-8 text-center">
            <Crown className="h-8 w-8 text-[#f0a500] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#e8e8e8] mb-2">Premium Feature</h3>
            <Link
              href="/dashboard/premium"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f0a500] to-[#d4920a] px-5 py-2.5 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition-all"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl text-center py-16">
        <BookOpen className="h-10 w-10 text-[#2a2a3e] mx-auto mb-3" />
        <p className="text-sm text-[#6b6b8a]">Course not found</p>
        <Link href="/dashboard/training" className="text-sm text-[#f0a500] hover:text-[#ffd700] mt-2 inline-block">
          Back to Training
        </Link>
      </div>
    );
  }

  const mapInfo = MAPS.find((m) => m.name === course.mapName);
  const mapColor = MAP_COLORS[course.mapName] || '#f0a500';
  const diffColor = DIFFICULTY_COLORS[course.difficulty];

  // Find recommended next (first incomplete)
  const recommendedIdx = course.collections.findIndex((c) => !c.isCompleted);

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl">
      {/* Breadcrumb */}
      <motion.div variants={fadeUp} custom={0} className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#6b6b8a]">
          <Link href="/dashboard/training" className="hover:text-[#e8e8e8] transition-colors">
            Training
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#e8e8e8]">{course.name}</span>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} custom={1} className="mb-8">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${mapColor}15` }}
          >
            <BookOpen className="h-6 w-6" style={{ color: mapColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#e8e8e8]">{course.name}</h1>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ backgroundColor: `${diffColor}15`, color: diffColor }}
              >
                {course.difficulty}
              </span>
              {mapInfo && (
                <span className="text-xs text-[#6b6b8a] bg-[#1a1a2e] px-2 py-0.5 rounded-full">
                  {mapInfo.displayName}
                </span>
              )}
            </div>
            {course.description && (
              <p className="text-sm text-[#6b6b8a] mt-1">{course.description}</p>
            )}
            {/* Progress summary */}
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm text-[#6b6b8a]">
                {course.completedCount}/{course.collectionCount} completed
              </span>
              <div className="flex-1 max-w-xs h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${course.progressPercent}%`,
                    background: `linear-gradient(to right, ${mapColor}, ${mapColor}80)`,
                  }}
                />
              </div>
              <span className="text-sm font-medium" style={{ color: mapColor }}>
                {course.progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Start Next button */}
      {recommendedIdx >= 0 && (
        <motion.div variants={fadeUp} custom={2} className="mb-8">
          <Link
            href={`/dashboard/training/${course.collections[recommendedIdx].collectionId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f0a500] to-[#d4920a] px-5 py-2.5 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
            Start Next: {course.collections[recommendedIdx].collectionName}
          </Link>
        </motion.div>
      )}

      {/* Collection timeline */}
      <motion.div variants={fadeUp} custom={3}>
        <div className="space-y-2">
          {course.collections.map((col, idx) => {
            const isRecommended = idx === recommendedIdx;
            const isCompleted = col.isCompleted;

            return (
              <Link
                key={col.collectionId}
                href={`/dashboard/training/${col.collectionId}`}
                className={`group flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                  isRecommended
                    ? 'border-[#f0a500]/30 bg-[#f0a500]/5 hover:border-[#f0a500]/50'
                    : isCompleted
                      ? 'border-[#2a2a3e]/50 bg-[#12121a] hover:border-[#2a2a3e]'
                      : 'border-[#2a2a3e]/30 bg-[#0a0a12] hover:border-[#2a2a3e]/60'
                }`}
              >
                {/* Step indicator */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
                  ) : isRecommended ? (
                    <ArrowRight className="h-6 w-6 text-[#f0a500]" />
                  ) : (
                    <Circle className="h-6 w-6 text-[#2a2a3e]" />
                  )}
                  <span className="text-[10px] text-[#6b6b8a] font-medium">{idx + 1}</span>
                </div>

                {/* Collection info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium truncate transition-colors ${
                        isCompleted
                          ? 'text-[#e8e8e8]'
                          : isRecommended
                            ? 'text-[#f0a500] group-hover:text-[#ffd700]'
                            : 'text-[#6b6b8a] group-hover:text-[#e8e8e8]'
                      }`}
                    >
                      {col.collectionName}
                    </p>
                    {col.difficulty && (
                      <span
                        className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: `${COLL_DIFF_COLORS[col.difficulty]}15`,
                          color: COLL_DIFF_COLORS[col.difficulty],
                        }}
                      >
                        {col.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6b6b8a] mt-0.5">
                    {col.lineupCount} lineup{col.lineupCount !== 1 ? 's' : ''}
                    {isRecommended && !isCompleted && (
                      <span className="text-[#f0a500] ml-2">Recommended next</span>
                    )}
                  </p>
                </div>

                {/* Score/stats */}
                <div className="flex items-center gap-3 shrink-0">
                  {col.bestScore !== null ? (
                    <>
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                        style={{
                          backgroundColor: `${col.bestScore >= 80 ? '#22c55e' : col.bestScore >= 50 ? '#f0a500' : '#ef4444'}15`,
                          color: col.bestScore >= 80 ? '#22c55e' : col.bestScore >= 50 ? '#f0a500' : '#ef4444',
                        }}
                      >
                        <Trophy className="h-3 w-3" />
                        {col.bestScore}%
                      </span>
                      {col.bestDurationMs != null && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#3b82f6]">
                          <Clock className="h-3 w-3" />
                          {formatDuration(col.bestDurationMs)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-[#6b6b8a]">Not attempted</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-[#2a2a3e] group-hover:text-[#6b6b8a] transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
