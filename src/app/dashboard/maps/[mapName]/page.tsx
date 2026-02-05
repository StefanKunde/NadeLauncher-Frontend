'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkCheck, ChevronDown, ChevronRight, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { lineupsApi } from '@/lib/api';
import { MAPS, GRENADE_TYPES, THROW_TYPES, DIFFICULTIES, MAP_COLORS } from '@/lib/constants';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';
import toast from 'react-hot-toast';

type SortMode = 'name' | 'difficulty' | 'newest';

const DIFF_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function MapDetailPage() {
  const params = useParams();
  const mapName = params.mapName as string;
  const [presets, setPresets] = useState<Lineup[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('name');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningIds, setAssigningIds] = useState<Set<string>>(new Set());

  const mapInfo = MAPS.find((m) => m.name === mapName);
  const mapColor = MAP_COLORS[mapName] || '#f0a500';
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleRadarClick = useCallback((lineup: Lineup) => {
    setExpandedId((prev) => (prev === lineup.id ? null : lineup.id));
    const el = cardRefs.current[lineup.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      lineupsApi.getPresets(mapName).catch(() => []),
      lineupsApi.getMy(mapName).catch(() => []),
    ]).then(([p, my]) => {
      setPresets(p);
      setAssigned(new Set(my.map((l) => l.id)));
      setLoading(false);
    });
  }, [mapName]);

  const filtered = useMemo(() => {
    let result = filter === 'all' ? presets : presets.filter((l) => l.grenadeType === filter);
    if (sort === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'difficulty') {
      result = [...result].sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1));
    } else if (sort === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [presets, filter, sort]);

  // Grenade type counts for the current filtered view
  const grenadeCounts = useMemo(() => {
    const counts: Record<string, number> = { smoke: 0, flash: 0, molotov: 0, he: 0 };
    presets.forEach((l) => {
      if (counts[l.grenadeType] !== undefined) counts[l.grenadeType]++;
    });
    return counts;
  }, [presets]);

  const toggleAssign = async (lineup: Lineup, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssigningIds((prev) => new Set(prev).add(lineup.id));
    try {
      if (assigned.has(lineup.id)) {
        await lineupsApi.unassign(lineup.id);
        setAssigned((prev) => {
          const next = new Set(prev);
          next.delete(lineup.id);
          return next;
        });
        toast.success(`Removed: ${lineup.name}`);
      } else {
        await lineupsApi.assign(lineup.id);
        setAssigned((prev) => new Set(prev).add(lineup.id));
        toast.success(`Assigned: ${lineup.name}`);
      }
    } catch {
      toast.error('Failed to update assignment');
    } finally {
      setAssigningIds((prev) => {
        const next = new Set(prev);
        next.delete(lineup.id);
        return next;
      });
    }
  };

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/dashboard/maps"
        className="inline-flex items-center gap-2 text-[#6b6b8a] hover:text-[#e8e8e8] mb-6 transition-colors group text-sm"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Maps
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${mapColor}20`, border: `1px solid ${mapColor}30` }}
          >
            <Target className="w-6 h-6" style={{ color: mapColor }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#e8e8e8]">
              {mapInfo?.displayName ?? mapName}
            </h1>
            <p className="text-[#6b6b8a] font-mono text-sm">{mapName}</p>
          </div>
        </div>

        {/* Grenade type summary badges */}
        <div className="flex items-center gap-3 mt-5 ml-16">
          {Object.entries(GRENADE_TYPES).map(([key, { label, color }]) => (
            <div
              key={key}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${color}15`, color }}
            >
              <GrenadeIcon type={key as 'smoke' | 'flash' | 'molotov' | 'he'} size={12} />
              <span>{grenadeCounts[key] ?? 0}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Grenade type filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-[#f0a500]/20 text-[#f0a500] border border-[#f0a500]/40'
                : 'bg-[#12121a] border border-[#2a2a3e] text-[#6b6b8a] hover:text-[#e8e8e8] hover:border-[#3a3a5e]'
            }`}
          >
            All
          </button>
          {Object.entries(GRENADE_TYPES).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === key
                  ? 'border'
                  : 'bg-[#12121a] border border-[#2a2a3e] text-[#6b6b8a] hover:text-[#e8e8e8] hover:border-[#3a3a5e]'
              }`}
              style={
                filter === key
                  ? { backgroundColor: `${color}20`, borderColor: `${color}40`, color }
                  : undefined
              }
            >
              <GrenadeIcon type={key as 'smoke' | 'flash' | 'molotov' | 'he'} size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#6b6b8a]">Sort:</span>
          {(['name', 'difficulty', 'newest'] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort === s
                  ? 'bg-[#1a1a2e] text-[#e8e8e8] border border-[#3a3a5e]'
                  : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Radar Map */}
      {!loading && filtered.length > 0 && (
        <div className="mb-8 max-w-lg">
          <MapRadar
            mapName={mapName}
            lineups={filtered}
            selectedLineupId={expandedId}
            onLineupClick={handleRadarClick}
          />
        </div>
      )}

      {/* Lineup Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 rounded-full bg-[#1a1a2e] animate-pulse" />
                <div className="h-5 w-48 bg-[#1a1a2e] rounded animate-pulse" />
              </div>
              <div className="h-3 w-32 bg-[#1a1a2e] rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-[#1a1a2e] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="flex justify-center gap-3 mb-6 opacity-40">
            <GrenadeIcon type="smoke" size={32} />
            <GrenadeIcon type="flash" size={32} />
            <GrenadeIcon type="molotov" size={32} />
            <GrenadeIcon type="he" size={32} />
          </div>
          <p className="text-[#6b6b8a] text-lg">No lineups found for this map</p>
          <p className="text-[#6b6b8a]/60 text-sm mt-1">
            {filter !== 'all' ? 'Try changing the grenade type filter' : 'Check back later for new lineups'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((lineup) => {
              const grenadeInfo = GRENADE_TYPES[lineup.grenadeType as keyof typeof GRENADE_TYPES];
              const diffInfo = DIFFICULTIES[lineup.difficulty as keyof typeof DIFFICULTIES];
              const isAssigned = assigned.has(lineup.id);
              const isExpanded = expandedId === lineup.id;
              const isAssigning = assigningIds.has(lineup.id);

              return (
                <motion.div
                  key={lineup.id}
                  ref={(el) => { cardRefs.current[lineup.id] = el; }}
                  variants={item}
                  className="glass rounded-xl overflow-hidden cursor-pointer group transition-colors hover:border-[#3a3a5e]"
                  onClick={() => setExpandedId(isExpanded ? null : lineup.id)}
                >
                  <div className="flex">
                    {/* Left color stripe */}
                    <div
                      className="w-1 flex-shrink-0"
                      style={{ backgroundColor: grenadeInfo?.color }}
                    />

                    <div className="flex-1 p-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <GrenadeIcon
                              type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'}
                              size={20}
                            />
                            <h3 className="font-semibold text-[#e8e8e8] truncate">
                              {lineup.name}
                            </h3>
                            {/* Difficulty badge */}
                            <span
                              className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
                              style={{ color: diffInfo?.color }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: diffInfo?.color }}
                              />
                              {diffInfo?.label}
                            </span>
                          </div>

                          {/* Throw type pill */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
                              {THROW_TYPES[lineup.throwType as keyof typeof THROW_TYPES] ?? lineup.throwType}
                            </span>
                            {lineup.throwStrength && lineup.throwStrength !== 'full' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
                                {lineup.throwStrength}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {lineup.description && (
                            <p className={`text-sm text-[#6b6b8a] ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {lineup.description}
                            </p>
                          )}

                          {/* Tags */}
                          {lineup.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {lineup.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0a500]/10 text-[#f0a500]/70"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assign toggle */}
                        <button
                          onClick={(e) => toggleAssign(lineup, e)}
                          disabled={isAssigning}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                            isAssigned
                              ? 'bg-[#00c850]/10 text-[#00c850] border border-[#00c850]/30 hover:bg-[#ff4444]/10 hover:text-[#ff4444] hover:border-[#ff4444]/30'
                              : 'bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e] hover:text-[#f0a500] hover:border-[#f0a500]/30 hover:bg-[#f0a500]/10'
                          } ${isAssigning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isAssigned ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Assigned</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Assign</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a3e]/50">
                        <span className="text-xs text-[#6b6b8a]">
                          {lineup.isPreset ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#f0a500]/10 text-[#f0a500]">
                              Preset
                            </span>
                          ) : (
                            <>By {lineup.creatorName || 'Unknown'}</>
                          )}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#6b6b8a] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-[#2a2a3e]/50 space-y-4">
                              {/* Full description */}
                              {lineup.description && (
                                <div>
                                  <h4 className="text-xs font-semibold text-[#f0a500] uppercase tracking-wider mb-1.5">
                                    Description
                                  </h4>
                                  <p className="text-sm text-[#6b6b8a]">{lineup.description}</p>
                                </div>
                              )}

                              {/* Instructions */}
                              {lineup.instructions.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-[#f0a500] uppercase tracking-wider mb-2">
                                    Instructions
                                  </h4>
                                  <ol className="space-y-2">
                                    {lineup.instructions.map((step, i) => (
                                      <li key={i} className="flex gap-2.5 text-sm">
                                        <span
                                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                          style={{
                                            backgroundColor: `${grenadeInfo?.color}20`,
                                            color: grenadeInfo?.color,
                                          }}
                                        >
                                          {i + 1}
                                        </span>
                                        <span className="text-[#e8e8e8]/80">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {/* Position data */}
                              <div className="grid grid-cols-2 gap-3">
                                {lineup.throwPosition && (
                                  <div className="bg-[#0a0a0f] rounded-lg p-3">
                                    <p className="text-[10px] text-[#6b6b8a] uppercase tracking-wider mb-1">
                                      Throw Position
                                    </p>
                                    <p className="text-xs font-mono text-[#e8e8e8]/70">
                                      {lineup.throwPosition.x.toFixed(0)}, {lineup.throwPosition.y.toFixed(0)}, {lineup.throwPosition.z.toFixed(0)}
                                    </p>
                                  </div>
                                )}
                                {lineup.landingPosition && (
                                  <div className="bg-[#0a0a0f] rounded-lg p-3">
                                    <p className="text-[10px] text-[#6b6b8a] uppercase tracking-wider mb-1">
                                      Landing Position
                                    </p>
                                    <p className="text-xs font-mono text-[#e8e8e8]/70">
                                      {lineup.landingPosition.x.toFixed(0)}, {lineup.landingPosition.y.toFixed(0)}, {lineup.landingPosition.z.toFixed(0)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Created date */}
                              <div className="flex items-center gap-1.5 text-xs text-[#6b6b8a]/60">
                                <Clock className="w-3 h-3" />
                                Created {new Date(lineup.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
