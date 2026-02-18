'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Lightbulb,
  Map,
  FolderPlus,
  Monitor,
  Sparkles,
  Users,
  Folder,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import { userCollectionsApi } from '@/lib/api';
import PracticeSessionCard from '@/components/practice/PracticeSessionCard';

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

const TIPS = [
  'Create a collection for each map to organize your favorite lineups.',
  'Browse Pro Collections to learn lineups used in professional CS2 matches.',
  'Start a Practice Server to test lineups directly in CS2 with ghost guidance.',
  'Publish your best collection to share it with the community.',
  'Subscribe to community collections to add other players\u2019 curated lineups.',
  'Click any nade dot on the radar map to see its detailed throw instructions.',
];

const GETTING_STARTED = [
  { icon: Map, text: 'Pick a map below to browse available lineups', desc: 'Explore pro lineups and community collections' },
  { icon: FolderPlus, text: 'Create a collection and add your favorite nades', desc: 'Organize lineups by strategy or preference' },
  { icon: Monitor, text: 'Start a Practice Server to practice them in CS2', desc: 'Ghost guidance walks you through each throw' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [collectionCount, setCollectionCount] = useState<number | null>(null);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  // Auto-rotate tips every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    userCollectionsApi.getMy().then((cols) => {
      setCollectionCount(cols.length);
    }).catch(() => {});
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="max-w-7xl"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <h1 className="text-3xl font-bold text-[#e8e8e8]">Dashboard</h1>
        <p className="mt-1 text-[#6b6b8a]">
          Welcome back,{' '}
          <span className="text-[#f0a500] font-medium">{user?.username ?? 'Commander'}</span>
        </p>
      </motion.div>

      {/* Practice Server + Side Tiles */}
      <motion.div variants={fadeUp} custom={1} className="mb-10">
        <h2 className="text-xl font-semibold text-[#e8e8e8] mb-1">Practice Server</h2>
        <p className="mb-5 text-sm text-[#6b6b8a]">Start a private CS2 practice session with ghost-guided lineups</p>
        <div className="flex flex-col lg:flex-row gap-3 items-start">
          <div className="flex-1 min-w-0">
            <PracticeSessionCard />
          </div>
          <div className="lg:w-56 shrink-0 w-full flex flex-row lg:flex-col gap-3">
            {/* My Collections tile */}
            <Link
              href="/dashboard/maps"
              className="flex-1 rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-4 hover:border-[#f0a500]/30 transition-colors group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0a500]/10 mb-2.5">
                <Folder className="h-3.5 w-3.5 text-[#f0a500]" />
              </div>
              <p className="text-xs font-semibold text-[#e8e8e8] mb-0.5">My Collections</p>
              <p className="text-[11px] text-[#6b6b8a]">
                {collectionCount !== null ? `${collectionCount} collection${collectionCount !== 1 ? 's' : ''}` : 'Manage lineups'}
              </p>
            </Link>

            {/* Community tile */}
            <Link
              href="/dashboard/community"
              className="flex-1 rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-4 hover:border-[#6c5ce7]/30 transition-colors group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6c5ce7]/10 mb-2.5">
                <Users className="h-3.5 w-3.5 text-[#6c5ce7]" />
              </div>
              <p className="text-xs font-semibold text-[#e8e8e8] mb-0.5">Community</p>
              <p className="text-[11px] text-[#6b6b8a]">Browse & subscribe</p>
            </Link>

            {/* Quick Tip tile — auto-rotating */}
            <div className="flex-1 rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 p-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0a500]/10 mb-2.5">
                <Lightbulb className="h-3.5 w-3.5 text-[#f0a500]" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f0a500]/60 mb-1">Tip</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-[11px] text-[#6b6b8a] leading-relaxed"
                >
                  {TIPS[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Getting Started (new users only) */}
      {collectionCount === 0 && (
        <motion.div variants={fadeUp} custom={2} className="mb-10">
          <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-[#f0a500] via-[#f0a500]/40 to-transparent" />
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="h-4 w-4 text-[#f0a500]" />
                <h3 className="text-sm font-semibold text-[#e8e8e8]">Getting Started</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {GETTING_STARTED.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 flex-1 rounded-xl bg-[#0a0a12] border border-[#2a2a3e]/30 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/12 text-[#f0a500] text-xs font-bold border border-[#f0a500]/10">
                      {i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <step.icon className="h-3.5 w-3.5 shrink-0 text-[#6b6b8a]" />
                        <p className="text-sm font-medium text-[#e8e8e8] leading-snug">{step.text}</p>
                      </div>
                      <p className="mt-1 text-[11px] text-[#6b6b8a] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Maps Quick Start */}
      <motion.div variants={fadeUp} custom={collectionCount !== null && collectionCount > 0 ? 2 : 3}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-[#e8e8e8]">Maps</h2>
            <p className="text-sm text-[#6b6b8a]">Jump into a map to browse and manage your lineups</p>
          </div>
          <Link
            href="/dashboard/maps"
            className="text-sm font-medium text-[#f0a500] hover:text-[#ffd700] transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {MAPS.map((map, i) => {
            const color = MAP_COLORS[map.name] ?? '#f0a500';
            return (
              <motion.div key={map.name} variants={fadeUp} custom={i + (collectionCount !== null && collectionCount > 0 ? 3 : 4)}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
                  className="group block rounded-xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50 transition-all duration-300 hover:border-[#2a2a3e] hover:-translate-y-1"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--map-glow': color,
                  }}
                >
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={map.screenshot}
                      alt={map.displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Stronger gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/30 to-transparent" />

                    {/* Hover glow overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `linear-gradient(135deg, ${color}10 0%, transparent 60%)`,
                      }}
                    />

                    {/* Map name */}
                    <div className="absolute bottom-0 left-0 right-0 p-3.5 pb-3">
                      <h3 className="text-base font-bold text-white drop-shadow-lg">{map.displayName}</h3>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">{map.name}</p>
                    </div>

                    {/* Bottom color accent */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300 opacity-50 group-hover:opacity-100 group-hover:h-[3px]"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}
