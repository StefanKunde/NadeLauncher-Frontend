'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import { lineupsApi } from '@/lib/api';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function MapsPage() {
  const [presetsByMap, setPresetsByMap] = useState<Record<string, Lineup[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      MAPS.map(async (map) => {
        const presets = await lineupsApi.getPresets(map.name).catch(() => []);
        return { name: map.name, presets };
      }),
    ).then((results) => {
      const byMap: Record<string, Lineup[]> = {};
      results.forEach((r) => (byMap[r.name] = r.presets));
      setPresetsByMap(byMap);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-[#f0a500]/10 border border-[#f0a500]/20">
            <Map className="w-6 h-6 text-[#f0a500]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold">Maps</h1>
          </div>
        </div>
        <p className="text-[#6b6b8a] text-lg ml-[52px]">
          Explore the Active Duty map pool
        </p>
      </div>

      {/* Map Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <div className="h-36 bg-[#1a1a2e] animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 bg-[#1a1a2e] rounded animate-pulse" />
                <div className="h-3 w-16 bg-[#1a1a2e] rounded animate-pulse" />
                <div className="h-8 w-full bg-[#1a1a2e] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {MAPS.map((map) => {
            const color = MAP_COLORS[map.name] || '#f0a500';
            const presets = presetsByMap[map.name] ?? [];
            const count = presets.length;

            return (
              <motion.div key={map.name} variants={item}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
                  className="block glass rounded-2xl overflow-hidden card-hover group"
                >
                  {/* Mini Radar */}
                  <div className="relative h-48 overflow-hidden bg-[#0a0a0f]">
                    <div className="absolute inset-0 p-2">
                      <MapRadar mapName={map.name} lineups={presets} mini />
                    </div>
                    {/* Map name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a12] to-transparent p-4 pt-10">
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {map.displayName}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Grenade icons row */}
                    <div className="flex items-center gap-2.5 mb-4">
                      <GrenadeIcon type="smoke" size={14} />
                      <GrenadeIcon type="flash" size={14} />
                      <GrenadeIcon type="molotov" size={14} />
                      <GrenadeIcon type="he" size={14} />
                      <span className="text-[#6b6b8a] text-xs ml-1">
                        {count} {count === 1 ? 'lineup' : 'lineups'}
                      </span>
                    </div>

                    {/* Preset count bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#2a2a3e]/60">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                        }}
                      >
                        {count} presets available
                      </span>
                      <span
                        className="text-sm font-semibold flex items-center gap-1 transition-all group-hover:gap-2"
                        style={{ color }}
                      >
                        Explore
                        <ChevronRight className="w-4 h-4" />
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
