'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, Plus, Loader2, FolderOpen, ArrowLeft, Search, X, ChevronLeft, ChevronRight, Trophy, TrendingUp, Users, User, Swords, Flame, Eye, Crosshair, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lineup, LineupCollection, TimeWindow } from '@/lib/types';
import { collectionsApi } from '@/lib/api';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';
import TimeWindowFilter from '@/components/pro-nades/TimeWindowFilter';
import LineupDetailPanel from './LineupDetailPanel';
import { staggerContainer, staggerItem, fadeIn } from './types';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 12;

interface CategoryTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  filter: (c: LineupCollection) => boolean;
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'All', icon: <Trophy className="h-4 w-4" />, filter: () => true },
  { key: 'regular', label: 'Regular', icon: <Layers className="h-4 w-4" />, filter: (c) => !c.autoManaged },
  { key: 'meta', label: 'Meta', icon: <TrendingUp className="h-4 w-4" />, filter: (c) => c.proCategory === 'meta' },
  { key: 'team', label: 'Teams', icon: <Users className="h-4 w-4" />, filter: (c) => c.proCategory === 'team' },
  { key: 'player', label: 'Players', icon: <User className="h-4 w-4" />, filter: (c) => c.proCategory === 'player' },
  { key: 'match', label: 'Matches', icon: <Swords className="h-4 w-4" />, filter: (c) => c.proCategory === 'match' },
  { key: 'top_he', label: 'Top HE', icon: <Flame className="h-4 w-4" />, filter: (c) => c.proCategory === 'top_he' },
  { key: 'top_flash', label: 'Top Flash', icon: <Eye className="h-4 w-4" />, filter: (c) => c.proCategory === 'top_flash' },
  { key: 'pistol', label: 'Pistol', icon: <Crosshair className="h-4 w-4" />, filter: (c) => c.proCategory === 'pistol' },
];

interface CollectionsTabProps {
  mapName: string;
  collections: LineupCollection[];
  loading: boolean;
  subscribingIds: Set<string>;
  onToggleSubscription: (collection: LineupCollection) => void;
}

export default function CollectionsTab({
  mapName,
  collections,
  loading,
  subscribingIds,
  onToggleSubscription,
}: CollectionsTabProps) {
  const [selectedCollection, setSelectedCollection] = useState<LineupCollection | null>(null);
  const [collectionLineups, setCollectionLineups] = useState<Lineup[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Collection list filters
  const [activeTab, setActiveTab] = useState('all');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all_time');
  const [collectionSearch, setCollectionSearch] = useState('');

  const loadCollectionLineups = useCallback(async (collection: LineupCollection) => {
    setSelectedCollection(collection);
    setDetailLoading(true);
    setSelectedLineupId(null);
    setSearch('');
    setCurrentPage(1);
    try {
      const data = await collectionsApi.getById(collection.id);
      setCollectionLineups(data.lineups);
    } catch {
      toast.error('Failed to load collection lineups');
      setSelectedCollection(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCollection(null);
    setCollectionLineups([]);
    setSelectedLineupId(null);
    setSearch('');
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredLineups = useMemo(() => {
    if (!search.trim()) return collectionLineups;
    const q = search.toLowerCase().trim();
    return collectionLineups.filter((l) => l.name.toLowerCase().includes(q));
  }, [collectionLineups, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLineups.length / ITEMS_PER_PAGE));

  const visibleLineups = useMemo(
    () => filteredLineups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredLineups, currentPage],
  );

  // Auto-navigate to the page containing the selected lineup
  useEffect(() => {
    if (!selectedLineupId) return;
    const idx = filteredLineups.findIndex((l) => l.id === selectedLineupId);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;
    if (targetPage !== currentPage) setCurrentPage(targetPage);
  }, [selectedLineupId, filteredLineups]);

  const selectedLineup = useMemo(
    () => collectionLineups.find((l) => l.id === selectedLineupId) ?? null,
    [collectionLineups, selectedLineupId],
  );

  const handleRadarClick = useCallback((lineup: Lineup) => {
    setSelectedLineupId((prev) => (prev === lineup.id ? null : lineup.id));
  }, []);

  // Reset detail view when the collection list reloads
  useEffect(() => {
    if (selectedCollection && !collections.find((c) => c.id === selectedCollection.id)) {
      handleBack();
    }
  }, [collections, selectedCollection, handleBack]);

  // Filtered collections for the grid
  const filteredCollections = useMemo(() => {
    const tab = CATEGORY_TABS.find((t) => t.key === activeTab);
    let filtered = tab ? collections.filter(tab.filter) : collections;

    // Time window filter (only applies to pro collections)
    if (timeWindow !== 'all_time') {
      filtered = filtered.filter((c) => !c.timeWindow || c.timeWindow === timeWindow);
    }

    // Search filter
    if (collectionSearch.trim()) {
      const q = collectionSearch.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    return filtered;
  }, [collections, activeTab, timeWindow, collectionSearch]);

  // Check if there are any pro collections to show pro-specific tabs
  const hasProCollections = useMemo(
    () => collections.some((c) => c.autoManaged),
    [collections],
  );

  // Show time window filter when a pro-category tab is selected
  const showTimeWindow = activeTab !== 'regular' && hasProCollections;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-5">
            <div className="h-5 w-40 bg-[#1a1a2e] rounded animate-pulse mb-3" />
            <div className="h-3 w-full bg-[#1a1a2e] rounded animate-pulse mb-2" />
            <div className="h-3 w-2/3 bg-[#1a1a2e] rounded animate-pulse mb-4" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[#1a1a2e] rounded animate-pulse" />
              <div className="h-8 w-28 bg-[#1a1a2e] rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── Collection Detail View ── */
  if (selectedCollection) {
    const isSubscribing = subscribingIds.has(selectedCollection.id);
    // Get latest subscription state from collections array
    const latestCollection = collections.find((c) => c.id === selectedCollection.id) ?? selectedCollection;

    return (
      <>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Collections
          </button>
          <div className="h-4 w-px bg-[#2a2a3e]" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[#e8e8e8] truncate">{selectedCollection.name}</h2>
            {selectedCollection.isDefault && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0a500]/15 text-[#f0a500] flex-shrink-0">
                DEFAULT
              </span>
            )}
            {selectedCollection.autoManaged && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 text-[#8b5cf6] flex-shrink-0 tracking-wider">
                PRO
              </span>
            )}
          </div>
          <button
            onClick={() => onToggleSubscription(latestCollection)}
            disabled={isSubscribing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 flex-shrink-0 ${
              latestCollection.isSubscribed
                ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/20'
                : 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/30 hover:bg-[#f0a500]/20'
            }`}
          >
            {isSubscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : latestCollection.isSubscribed ? (
              <>
                <Check className="w-4 h-4" />
                Subscribed
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Subscribe
              </>
            )}
          </button>
        </div>

        {selectedCollection.description && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[#12121a]/80 border border-[#2a2a3e]/50">
            <p className="text-sm text-[#6b6b8a] leading-relaxed">{selectedCollection.description}</p>
          </div>
        )}

        {/* Search */}
        {collectionLineups.length > 5 && (
          <div className="relative mb-4 max-w-xs">
            <Search
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b8a] pointer-events-none"
              style={{ left: 12 }}
            />
            <input
              type="text"
              placeholder="Search lineups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#12121a] border border-[#2a2a3e] rounded-xl text-sm text-[#e8e8e8] placeholder-[#6b6b8a]/50 w-full focus:outline-none focus:border-[#f0a500]/40 transition-colors"
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
        )}

        {/* Lineup List */}
        {detailLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-lg p-3 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1a1a2e] animate-pulse" />
                <div className="h-4 w-48 bg-[#1a1a2e] rounded animate-pulse" />
                <div className="h-4 w-16 bg-[#1a1a2e] rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredLineups.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <FolderOpen className="w-10 h-10 text-[#6b6b8a]/40 mx-auto mb-3" />
            <p className="text-[#6b6b8a] text-lg">
              {search.trim() ? 'No lineups match your search' : 'No lineups in this collection'}
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
                key={search}
              >
                <AnimatePresence mode="popLayout">
                  {visibleLineups.map((lineup) => {
                    const isActive = selectedLineupId === lineup.id;

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
                        onClick={() => setSelectedLineupId(isActive ? null : lineup.id)}
                      >
                        <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={18} />

                        <span className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-[#e8e8e8]' : 'text-[#b8b8cc]'}`}>
                          {lineup.name}
                        </span>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {filteredLineups.length > 0 && totalPages > 1 && (
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
              {filteredLineups.length > 0 && (
                <p className="text-center text-[10px] text-[#6b6b8a]/60 mt-2">
                  {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLineups.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLineups.length)} of {filteredLineups.length}
                </p>
              )}
            </div>

            {/* Right: Radar + Details panel */}
            <div className="w-[500px] flex-shrink-0 hidden lg:block">
              <div className="sticky top-4 space-y-4">
                <MapRadar
                  mapName={mapName}
                  lineups={filteredLineups}
                  selectedLineupId={selectedLineupId}
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

  /* ── Collection List View ── */
  if (collections.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
        <FolderOpen className="w-12 h-12 text-[#6b6b8a]/40 mx-auto mb-4" />
        <p className="text-[#6b6b8a] text-lg">No collections available for this map</p>
        <p className="text-[#6b6b8a]/60 text-sm mt-1">Collections will appear here when they are created.</p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Intro */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-[#12121a]/80 border border-[#2a2a3e]/50">
        <p className="text-sm text-[#6b6b8a] leading-relaxed">
          Lineup packs curated for this map. Subscribe to a collection to instantly add all its
          lineups to your arsenal. Click a collection to preview its lineups.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#f0a500]/15 text-[#f0a500]'
                  : 'text-[#6b6b8a] hover:bg-[#1a1a2e] hover:text-[#e8e8e8]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Time window */}
          {showTimeWindow && (
            <TimeWindowFilter value={timeWindow} onChange={setTimeWindow} />
          )}

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b8a]" />
            <input
              type="text"
              placeholder="Search collections..."
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a3e] bg-[#12121a] py-2 pl-9 pr-3 text-sm text-[#e8e8e8] placeholder:text-[#4a4a6a] focus:border-[#f0a500]/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <FolderOpen className="w-10 h-10 text-[#6b6b8a]/40 mx-auto mb-3" />
          <p className="text-[#6b6b8a] text-lg">
            {collectionSearch ? `No collections matching "${collectionSearch}"` : 'No collections found for this filter'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          key={`${activeTab}-${timeWindow}-${collectionSearch}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredCollections.map((collection) => {
              const isSubscribing = subscribingIds.has(collection.id);

              return (
                <motion.div
                  key={collection.id}
                  variants={fadeIn}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass rounded-xl p-5 group transition-colors hover:border-[#3a3a5e] cursor-pointer"
                  onClick={() => loadCollectionLineups(collection)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#e8e8e8] truncate">{collection.name}</h3>
                        {collection.isDefault && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0a500]/15 text-[#f0a500] flex-shrink-0">
                            DEFAULT
                          </span>
                        )}
                        {collection.autoManaged && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 text-[#8b5cf6] flex-shrink-0 tracking-wider">
                            PRO
                          </span>
                        )}
                      </div>
                      {collection.description && (
                        <p className="text-sm text-[#6b6b8a] line-clamp-2">{collection.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2a3e]/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6b6b8a]">
                        {collection.lineupCount} {collection.lineupCount === 1 ? 'lineup' : 'lineups'}
                      </span>
                      {collection.proCategory && (
                        <span className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] text-[#6b6b8a] capitalize">
                          {collection.proCategory.replace('_', ' ')}
                        </span>
                      )}
                      {collection.timeWindow && collection.timeWindow !== 'all_time' && (
                        <span className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] text-[#6b6b8a]">
                          {collection.timeWindow === 'last_30d' ? '30d' : '90d'}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSubscription(collection); }}
                      disabled={isSubscribing}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                        collection.isSubscribed
                          ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/20'
                          : 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/30 hover:bg-[#f0a500]/20'
                      }`}
                    >
                      {isSubscribing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : collection.isSubscribed ? (
                        <>
                          <Check className="w-4 h-4" />
                          Subscribed
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Subscribe
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
