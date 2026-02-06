'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderOpen,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Plus,
  Search,
  X,
  Loader2,
  Map,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collectionsApi } from '@/lib/api';
import { GRENADE_TYPES, MAPS, MAP_COLORS, DIFFICULTIES, THROW_TYPES } from '@/lib/constants';
import type { LineupCollection, Lineup } from '@/lib/types';
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

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<LineupCollection | null>(null);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [hiddenLineupIds, setHiddenLineupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrenade, setFilterGrenade] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [subscribing, setSubscribing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await collectionsApi.getByIdWithUserState(collectionId);
      setCollection(data.collection);
      setLineups(data.lineups);
      setHiddenLineupIds(data.hiddenLineupIds);
    } catch (error) {
      toast.error('Failed to load collection');
      router.push('/dashboard/collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [collectionId]);

  const filtered = useMemo(() => {
    let result = lineups;

    // Filter by hidden status
    if (showHidden) {
      result = result.filter((l) => hiddenLineupIds.includes(l.id));
    } else {
      result = result.filter((l) => !hiddenLineupIds.includes(l.id));
    }

    if (filterGrenade !== 'all') {
      result = result.filter((l) => l.grenadeType === filterGrenade);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter((l) => l.name.toLowerCase().includes(q));
    }
    return result;
  }, [lineups, filterGrenade, searchText, hiddenLineupIds, showHidden]);

  const selectedLineup = useMemo(
    () => lineups.find((l) => l.id === selectedId) ?? null,
    [lineups, selectedId]
  );

  const handleToggleHide = async (lineup: Lineup) => {
    if (!collection?.isSubscribed) {
      toast.error('Subscribe to this collection to manage lineups');
      return;
    }
    if (togglingIds.has(lineup.id)) return;

    setTogglingIds((prev) => new Set(prev).add(lineup.id));
    const isHidden = hiddenLineupIds.includes(lineup.id);

    try {
      if (isHidden) {
        await collectionsApi.unhideLineup(collectionId, lineup.id);
        setHiddenLineupIds((prev) => prev.filter((id) => id !== lineup.id));
        toast.success(`${lineup.name} is now visible`);
      } else {
        await collectionsApi.hideLineup(collectionId, lineup.id);
        setHiddenLineupIds((prev) => [...prev, lineup.id]);
        toast.success(`${lineup.name} is now hidden`);
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(lineup.id);
        return next;
      });
    }
  };

  const handleSubscribe = async () => {
    if (!collection || subscribing) return;

    setSubscribing(true);
    try {
      if (collection.isSubscribed) {
        await collectionsApi.unsubscribe(collection.id);
        setCollection((prev) => (prev ? { ...prev, isSubscribed: false } : prev));
        toast.success('Unsubscribed');
      } else {
        await collectionsApi.subscribe(collection.id);
        setCollection((prev) => (prev ? { ...prev, isSubscribed: true } : prev));
        toast.success('Subscribed');
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setSubscribing(false);
    }
  };

  const handleLineupClick = useCallback((lineup: Lineup) => {
    setSelectedId((prev) => (prev === lineup.id ? null : lineup.id));
  }, []);

  const handleRadarClick = useCallback((lineup: Lineup) => {
    setSelectedId((prev) => (prev === lineup.id ? null : lineup.id));
  }, []);

  const visibleCount = lineups.filter((l) => !hiddenLineupIds.includes(l.id)).length;
  const hiddenCount = hiddenLineupIds.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#f0a500]" />
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  const mapInfo = MAPS.find((m) => m.name === collection.mapName);
  const mapColor = MAP_COLORS[collection.mapName] || '#f0a500';

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/dashboard/collections"
        className="inline-flex items-center gap-2 text-sm text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-3">
          <div
            className="p-2.5 rounded-xl border"
            style={{ backgroundColor: `${mapColor}10`, borderColor: `${mapColor}20` }}
          >
            <FolderOpen className="w-6 h-6" style={{ color: mapColor }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#e8e8e8]">{collection.name}</h1>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${mapColor}15`, color: mapColor }}
              >
                {mapInfo?.displayName || collection.mapName}
              </span>
              {collection.isDefault && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0a500]/15 text-[#f0a500]">
                  DEFAULT
                </span>
              )}
            </div>
            {collection.description && (
              <p className="text-[#6b6b8a]">{collection.description}</p>
            )}
          </div>
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
              collection.isSubscribed
                ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/20'
                : 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/30 hover:bg-[#f0a500]/20'
            }`}
          >
            {subscribing ? (
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
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#e8e8e8]">{lineups.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mt-1">
            Total Lineups
          </span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#22c55e]">{visibleCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mt-1">
            Visible
          </span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#6b6b8a]">{hiddenCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mt-1">
            Hidden
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Visible/Hidden Toggle */}
        <div className="flex rounded-xl bg-[#12121a] border border-[#2a2a3e] overflow-hidden">
          <button
            onClick={() => setShowHidden(false)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !showHidden
                ? 'bg-[#22c55e]/10 text-[#22c55e]'
                : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1.5" />
            Visible ({visibleCount})
          </button>
          <button
            onClick={() => setShowHidden(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              showHidden
                ? 'bg-[#6b6b8a]/10 text-[#6b6b8a]'
                : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
            }`}
          >
            <EyeOff className="w-4 h-4 inline mr-1.5" />
            Hidden ({hiddenCount})
          </button>
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
          <Search
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b8a] pointer-events-none"
            style={{ left: 12 }}
          />
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

      {/* Subscription Required Notice */}
      {!collection.isSubscribed && (
        <div className="mb-6 p-4 rounded-xl bg-[#f0a500]/5 border border-[#f0a500]/20">
          <p className="text-sm text-[#f0a500]">
            Subscribe to this collection to hide/unhide individual lineups.
          </p>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
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
          <p className="text-[#6b6b8a] text-lg">
            {showHidden ? 'No hidden lineups' : 'No lineups match your filters'}
          </p>
        </motion.div>
      ) : (
        <div className="flex gap-6">
          {/* Left: Lineup list */}
          <div className="flex-1 min-w-0">
            <motion.div
              className="space-y-1"
              variants={container}
              initial="hidden"
              animate="show"
              key={`${filterGrenade}-${searchText}-${showHidden}`}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((lineup) => {
                  const diffInfo = DIFFICULTIES[lineup.difficulty as keyof typeof DIFFICULTIES];
                  const isActive = selectedId === lineup.id;
                  const isHidden = hiddenLineupIds.includes(lineup.id);
                  const isToggling = togglingIds.has(lineup.id);

                  return (
                    <motion.div
                      key={lineup.id}
                      variants={item}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#f0a500]/10 border border-[#f0a500]/30'
                          : isHidden
                            ? 'bg-[#12121a]/40 border border-transparent opacity-60'
                            : 'bg-[#12121a]/60 border border-transparent hover:bg-[#1a1a2e] hover:border-[#2a2a3e]'
                      }`}
                      onClick={() => handleLineupClick(lineup)}
                    >
                      {/* Grenade icon */}
                      <GrenadeIcon
                        type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'}
                        size={18}
                      />

                      {/* Name */}
                      <span
                        className={`text-sm font-medium truncate flex-1 ${
                          isActive ? 'text-[#e8e8e8]' : 'text-[#b8b8cc]'
                        }`}
                      >
                        {lineup.name}
                      </span>

                      {/* Difficulty dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: diffInfo?.color }}
                        title={diffInfo?.label}
                      />

                      {/* Hide/Unhide button */}
                      {collection.isSubscribed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleHide(lineup);
                          }}
                          disabled={isToggling}
                          className={`flex-shrink-0 p-1.5 rounded transition-colors disabled:opacity-50 ${
                            isHidden
                              ? 'text-[#6b6b8a] hover:text-[#22c55e] hover:bg-[#22c55e]/10'
                              : 'text-[#6b6b8a]/0 group-hover:text-[#6b6b8a] hover:!text-[#ff4444] hover:bg-[#ff4444]/10'
                          }`}
                          title={isHidden ? 'Show lineup' : 'Hide lineup'}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isHidden ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
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
                mapName={collection.mapName}
                lineups={filtered}
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
                            {THROW_TYPES[selectedLineup.throwType as keyof typeof THROW_TYPES] ??
                              selectedLineup.throwType}
                          </span>
                          {selectedLineup.throwStrength &&
                            selectedLineup.throwStrength !== 'full' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
                                {selectedLineup.throwStrength}
                              </span>
                            )}
                          <span
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{
                              color:
                                DIFFICULTIES[selectedLineup.difficulty as keyof typeof DIFFICULTIES]
                                  ?.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  DIFFICULTIES[
                                    selectedLineup.difficulty as keyof typeof DIFFICULTIES
                                  ]?.color,
                              }}
                            />
                            {
                              DIFFICULTIES[selectedLineup.difficulty as keyof typeof DIFFICULTIES]
                                ?.label
                            }
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
                                  backgroundColor: `${
                                    GRENADE_TYPES[
                                      selectedLineup.grenadeType as keyof typeof GRENADE_TYPES
                                    ]?.color
                                  }20`,
                                  color:
                                    GRENADE_TYPES[
                                      selectedLineup.grenadeType as keyof typeof GRENADE_TYPES
                                    ]?.color,
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
                        <p className="text-[9px] text-[#6b6b8a] uppercase tracking-wider mb-0.5">
                          Throw
                        </p>
                        <p className="text-[11px] font-mono text-[#e8e8e8]/70">
                          {selectedLineup.throwPosition.x.toFixed(0)},{' '}
                          {selectedLineup.throwPosition.y.toFixed(0)},{' '}
                          {selectedLineup.throwPosition.z.toFixed(0)}
                        </p>
                      </div>
                      <div className="bg-[#0a0a0f] rounded-lg p-2.5">
                        <p className="text-[9px] text-[#6b6b8a] uppercase tracking-wider mb-0.5">
                          Landing
                        </p>
                        <p className="text-[11px] font-mono text-[#e8e8e8]/70">
                          {selectedLineup.landingPosition.x.toFixed(0)},{' '}
                          {selectedLineup.landingPosition.y.toFixed(0)},{' '}
                          {selectedLineup.landingPosition.z.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
