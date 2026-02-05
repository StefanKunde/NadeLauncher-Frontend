'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ListChecks, Search, X, Trash2, Map, CheckSquare, Square, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lineupsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { GRENADE_TYPES, MAPS, THROW_TYPES, DIFFICULTIES, MAP_COLORS } from '@/lib/constants';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

/* ───── Delete Confirmation Modal ───── */
function DeleteModal({
  lineups,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  lineups: Lineup[];
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  const count = lineups.length;
  const single = count === 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-md glass rounded-2xl border border-[#2a2a3e] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-[#ff4444] to-[#ff4444]/40" />
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-[#ff4444]/10 border border-[#ff4444]/20">
              <Trash2 className="w-6 h-6 text-[#ff4444]" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[#e8e8e8] text-center mb-2">
            Delete {single ? 'Lineup' : `${count} Lineups`}?
          </h3>
          <p className="text-sm text-[#6b6b8a] text-center mb-4">
            {single
              ? 'This lineup will be permanently deleted and removed from the server.'
              : `These ${count} lineups will be permanently deleted and removed from the server.`}
          </p>
          <div className="max-h-48 overflow-y-auto mb-6 space-y-1.5">
            {lineups.map((l) => {
              const mc = MAP_COLORS[l.mapName] || '#f0a500';
              const mi = MAPS.find((m) => m.name === l.mapName);
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0a0a0f]/60 border border-[#2a2a3e]/50"
                >
                  <GrenadeIcon type={l.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={16} />
                  <span className="text-sm text-[#e8e8e8] truncate flex-1">{l.name}</span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${mc}15`, color: mc }}
                  >
                    {mi?.displayName ?? l.mapName}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1a1a2e] text-[#e8e8e8] border border-[#2a2a3e] hover:border-[#3a3a5e] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/30 hover:bg-[#ff4444]/20 hover:border-[#ff4444]/50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : single ? 'Delete' : `Delete ${count}`}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ───── Main Page ───── */
export default function MyLineupsPage() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMap, setFilterMap] = useState<string>('all');
  const [filterGrenade, setFilterGrenade] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectMode = selectedIds.size > 0;

  // Delete modal
  const [deleteTargets, setDeleteTargets] = useState<Lineup[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const user = useAuthStore((s) => s.user);

  const load = () => {
    setLoading(true);
    lineupsApi
      .getMy()
      .then((l) => {
        setLineups(l);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = lineups;
    if (filterMap !== 'all') {
      result = result.filter((l) => l.mapName === filterMap);
    }
    if (filterGrenade !== 'all') {
      result = result.filter((l) => l.grenadeType === filterGrenade);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter((l) => l.name.toLowerCase().includes(q));
    }
    return result;
  }, [lineups, filterMap, filterGrenade, searchText]);

  // Stats
  const grenadeCounts = useMemo(() => {
    const counts: Record<string, number> = { smoke: 0, flash: 0, molotov: 0, he: 0 };
    lineups.forEach((l) => {
      if (counts[l.grenadeType] !== undefined) counts[l.grenadeType]++;
    });
    return counts;
  }, [lineups]);

  // Selected lineup & radar map
  const selectedLineup = useMemo(
    () => lineups.find((l) => l.id === selectedId) ?? null,
    [lineups, selectedId],
  );
  const radarMapName = selectedLineup?.mapName ?? (filterMap !== 'all' ? filterMap : null);
  const radarLineups = useMemo(() => {
    if (!radarMapName) return [];
    return lineups.filter((l) => l.mapName === radarMapName);
  }, [lineups, radarMapName]);

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const requestDelete = useCallback((targets: Lineup[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteTargets(targets);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTargets || deleteTargets.length === 0) return;
    setIsDeleting(true);

    const results = await Promise.allSettled(
      deleteTargets.map(async (lineup) => {
        const isOwner = user && lineup.creatorId === user.id;
        if (isOwner) {
          await lineupsApi.delete(lineup.id);
        } else {
          await lineupsApi.unassign(lineup.id);
        }
        return lineup.id;
      }),
    );

    const deletedIds = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failCount = results.filter((r) => r.status === 'rejected').length;

    setLineups((prev) => prev.filter((l) => !deletedIds.includes(l.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      deletedIds.forEach((id) => next.delete(id));
      return next;
    });
    if (selectedId && deletedIds.includes(selectedId)) setSelectedId(null);

    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} lineup${failCount > 1 ? 's' : ''}`);
    } else {
      const count = deletedIds.length;
      toast.success(count === 1 ? `Deleted: ${deleteTargets[0].name}` : `Deleted ${count} lineups`);
    }

    setIsDeleting(false);
    setDeleteTargets(null);
  }, [deleteTargets, user, selectedId]);

  const handleLineupClick = useCallback((lineup: Lineup) => {
    setSelectedId((prev) => (prev === lineup.id ? null : lineup.id));
  }, []);

  const handleRadarClick = useCallback((lineup: Lineup) => {
    setSelectedId((prev) => (prev === lineup.id ? null : lineup.id));
  }, []);

  return (
    <div>
      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTargets && (
          <DeleteModal
            lineups={deleteTargets}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTargets(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-[#f0a500]/10 border border-[#f0a500]/20">
            <ListChecks className="w-6 h-6 text-[#f0a500]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold">My Lineups</h1>
          </div>
        </div>
        <p className="text-[#6b6b8a] text-lg ml-[52px]">
          Your assigned lineup collection
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#e8e8e8]">{lineups.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mt-1">Total</span>
        </div>
        {Object.entries(GRENADE_TYPES).map(([key, { label, color }]) => (
          <div key={key} className="glass rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-1">
              <GrenadeIcon type={key as 'smoke' | 'flash' | 'molotov' | 'he'} size={18} />
              <span className="text-2xl font-bold" style={{ color }}>
                {grenadeCounts[key]}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a]">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Map filter dropdown */}
        <div className="relative">
          <select
            value={filterMap}
            onChange={(e) => setFilterMap(e.target.value)}
            className="appearance-none bg-[#12121a] border border-[#2a2a3e] rounded-xl text-sm text-[#e8e8e8] cursor-pointer hover:border-[#3a3a5e] transition-colors focus:outline-none focus:border-[#f0a500]/40"
            style={{ paddingLeft: 16, paddingRight: 40, paddingTop: 8, paddingBottom: 8 }}
          >
            <option value="all">All Maps</option>
            {MAPS.map((m) => (
              <option key={m.name} value={m.name}>{m.displayName}</option>
            ))}
          </select>
          <svg className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a] pointer-events-none" style={{ right: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>

        {/* Grenade type filters */}
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
              onClick={() => setFilterGrenade(key)}
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

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b8a] pointer-events-none" style={{ left: 12 }} />
          <input
            type="text"
            placeholder="Search lineups..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-[#12121a] border border-[#2a2a3e] rounded-xl text-sm text-[#e8e8e8] placeholder-[#6b6b8a]/50 w-56 focus:outline-none focus:border-[#f0a500]/40 transition-colors"
            style={{ paddingLeft: 36, paddingRight: 40, paddingTop: 8, paddingBottom: 8 }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-select action bar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 mb-4 px-4 py-3 glass rounded-xl border border-[#f0a500]/20"
          >
            <span className="text-sm text-[#e8e8e8] font-medium">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => {
                const targets = lineups.filter((l) => selectedIds.has(l.id));
                requestDelete(targets);
              }}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/30 hover:bg-[#ff4444]/20 hover:border-[#ff4444]/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e] hover:text-[#e8e8e8] hover:border-[#3a3a5e] transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-3 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#1a1a2e] animate-pulse" />
              <div className="h-4 w-48 bg-[#1a1a2e] rounded animate-pulse" />
              <div className="h-4 w-16 bg-[#1a1a2e] rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && lineups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="flex justify-center mb-6">
            <GrenadeIcon type="smoke" size={64} glow />
          </div>
          <p className="text-[#e8e8e8] text-xl font-semibold mb-2">No lineups assigned yet</p>
          <p className="text-[#6b6b8a] mb-8 max-w-sm mx-auto">
            Browse maps to find and assign grenade lineups to your collection
          </p>
          <Link
            href="/dashboard/maps"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f0a500] text-[#0a0a0f] font-semibold text-sm hover:bg-[#f0a500]/90 transition-colors"
          >
            <Map className="w-4 h-4" />
            Browse Maps
          </Link>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="flex justify-center gap-3 mb-6 opacity-40">
            <GrenadeIcon type="smoke" size={28} />
            <GrenadeIcon type="flash" size={28} />
            <GrenadeIcon type="molotov" size={28} />
            <GrenadeIcon type="he" size={28} />
          </div>
          <p className="text-[#6b6b8a] text-lg">No lineups match your filters</p>
          <p className="text-[#6b6b8a]/60 text-sm mt-1">
            Try adjusting the map, grenade type, or search filters
          </p>
        </motion.div>
      ) : (
        <div className="flex gap-6">
          {/* Left: Compact lineup list */}
          <div className="flex-1 min-w-0">
            <motion.div
              className="space-y-1"
              variants={container}
              initial="hidden"
              animate="show"
              key={`${filterMap}-${filterGrenade}-${searchText}`}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((lineup) => {
                  const diffInfo = DIFFICULTIES[lineup.difficulty as keyof typeof DIFFICULTIES];
                  const mapInfo = MAPS.find((m) => m.name === lineup.mapName);
                  const mapColor = MAP_COLORS[lineup.mapName] || '#f0a500';
                  const isActive = selectedId === lineup.id;
                  const isSelected = selectedIds.has(lineup.id);

                  return (
                    <motion.div
                      key={lineup.id}
                      variants={item}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#f0a500]/10 border border-[#f0a500]/30'
                          : isSelected
                            ? 'bg-[#f0a500]/5 border border-[#f0a500]/20'
                            : 'bg-[#12121a]/60 border border-transparent hover:bg-[#1a1a2e] hover:border-[#2a2a3e]'
                      }`}
                      onClick={() =>
                        selectMode
                          ? setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(lineup.id)) next.delete(lineup.id);
                              else next.add(lineup.id);
                              return next;
                            })
                          : handleLineupClick(lineup)
                      }
                    >
                      {/* Checkbox */}
                      <button
                        onClick={(e) => toggleSelect(lineup.id, e)}
                        className="flex-shrink-0 text-[#6b6b8a] hover:text-[#f0a500] transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#f0a500]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      {/* Grenade icon */}
                      <GrenadeIcon
                        type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'}
                        size={18}
                      />

                      {/* Name */}
                      <span className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-[#e8e8e8]' : 'text-[#b8b8cc]'}`}>
                        {lineup.name}
                      </span>

                      {/* Map badge */}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${mapColor}15`, color: mapColor }}
                      >
                        {mapInfo?.displayName ?? lineup.mapName}
                      </span>

                      {/* Difficulty dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: diffInfo?.color }}
                        title={diffInfo?.label}
                      />

                      {/* Delete */}
                      <button
                        onClick={(e) => requestDelete([lineup], e)}
                        className="flex-shrink-0 p-1 rounded text-[#6b6b8a]/0 group-hover:text-[#6b6b8a] hover:!text-[#ff4444] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right: Radar + Details panel */}
          <div className="w-[400px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-4 space-y-4">
              {radarMapName ? (
                <>
                  <MapRadar
                    mapName={radarMapName}
                    lineups={radarLineups}
                    selectedLineupId={selectedId}
                    onLineupClick={handleRadarClick}
                  />

                  {/* Selected lineup details */}
                  <AnimatePresence mode="wait">
                    {selectedLineup && (
                      <motion.div
                        key={selectedLineup.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="glass rounded-xl p-4 space-y-3"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2.5">
                          <GrenadeIcon
                            type={selectedLineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'}
                            size={24}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#e8e8e8] truncate">
                              {selectedLineup.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
                                {THROW_TYPES[selectedLineup.throwType as keyof typeof THROW_TYPES] ?? selectedLineup.throwType}
                              </span>
                              {selectedLineup.throwStrength && selectedLineup.throwStrength !== 'full' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
                                  {selectedLineup.throwStrength}
                                </span>
                              )}
                              <span
                                className="flex items-center gap-1 text-xs font-medium"
                                style={{ color: DIFFICULTIES[selectedLineup.difficulty as keyof typeof DIFFICULTIES]?.color }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: DIFFICULTIES[selectedLineup.difficulty as keyof typeof DIFFICULTIES]?.color }}
                                />
                                {DIFFICULTIES[selectedLineup.difficulty as keyof typeof DIFFICULTIES]?.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {selectedLineup.description && (
                          <p className="text-sm text-[#6b6b8a]">{selectedLineup.description}</p>
                        )}

                        {/* Instructions */}
                        {selectedLineup.instructions.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-[#f0a500] uppercase tracking-wider mb-2">
                              Instructions
                            </h4>
                            <ol className="space-y-1.5">
                              {selectedLineup.instructions.map((step, i) => (
                                <li key={i} className="flex gap-2 text-sm">
                                  <span
                                    className="flex-shrink-0 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                    style={{
                                      backgroundColor: `${GRENADE_TYPES[selectedLineup.grenadeType as keyof typeof GRENADE_TYPES]?.color}20`,
                                      color: GRENADE_TYPES[selectedLineup.grenadeType as keyof typeof GRENADE_TYPES]?.color,
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

                        {/* Tags */}
                        {selectedLineup.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedLineup.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0a500]/10 text-[#f0a500]/70"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Position data */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#0a0a0f] rounded-lg p-2.5">
                            <p className="text-[9px] text-[#6b6b8a] uppercase tracking-wider mb-0.5">Throw</p>
                            <p className="text-[11px] font-mono text-[#e8e8e8]/70">
                              {selectedLineup.throwPosition.x.toFixed(0)}, {selectedLineup.throwPosition.y.toFixed(0)}, {selectedLineup.throwPosition.z.toFixed(0)}
                            </p>
                          </div>
                          <div className="bg-[#0a0a0f] rounded-lg p-2.5">
                            <p className="text-[9px] text-[#6b6b8a] uppercase tracking-wider mb-0.5">Landing</p>
                            <p className="text-[11px] font-mono text-[#e8e8e8]/70">
                              {selectedLineup.landingPosition.x.toFixed(0)}, {selectedLineup.landingPosition.y.toFixed(0)}, {selectedLineup.landingPosition.z.toFixed(0)}
                            </p>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-[#6b6b8a]/60 pt-2 border-t border-[#2a2a3e]/50">
                          <span>
                            {selectedLineup.isPreset ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#f0a500]/10 text-[#f0a500]">Preset</span>
                            ) : (
                              <>By {selectedLineup.creatorName || 'Unknown'}</>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(selectedLineup.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="aspect-square bg-[#0a0a0f] rounded-xl flex flex-col items-center justify-center text-[#6b6b8a]/40 gap-3">
                  <Map className="w-12 h-12" />
                  <p className="text-sm text-center px-8">
                    Select a lineup to view it on the radar map
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
