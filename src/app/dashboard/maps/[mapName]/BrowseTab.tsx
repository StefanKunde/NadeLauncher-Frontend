'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { Bookmark, BookmarkCheck, ChevronDown, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GRENADE_TYPES, THROW_TYPES, DIFFICULTIES } from '@/lib/constants';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';
import LineupDetailPanel from './LineupDetailPanel';
import type { GrenadeFilter, SortMode } from './types';
import { staggerContainer, fadeIn, DIFF_ORDER } from './types';

interface BrowseTabProps {
  mapName: string;
  loading: boolean;
  presets: Lineup[];
  filterGrenade: GrenadeFilter;
  setFilterGrenade: (v: GrenadeFilter) => void;
  sort: SortMode;
  setSort: (v: SortMode) => void;
  assignedIds: Set<string>;
  assigningIds: Set<string>;
  onToggleAssign: (lineup: Lineup, e: React.MouseEvent) => void;
}

export default function BrowseTab({
  mapName,
  loading,
  presets,
  filterGrenade,
  setFilterGrenade,
  sort,
  setSort,
  assignedIds,
  assigningIds,
  onToggleAssign,
}: BrowseTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtered = useMemo(() => {
    let result = presets;
    if (filterGrenade !== 'all') {
      result = result.filter((l) => l.grenadeType === filterGrenade);
    }
    if (sort === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'difficulty') {
      result = [...result].sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1));
    } else if (sort === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [presets, filterGrenade, sort]);

  const selectedLineup = useMemo(
    () => presets.find((l) => l.id === selectedId) ?? null,
    [presets, selectedId],
  );

  const handleRadarClick = useCallback((lineup: Lineup) => {
    setSelectedId((prev) => (prev === lineup.id ? null : lineup.id));
    setExpandedId((prev) => (prev === lineup.id ? null : lineup.id));
    const el = cardRefs.current[lineup.id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  if (loading) {
    return (
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
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterGrenade('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterGrenade === 'all'
                ? 'bg-[#f0a500]/20 text-[#f0a500] border border-[#f0a500]/40'
                : 'bg-[#12121a] border border-[#2a2a3e] text-[#6b6b8a] hover:text-[#e8e8e8] hover:border-[#3a3a5e]'
            }`}
          >
            All
          </button>
          {Object.entries(GRENADE_TYPES).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setFilterGrenade(key as GrenadeFilter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                filterGrenade === key
                  ? 'border'
                  : 'bg-[#12121a] border border-[#2a2a3e] text-[#6b6b8a] hover:text-[#e8e8e8] hover:border-[#3a3a5e]'
              }`}
              style={
                filterGrenade === key
                  ? { backgroundColor: `${color}20`, borderColor: `${color}40`, color }
                  : undefined
              }
            >
              <GrenadeIcon type={key as 'smoke' | 'flash' | 'molotov' | 'he'} size={14} />
              {label}
            </button>
          ))}
        </div>

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

      {/* Content */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6 opacity-40">
            <GrenadeIcon type="smoke" size={32} />
            <GrenadeIcon type="flash" size={32} />
            <GrenadeIcon type="molotov" size={32} />
            <GrenadeIcon type="he" size={32} />
          </div>
          <p className="text-[#6b6b8a] text-lg">No presets found for this map</p>
          <p className="text-[#6b6b8a]/60 text-sm mt-1">
            {filterGrenade !== 'all' ? 'Try changing the grenade type filter' : 'Check back later for new lineups'}
          </p>
        </motion.div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              key={`${filterGrenade}-${sort}`}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((lineup) => {
                  const grenadeInfo = GRENADE_TYPES[lineup.grenadeType as keyof typeof GRENADE_TYPES];
                  const diffInfo = DIFFICULTIES[lineup.difficulty as keyof typeof DIFFICULTIES];
                  const isAssigned = assignedIds.has(lineup.id);
                  const isExpanded = expandedId === lineup.id;
                  const isAssigning = assigningIds.has(lineup.id);

                  return (
                    <motion.div
                      key={lineup.id}
                      ref={(el) => { cardRefs.current[lineup.id] = el; }}
                      variants={fadeIn}
                      className="glass rounded-xl overflow-hidden cursor-pointer group transition-colors hover:border-[#3a3a5e]"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : lineup.id);
                        setSelectedId(isExpanded ? null : lineup.id);
                      }}
                    >
                      <div className="flex">
                        <div className="w-1 flex-shrink-0" style={{ backgroundColor: grenadeInfo?.color }} />

                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={20} />
                                <h3 className="font-semibold text-[#e8e8e8] truncate">{lineup.name}</h3>
                                <span
                                  className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
                                  style={{ color: diffInfo?.color }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: diffInfo?.color }} />
                                  {diffInfo?.label}
                                </span>
                              </div>

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

                              {lineup.description && !isExpanded && (
                                <p className="text-sm text-[#6b6b8a] line-clamp-2">{lineup.description}</p>
                              )}
                            </div>

                            <button
                              onClick={(e) => onToggleAssign(lineup, e)}
                              disabled={isAssigning}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                                isAssigned
                                  ? 'bg-[#00c850]/10 text-[#00c850] border border-[#00c850]/30 hover:bg-[#ff4444]/10 hover:text-[#ff4444] hover:border-[#ff4444]/30'
                                  : 'bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e] hover:text-[#f0a500] hover:border-[#f0a500]/30 hover:bg-[#f0a500]/10'
                              } ${isAssigning ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isAssigning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isAssigned ? (
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

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a3e]/50">
                            <span className="text-xs text-[#6b6b8a]">
                              {lineup.isPreset ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#f0a500]/10 text-[#f0a500]">Preset</span>
                              ) : (
                                <>By {lineup.creatorName || 'Unknown'}</>
                              )}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-[#6b6b8a] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>

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
                                  {lineup.description && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-[#f0a500] uppercase tracking-wider mb-1.5">Description</h4>
                                      <p className="text-sm text-[#6b6b8a]">{lineup.description}</p>
                                    </div>
                                  )}

                                  {lineup.instructions.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-[#f0a500] uppercase tracking-wider mb-2">Instructions</h4>
                                      <ol className="space-y-2">
                                        {lineup.instructions.map((step, i) => (
                                          <li key={i} className="flex gap-2.5 text-sm">
                                            <span
                                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                              style={{ backgroundColor: `${grenadeInfo?.color}20`, color: grenadeInfo?.color }}
                                            >
                                              {i + 1}
                                            </span>
                                            <span className="text-[#e8e8e8]/80">{step}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#0a0a0f] rounded-lg p-3">
                                      <p className="text-[10px] text-[#6b6b8a] uppercase tracking-wider mb-1">Throw Position</p>
                                      <p className="text-xs font-mono text-[#e8e8e8]/70">
                                        {lineup.throwPosition.x.toFixed(0)}, {lineup.throwPosition.y.toFixed(0)},{' '}
                                        {lineup.throwPosition.z.toFixed(0)}
                                      </p>
                                    </div>
                                    <div className="bg-[#0a0a0f] rounded-lg p-3">
                                      <p className="text-[10px] text-[#6b6b8a] uppercase tracking-wider mb-1">Landing Position</p>
                                      <p className="text-xs font-mono text-[#e8e8e8]/70">
                                        {lineup.landingPosition.x.toFixed(0)}, {lineup.landingPosition.y.toFixed(0)},{' '}
                                        {lineup.landingPosition.z.toFixed(0)}
                                      </p>
                                    </div>
                                  </div>

                                  {lineup.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {lineup.tags.map((tag) => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0a500]/10 text-[#f0a500]/70">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1.5 text-xs text-[#6b6b8a]/60">
                                    <Clock className="w-3 h-3" />
                                    Created{' '}
                                    {new Date(lineup.createdAt).toLocaleDateString('en-US', {
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
          </div>

          {/* Right: Radar + Details panel */}
          <div className="w-[400px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <MapRadar
                mapName={mapName}
                lineups={filtered}
                selectedLineupId={selectedId}
                onLineupClick={handleRadarClick}
              />
              <AnimatePresence mode="wait">
                {selectedLineup && <LineupDetailPanel lineup={selectedLineup} />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
