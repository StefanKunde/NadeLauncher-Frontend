'use client';

import { useState, useEffect } from 'react';
import { Search, X, Trash2, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GRENADE_TYPES, DIFFICULTIES } from '@/lib/constants';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';
import LineupDetailPanel from './LineupDetailPanel';
import type { MergedLineup, GrenadeFilter } from './types';
import { staggerContainer, staggerItem } from './types';

const ITEMS_PER_PAGE = 20;

interface MyLineupsTabProps {
  mapName: string;
  loading: boolean;
  lineups: MergedLineup[];
  allLineups: MergedLineup[];
  filterGrenade: GrenadeFilter;
  setFilterGrenade: (v: GrenadeFilter) => void;
  search: string;
  setSearch: (v: string) => void;
  selectedId: string | null;
  setSelectedId: (v: string | null) => void;
  selectedLineup: MergedLineup | null;
  deletingIds: Set<string>;
  hidingIds: Set<string>;
  unassigningIds: Set<string>;
  onDelete: (lineup: MergedLineup) => void;
  onHide: (lineup: MergedLineup) => void;
  onUnassign: (lineup: MergedLineup) => void;
  onRadarClick: (lineup: Lineup) => void;
}

export default function MyLineupsTab({
  mapName,
  loading,
  lineups,
  allLineups,
  filterGrenade,
  setFilterGrenade,
  search,
  setSearch,
  selectedId,
  setSelectedId,
  selectedLineup,
  deletingIds,
  hidingIds,
  unassigningIds,
  onDelete,
  onHide,
  onUnassign,
  onRadarClick,
}: MyLineupsTabProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filterGrenade, search]);

  const visibleLineups = lineups.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-lg p-3 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#1a1a2e] animate-pulse" />
            <div className="h-4 w-48 bg-[#1a1a2e] rounded animate-pulse" />
            <div className="h-4 w-16 bg-[#1a1a2e] rounded animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Intro */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-[#12121a]/80 border border-[#2a2a3e]/50">
        <p className="text-sm text-[#6b6b8a] leading-relaxed">
          Your active lineup arsenal — everything here will be available in your practice server.
          Includes your own lineups, individually assigned presets, and lineups from
          {' '}<span className="text-[#e8e8e8]/70">subscribed collections</span>.
        </p>
      </div>

      {/* Filter bar */}
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

        <div className="relative ml-auto">
          <Search
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b8a] pointer-events-none"
            style={{ left: 12 }}
          />
          <input
            type="text"
            placeholder="Search lineups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#12121a] border border-[#2a2a3e] rounded-xl text-sm text-[#e8e8e8] placeholder-[#6b6b8a]/50 w-56 focus:outline-none focus:border-[#f0a500]/40 transition-colors"
            style={{ paddingLeft: 36, paddingRight: 40, paddingTop: 8, paddingBottom: 8 }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {lineups.length === 0 && allLineups.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6 opacity-40">
            <GrenadeIcon type="smoke" size={28} />
            <GrenadeIcon type="flash" size={28} />
            <GrenadeIcon type="molotov" size={28} />
            <GrenadeIcon type="he" size={28} />
          </div>
          <p className="text-[#e8e8e8] text-xl font-semibold mb-2">No lineups yet</p>
          <p className="text-[#6b6b8a] max-w-sm mx-auto">
            Browse presets to assign lineups or subscribe to collections for this map.
          </p>
        </motion.div>
      ) : lineups.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6 opacity-40">
            <GrenadeIcon type="smoke" size={28} />
            <GrenadeIcon type="flash" size={28} />
            <GrenadeIcon type="molotov" size={28} />
            <GrenadeIcon type="he" size={28} />
          </div>
          <p className="text-[#6b6b8a] text-lg">No lineups match your filters</p>
        </motion.div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <motion.div
              className="space-y-1"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              key={`${filterGrenade}-${search}`}
            >
              <AnimatePresence mode="popLayout">
                {visibleLineups.map((lineup) => {
                  const diffInfo = DIFFICULTIES[lineup.difficulty as keyof typeof DIFFICULTIES];
                  const isActive = selectedId === lineup.id;
                  const isDeleting = deletingIds.has(lineup.id);
                  const isHiding = hidingIds.has(lineup.id);
                  const isUnassigning = unassigningIds.has(lineup.id);

                  return (
                    <motion.div
                      key={lineup.id}
                      variants={staggerItem}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#f0a500]/10 border border-[#f0a500]/30'
                          : 'bg-[#12121a]/60 border border-transparent hover:bg-[#1a1a2e] hover:border-[#2a2a3e]'
                      }`}
                      onClick={() => setSelectedId(isActive ? null : lineup.id)}
                    >
                      <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={18} />

                      <span className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-[#e8e8e8]' : 'text-[#b8b8cc]'}`}>
                        {lineup.name}
                      </span>

                      {/* Source badge */}
                      {lineup.source === 'created' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] flex-shrink-0">
                          Created
                        </span>
                      )}
                      {lineup.source === 'collection' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex-shrink-0 truncate max-w-[120px]">
                          {lineup.sourceCollectionName || 'Collection'}
                        </span>
                      )}
                      {lineup.source === 'added' && (
                        lineup.sourceCollectionName ? (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex-shrink-0 truncate max-w-[120px]">
                            {lineup.sourceCollectionName}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#6b6b8a]/10 text-[#6b6b8a] flex-shrink-0">
                            Added
                          </span>
                        )
                      )}

                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: diffInfo?.color }}
                        title={diffInfo?.label}
                      />

                      {/* Action buttons */}
                      {lineup.source === 'created' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(lineup); }}
                          disabled={isDeleting}
                          className="flex-shrink-0 p-1.5 rounded text-[#6b6b8a]/0 group-hover:text-[#6b6b8a] hover:!text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors disabled:opacity-50"
                          title="Delete lineup"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {lineup.source === 'collection' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onHide(lineup); }}
                          disabled={isHiding}
                          className="flex-shrink-0 p-1.5 rounded text-[#6b6b8a]/0 group-hover:text-[#6b6b8a] hover:!text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors disabled:opacity-50"
                          title="Hide from collection"
                        >
                          {isHiding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {lineup.source === 'added' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUnassign(lineup); }}
                          disabled={isUnassigning}
                          className="flex-shrink-0 p-1.5 rounded text-[#6b6b8a]/0 group-hover:text-[#6b6b8a] hover:!text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors disabled:opacity-50"
                          title="Unassign lineup"
                        >
                          {isUnassigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination footer */}
            {lineups.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-4 py-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#2a2a3e]/50" />
                  <span className="text-xs text-[#6b6b8a]">
                    Showing {Math.min(visibleCount, lineups.length)} of {lineups.length} lineups
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#2a2a3e]/50" />
                </div>
                {visibleCount < lineups.length && (
                  <button
                    onClick={() => setVisibleCount((v) => v + ITEMS_PER_PAGE)}
                    className="w-full py-3 rounded-xl text-sm font-medium bg-[#12121a] border border-[#2a2a3e] text-[#6b6b8a] hover:text-[#f0a500] hover:border-[#f0a500]/30 transition-all"
                  >
                    Show {Math.min(ITEMS_PER_PAGE, lineups.length - visibleCount)} more
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Radar + Details panel */}
          <div className="w-[500px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <MapRadar
                mapName={mapName}
                lineups={lineups}
                selectedLineupId={selectedId}
                onLineupClick={onRadarClick}
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
