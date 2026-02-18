'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Lightbulb,
  X,
  Map,
  FolderPlus,
  Monitor,
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
  { icon: Map, text: 'Pick a map below to browse available lineups' },
  { icon: FolderPlus, text: 'Create a collection and add your favorite nades' },
  { icon: Monitor, text: 'Start a Practice Server to practice them in CS2' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [tipDismissed, setTipDismissed] = useState(true);
  const [hasCollections, setHasCollections] = useState(true);

  const tipIndex = useMemo(() => Math.floor(Math.random() * TIPS.length), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTipDismissed(localStorage.getItem('nadepro-tip-dismissed') === '1');
    }
  }, []);

  useEffect(() => {
    userCollectionsApi.getMy().then((cols) => {
      setHasCollections(cols.length > 0);
    }).catch(() => {});
  }, []);

  const dismissTip = () => {
    setTipDismissed(true);
    localStorage.setItem('nadepro-tip-dismissed', '1');
  };

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

      {/* Practice Server */}
      <motion.div variants={fadeUp} custom={1} className="mb-10">
        <h2 className="mb-1 text-xl font-semibold text-[#e8e8e8]">Practice Server</h2>
        <p className="mb-5 text-sm text-[#6b6b8a]">Start a private CS2 practice session</p>
        <PracticeSessionCard />
      </motion.div>

      {/* Quick Tip */}
      {!tipDismissed && (
        <motion.div variants={fadeUp} custom={2} className="mb-8">
          <div className="rounded-xl border border-[#f0a500]/15 bg-[#f0a500]/[0.04] px-4 py-3.5 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/10 mt-0.5">
              <Lightbulb className="h-4 w-4 text-[#f0a500]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#f0a500] mb-0.5">Quick Tip</p>
              <p className="text-sm text-[#b8b8cc] leading-relaxed">{TIPS[tipIndex]}</p>
            </div>
            <button
              onClick={dismissTip}
              className="shrink-0 p-1 rounded text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Getting Started (new users only) */}
      {!hasCollections && (
        <motion.div variants={fadeUp} custom={3} className="mb-10">
          <div className="glass rounded-xl px-5 py-5">
            <h3 className="text-sm font-semibold text-[#e8e8e8] mb-4">Getting Started</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              {GETTING_STARTED.map((step, i) => (
                <div key={i} className="flex items-start gap-3 flex-1">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0a500]/15 text-[#f0a500] text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <step.icon className="h-4 w-4 shrink-0 text-[#6b6b8a]" />
                    <p className="text-sm text-[#b8b8cc] leading-snug">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Maps Quick Start */}
      <motion.div variants={fadeUp} custom={hasCollections ? 3 : 4}>
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
              <motion.div key={map.name} variants={fadeUp} custom={i + (hasCollections ? 4 : 5)}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
                  className="group block rounded-xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50 transition-all duration-300 hover:border-[#2a2a3e] hover:-translate-y-0.5"
                  style={{
                    // @ts-expect-error CSS custom property
                    '--map-glow': color,
                  }}
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={map.screenshot}
                      alt={map.displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3.5 pb-3">
                      <h3 className="text-base font-bold text-white drop-shadow-lg">{map.displayName}</h3>
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-300 opacity-60 group-hover:opacity-100"
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
