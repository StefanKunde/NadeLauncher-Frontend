'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import { proNadesApi } from '@/lib/api';
import type { ProCollection } from '@/lib/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function ProNadesPage() {
  const [collections, setCollections] = useState<ProCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proNadesApi.getCollections(undefined, undefined, undefined)
      .then((cols) => {
        // Only show auto-managed (pro) collections
        setCollections(cols.filter((c) => c.autoManaged));
      })
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  const mapStats = useMemo(() => {
    const stats: Record<string, { collectionCount: number; lineupCount: number }> = {};
    for (const map of MAPS) {
      const mapCols = collections.filter((c) => c.mapName === map.name);
      stats[map.name] = {
        collectionCount: mapCols.length,
        lineupCount: mapCols.reduce((sum, c) => sum + c.lineupCount, 0),
      };
    }
    return stats;
  }, [collections]);

  const totalCollections = collections.length;
  const totalLineups = collections.reduce((sum, c) => sum + c.lineupCount, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-[#f0a500]" />
          <div>
            <h1 className="text-3xl font-bold text-[#e8e8e8]">Pro Nades</h1>
            <p className="text-[#6b6b8a] mt-1">
              Grenade lineups extracted from professional CS2 matches
            </p>
          </div>
        </div>
        {!loading && totalCollections > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-[#6b6b8a]">
              <span className="font-semibold text-[#e8e8e8]">{totalCollections}</span> Collections
            </span>
            <span className="text-sm text-[#6b6b8a]">
              <span className="font-semibold text-[#e8e8e8]">{totalLineups}</span> Lineups
            </span>
          </div>
        )}
      </div>

      {/* Map Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50">
              <div className="h-44 bg-[#1a1a2e] animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-28 bg-[#1a1a2e] rounded animate-pulse" />
                <div className="h-3 w-48 bg-[#1a1a2e] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : totalCollections === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#2a2a3e]/50 bg-[#12121a] px-8 py-16 text-center">
          <Trophy className="h-12 w-12 text-[#2a2a3e] mb-4" />
          <h2 className="text-lg font-semibold text-[#e8e8e8]">No Pro Nades Yet</h2>
          <p className="mt-2 text-sm text-[#6b6b8a] max-w-md">
            Pro nade collections will appear here once professional demo analysis has been run.
            Check back soon for curated lineups from top-tier CS2 matches.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {MAPS.map((map) => {
            const color = MAP_COLORS[map.name] || '#f0a500';
            const stats = mapStats[map.name];
            if (!stats || stats.collectionCount === 0) return null;

            return (
              <motion.div key={map.name} variants={item}>
                <Link
                  href={`/dashboard/pro-nades/${map.name}`}
                  className="group block rounded-2xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50 transition-all duration-300 hover:border-[#2a2a3e] hover:shadow-lg hover:shadow-black/20"
                >
                  {/* Map Screenshot */}
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={map.screenshot}
                      alt={map.displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white tracking-tight">
                            {map.displayName}
                          </h2>
                          <p className="text-sm text-[#a0a0b0] mt-0.5">{map.name}</p>
                        </div>
                        <div
                          className="flex items-center gap-1.5 text-sm font-semibold opacity-0 translate-x-[-4px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                          style={{ color }}
                        >
                          Browse
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                  </div>

                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#e8e8e8]">
                        {stats.lineupCount} {stats.lineupCount === 1 ? 'Lineup' : 'Lineups'}
                      </span>
                      <span className="text-xs text-[#6b6b8a]">
                        {stats.collectionCount} {stats.collectionCount === 1 ? 'Collection' : 'Collections'}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
