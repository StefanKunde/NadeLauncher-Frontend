'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ListChecks,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { lineupsApi } from '@/lib/api';
import { MAPS, MAP_COLORS } from '@/lib/constants';
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

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-[#12121a] border border-[#2a2a3e] ${className}`}>
      <div className="p-5">
        <div className="h-4 w-20 rounded bg-[#1a1a2e] mb-3" />
        <div className="h-8 w-16 rounded bg-[#1a1a2e]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [assignedCount, setAssignedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lineups = await lineupsApi.getMy();
        setAssignedCount(lineups.length);
      } catch {
        setAssignedCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: 'My Lineups',
      sublabel: 'Assigned Lineups',
      value: assignedCount !== null ? String(assignedCount) : '--',
      icon: ListChecks,
      iconColor: '#f0a500',
    },
    {
      label: 'Account',
      sublabel: user?.isPremium ? 'Full access unlocked' : 'Upgrade for more',
      value: user?.isPremium ? 'Premium' : 'Free',
      icon: Crown,
      iconColor: user?.isPremium ? '#f0a500' : '#6b6b8a',
    },
  ];

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

      {/* Stats Row */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  custom={i + 1}
                  className="glass rounded-xl p-5 card-hover"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${stat.iconColor}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: stat.iconColor }} />
                    </div>
                    <span className="text-sm font-medium text-[#6b6b8a]">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#e8e8e8]">{stat.value}</p>
                  <p className="mt-1 text-xs text-[#6b6b8a]">{stat.sublabel}</p>
                </motion.div>
              );
            })}
      </div>

      {/* Practice Server */}
      <motion.div variants={fadeUp} custom={4} className="mb-10 max-w-lg">
        <h2 className="mb-1 text-xl font-semibold text-[#e8e8e8]">Practice Server</h2>
        <p className="mb-5 text-sm text-[#6b6b8a]">Start a private CS2 practice session</p>
        <PracticeSessionCard />
      </motion.div>

      {/* Maps Quick Start */}
      <motion.div variants={fadeUp} custom={5}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-[#e8e8e8]">Maps</h2>
            <p className="text-sm text-[#6b6b8a]">Jump into a map to manage your lineups</p>
          </div>
          <Link
            href="/dashboard/maps"
            className="text-sm font-medium text-[#f0a500] hover:text-[#ffd700] transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {MAPS.slice(0, 4).map((map, i) => {
            const color = MAP_COLORS[map.name] ?? '#f0a500';
            return (
              <motion.div key={map.name} variants={fadeUp} custom={i + 6}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
                  className="group block rounded-xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50 transition-all duration-300 hover:border-[#2a2a3e] hover:shadow-lg hover:shadow-black/20"
                >
                  <div className="relative h-24 overflow-hidden">
                    <Image
                      src={map.screenshot}
                      alt={map.displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 pb-2">
                      <h3 className="text-sm font-bold text-white">{map.displayName}</h3>
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        {/* Second row - remaining maps */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          {MAPS.slice(4, 7).map((map, i) => {
            const color = MAP_COLORS[map.name] ?? '#f0a500';
            return (
              <motion.div key={map.name} variants={fadeUp} custom={i + 10}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
                  className="group block rounded-xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50 transition-all duration-300 hover:border-[#2a2a3e] hover:shadow-lg hover:shadow-black/20"
                >
                  <div className="relative h-20 overflow-hidden">
                    <Image
                      src={map.screenshot}
                      alt={map.displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 pb-2">
                      <h3 className="text-sm font-bold text-white">{map.displayName}</h3>
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
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
