'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ListChecks,
  Map,
  Crown,
  ArrowRight,
  Construction,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { lineupsApi } from '@/lib/api';
import { MAPS, GRENADE_TYPES, MAP_COLORS } from '@/lib/constants';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import PracticeSessionCard from '@/components/practice/PracticeSessionCard';

const GRENADE_DESCRIPTIONS: Record<string, string> = {
  smoke: 'Control sightlines',
  flash: 'Blind enemies',
  molotov: 'Deny positions',
  he: 'Deal damage',
};

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
      label: 'Maps Explored',
      sublabel: 'Active Duty Pool',
      value: '7 Maps',
      icon: Map,
      iconColor: '#4a9fd4',
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
      {/* Early Access Banner */}
      <motion.div variants={fadeUp} custom={0} className="mb-6">
        <div className="rounded-lg bg-[#f0a50010] border border-[#f0a50030] px-4 py-3 flex items-start gap-3">
          <Construction className="h-5 w-5 text-[#f0a500] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-[#f0a500] font-medium">Early Access</p>
            <p className="text-[#6b6b8a] mt-0.5">
              NadeLauncher is still in development and may have bugs. If you encounter any issues, please let me know on{' '}
              <a href="https://discord.gg/nadelauncher" target="_blank" rel="noopener noreferrer" className="text-[#4a9fd4] hover:underline">Discord</a>
              {' '}&mdash; your feedback helps a lot!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <h1 className="text-3xl font-bold text-[#e8e8e8]">Dashboard</h1>
        <p className="mt-1 text-[#6b6b8a]">
          Welcome back,{' '}
          <span className="text-[#f0a500] font-medium">{user?.username ?? 'Commander'}</span>
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
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
      <motion.div variants={fadeUp} custom={4} className="mb-10">
        <h2 className="mb-1 text-xl font-semibold text-[#e8e8e8]">Practice Server</h2>
        <p className="mb-5 text-sm text-[#6b6b8a]">Start a private CS2 practice session</p>
        <PracticeSessionCard />
      </motion.div>

      {/* Quick Start */}
      <motion.div variants={fadeUp} custom={5} className="mb-10">
        <h2 className="mb-1 text-xl font-semibold text-[#e8e8e8]">Quick Start</h2>
        <p className="mb-5 text-sm text-[#6b6b8a]">Jump into a map</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MAPS.map((map, i) => {
            const color = MAP_COLORS[map.name] ?? '#f0a500';
            return (
              <motion.div key={map.name} variants={fadeUp} custom={i + 6}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-xl bg-[#12121a] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    borderLeft: `3px solid ${color}`,
                    border: `1px solid #2a2a3e`,
                    borderLeftWidth: '3px',
                    borderLeftColor: color,
                  }}
                >
                  <div className="flex-1">
                    <p className="text-base font-semibold text-[#e8e8e8] group-hover:text-white transition-colors">
                      {map.displayName}
                    </p>
                    <p className="mt-0.5 text-xs font-mono text-[#6b6b8a]">{map.name}</p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-[#6b6b8a] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                    style={{ color }}
                  />
                  {/* Hover glow */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(ellipse at left center, ${color}08 0%, transparent 70%)`,
                    }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Grenade Arsenal */}
      <motion.div variants={fadeUp} custom={14} className="mb-10">
        <h2 className="mb-1 text-xl font-semibold text-[#e8e8e8]">Grenade Arsenal</h2>
        <p className="mb-5 text-sm text-[#6b6b8a]">Master every utility type</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(GRENADE_TYPES) as [string, { label: string; color: string }][]).map(
            ([key, { label, color }], i) => (
              <motion.div
                key={key}
                variants={fadeUp}
                custom={i + 15}
                className="glass rounded-xl overflow-hidden card-hover"
                style={{ borderTop: `2px solid ${color}` }}
              >
                <div className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <GrenadeIcon
                      type={key as 'smoke' | 'flash' | 'molotov' | 'he'}
                      size={36}
                      glow
                    />
                    <h3 className="text-lg font-semibold" style={{ color }}>
                      {label}
                    </h3>
                  </div>
                  <p className="text-sm text-[#6b6b8a]">
                    {GRENADE_DESCRIPTIONS[key]}
                  </p>
                </div>
              </motion.div>
            ),
          )}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} custom={19}>
        <h2 className="mb-1 text-xl font-semibold text-[#e8e8e8]">Recent Activity</h2>
        <p className="mb-5 text-sm text-[#6b6b8a]">Your practice history</p>
        <div className="glass rounded-xl p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a2e]">
            <Map className="h-6 w-6 text-[#6b6b8a]" />
          </div>
          <p className="mb-1 text-[#6b6b8a]">Start practicing to see your activity here</p>
          <Link
            href="/dashboard/maps"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#f0a500] hover:underline"
          >
            Browse Maps
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
