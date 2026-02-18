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
  Sparkles,
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
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="text-xl font-semibold text-[#e8e8e8]">Practice Server</h2>
        </div>
        <p className="mb-5 text-sm text-[#6b6b8a] -mt-2">Start a private CS2 practice session with ghost-guided lineups</p>
        <PracticeSessionCard />
      </motion.div>

      {/* Getting Started (new users only) */}
      {!hasCollections && (
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
      <motion.div variants={fadeUp} custom={hasCollections ? 2 : 3}>
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
              <motion.div key={map.name} variants={fadeUp} custom={i + (hasCollections ? 3 : 4)}>
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

      {/* Quick Tip — positioned at bottom, subtle and non-intrusive */}
      {!tipDismissed && (
        <motion.div variants={fadeUp} custom={hasCollections ? 10 : 11} className="mt-10">
          <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/30 px-4 py-3 flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/8">
              <Lightbulb className="h-3.5 w-3.5 text-[#f0a500]/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6b6b8a] leading-relaxed">
                <span className="text-[#f0a500]/60 font-medium">Tip:</span>{' '}
                {TIPS[tipIndex]}
              </p>
            </div>
            <button
              onClick={dismissTip}
              className="shrink-0 p-1 rounded text-[#6b6b8a]/40 hover:text-[#6b6b8a] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
