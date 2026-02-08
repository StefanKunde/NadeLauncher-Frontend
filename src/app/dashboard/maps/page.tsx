'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAPS, MAP_COLORS, GRENADE_TYPES } from '@/lib/constants';
import { lineupsApi, collectionsApi } from '@/lib/api';
import type { Lineup, LineupCollection } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';

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

type GrenadeType = keyof typeof GRENADE_TYPES;

export default function MapsPage() {
  const [myLineups, setMyLineups] = useState<Lineup[]>([]);
  const [collections, setCollections] = useState<LineupCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      lineupsApi.getMy().catch(() => []),
      collectionsApi.getAllWithStatus().catch(() => []),
    ]).then(([lineups, cols]) => {
      setMyLineups(lineups);
      setCollections(cols);
      setLoading(false);
    });
  }, []);

  const mapData = useMemo(() => {
    const data: Record<string, { lineups: Lineup[]; subscribedCollections: number; grenades: Record<string, number> }> = {};
    for (const map of MAPS) {
      const mapLineups = myLineups.filter((l) => l.mapName === map.name);
      const mapSubscribed = collections.filter((c) => c.mapName === map.name && c.isSubscribed).length;
      const grenades: Record<string, number> = {};
      for (const l of mapLineups) {
        grenades[l.grenadeType] = (grenades[l.grenadeType] || 0) + 1;
      }
      data[map.name] = { lineups: mapLineups, subscribedCollections: mapSubscribed, grenades };
    }
    return data;
  }, [myLineups, collections]);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#e8e8e8]">Maps</h1>
        <p className="text-[#6b6b8a] mt-1">
          Choose a map to manage your lineups
        </p>
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
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {MAPS.map((map) => {
            const color = MAP_COLORS[map.name] || '#f0a500';
            const stats = mapData[map.name];
            const lineupCount = stats?.lineups.length ?? 0;
            const subscribedCount = stats?.subscribedCollections ?? 0;
            const grenades = stats?.grenades ?? {};

            return (
              <motion.div key={map.name} variants={item}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
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
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/40 to-transparent" />

                    {/* Map name overlay */}
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
                          Open
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Map color accent line */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      {/* Lineup count + grenade breakdown */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#e8e8e8]">
                          {lineupCount} {lineupCount === 1 ? 'Lineup' : 'Lineups'}
                        </span>
                        {lineupCount > 0 && (
                          <div className="flex items-center gap-2">
                            {(['smoke', 'flash', 'molotov', 'he'] as GrenadeType[]).map((type) => {
                              const count = grenades[type] || 0;
                              if (count === 0) return null;
                              return (
                                <div key={type} className="flex items-center gap-1">
                                  <GrenadeIcon type={type} size={12} />
                                  <span className="text-xs text-[#6b6b8a]">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Subscribed collections badge */}
                      {subscribedCount > 0 && (
                        <span className="text-xs text-[#6b6b8a]">
                          {subscribedCount} {subscribedCount === 1 ? 'Collection' : 'Collections'}
                        </span>
                      )}
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
