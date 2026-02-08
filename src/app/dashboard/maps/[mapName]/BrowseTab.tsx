'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Loader2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GRENADE_TYPES, DIFFICULTIES } from '@/lib/constants';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';
import LineupDetailPanel from './LineupDetailPanel';
import type { GrenadeFilter, SortMode } from './types';
import { staggerContainer, staggerItem, DIFF_ORDER } from './types';

const ITEMS_PER_PAGE = 20;

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterGrenade, sort, search]);

  const filtered = useMemo(() => {
    let result = presets;
    if (filterGrenade !== 'all') {
      result = result.filter((l) => l.grenadeType === filterGrenade);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((l) => l.name.toLowerCase().includes(q));
    }
    if (sort === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'difficulty') {
      result = [...result].sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1));
    } else if (sort === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [presets, filterGrenade, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const visibleLineups = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage],
  );

  // Auto-navigate to the page containing the selected lineup
  useEffect(() => {
    if (!selectedId) return;
    const idx = filtered.findIndex((l) => l.id === selectedId);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;
    if (targetPage !== currentPage) setCurrentPage(targetPage);
  }, [selectedId, filtered]);

  const selectedLineup = useMemo(
    () => presets.find((l) => l.id === selectedId) ?? null,
    [presets, selectedId],
  );

  const handleRadarClick = useCallback((lineup: Lineup) => {
    setSelectedId((prev) => (prev === lineup.id ? null : lineup.id));
  }, []);

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
          Explore all available lineups for this map. Assign the ones you want to add them to your
          practice server — they&apos;ll show up in the <span className="text-[#e8e8e8]/70">My Lineups</span> tab
          and in-game.
        </p>
      </div>

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

        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <div className="relative">
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

          {/* Sort */}
          <div className="flex items-center gap-2">
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
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6 opacity-40">
            <GrenadeIcon type="smoke" size={28} />
            <GrenadeIcon type="flash" size={28} />
            <GrenadeIcon type="molotov" size={28} />
            <GrenadeIcon type="he" size={28} />
          </div>
          <p className="text-[#6b6b8a] text-lg">
            {search.trim() ? 'No lineups match your search' : 'No presets found for this map'}
          </p>
          <p className="text-[#6b6b8a]/60 text-sm mt-1">
            {search.trim()
              ? 'Try a different search term or change the filters'
              : filterGrenade !== 'all'
                ? 'Try changing the grenade type filter'
                : 'Check back later for new lineups'}
          </p>
        </motion.div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <motion.div
              className="space-y-1"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              key={`${filterGrenade}-${sort}-${search}`}
            >
              <AnimatePresence mode="popLayout">
                {visibleLineups.map((lineup) => {
                  const diffInfo = DIFFICULTIES[lineup.difficulty as keyof typeof DIFFICULTIES];
                  const isActive = selectedId === lineup.id;
                  const isAssigned = assignedIds.has(lineup.id);
                  const isAssigning = assigningIds.has(lineup.id);

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

                      {/* Collection name badge */}
                      {lineup.collectionName && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex-shrink-0 truncate max-w-[120px]">
                          {lineup.collectionName}
                        </span>
                      )}

                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: diffInfo?.color }}
                        title={diffInfo?.label}
                      />

                      {/* Assign/Unassign button */}
                      <button
                        onClick={(e) => onToggleAssign(lineup, e)}
                        disabled={isAssigning}
                        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                          isAssigning
                            ? 'opacity-50 cursor-not-allowed'
                            : isAssigned
                              ? 'text-[#f0a500] hover:bg-[#f0a500]/10'
                              : 'text-[#6b6b8a]/0 group-hover:text-[#6b6b8a] hover:!text-[#f0a500] hover:!bg-[#f0a500]/10'
                        }`}
                      >
                        {isAssigning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isAssigned ? (
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {filtered.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    totalPages <= 7 ||
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                          page === currentPage
                            ? 'bg-[#f0a500]/15 text-[#f0a500] border border-[#f0a500]/30'
                            : 'text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e]'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === 2 || page === totalPages - 1) {
                    return (
                      <span key={page} className="px-1 text-xs text-[#6b6b8a]/50">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {filtered.length > 0 && (
              <p className="text-center text-[10px] text-[#6b6b8a]/60 mt-2">
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
            )}
          </div>

          {/* Right: Radar + Details panel */}
          <div className="w-[500px] flex-shrink-0 hidden lg:block">
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
