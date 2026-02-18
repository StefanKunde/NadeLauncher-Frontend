'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, Play, Monitor, X, Eye, Search, Crosshair, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MAPS, MAP_COLORS, GRENADE_TYPES } from '@/lib/constants';
import { collectionsApi, userCollectionsApi, communityApi, sessionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Lineup, LineupCollection, Session } from '@/lib/types';
import MapRadar from '@/components/ui/MapRadar';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import StarRating from '@/components/ui/StarRating';
import NadeDetail from '../../maps/[mapName]/NadeDetail';
import NadeList from '../../maps/[mapName]/NadeList';

type GrenadeFilter = 'all' | 'smoke' | 'flash' | 'molotov' | 'he';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<LineupCollection | null>(null);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [selectedLineup, setSelectedLineup] = useState<Lineup | null>(null);
  const [grenadeFilter, setGrenadeFilter] = useState<GrenadeFilter>('all');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [ownerName, setOwnerName] = useState('');
  const [ownerAvatar, setOwnerAvatar] = useState('');

  // User collections for "Add to my collection" feature
  const [userCollections, setUserCollections] = useState<LineupCollection[]>([]);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);
  const [userCollectionLineupIds, setUserCollectionLineupIds] = useState<Map<string, Set<string>>>(new Map());

  // Practice server
  const [startingServer, setStartingServer] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  // Nade search & detail modal
  const [nadeSearch, setNadeSearch] = useState('');
  const [showNadeDetail, setShowNadeDetail] = useState(false);

  const map = collection ? MAPS.find((m) => m.name === collection.mapName) : null;
  const color = collection ? (MAP_COLORS[collection.mapName] || '#6c5ce7') : '#6c5ce7';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, myCols] = await Promise.all([
          user
            ? collectionsApi.getByIdWithUserState(collectionId)
            : collectionsApi.getById(collectionId),
          user ? userCollectionsApi.getMy() : Promise.resolve([]),
        ]);
        setCollection(data.collection);
        setLineups(data.lineups);
        setIsSubscribed(data.collection.isSubscribed ?? false);
        setSubscriberCount(data.collection.subscriberCount ?? 0);
        setAverageRating(data.collection.averageRating ?? 0);
        setRatingCount(data.collection.ratingCount ?? 0);
        setUserCollections(myCols);

        // Build lineup ID map for user collections
        const idMap = new Map<string, Set<string>>();
        await Promise.all(
          myCols.map(async (c) => {
            try {
              const d = await collectionsApi.getById(c.id);
              idMap.set(c.id, new Set(d.lineups.map((l: Lineup) => l.id)));
            } catch {
              idMap.set(c.id, new Set());
            }
          }),
        );
        setUserCollectionLineupIds(idMap);

        // Load community info for owner and rating
        if (user) {
          const community = await communityApi.browseWithStatus({ limit: 1, search: data.collection.name });
          const match = community.items.find((c) => c.id === collectionId);
          if (match) {
            setOwnerName(match.ownerName);
            setOwnerAvatar(match.ownerAvatar ?? '');
            setUserRating(match.userRating ?? 0);
            setAverageRating(match.averageRating);
            setRatingCount(match.ratingCount);
            setSubscriberCount(match.subscriberCount);
          }
        }
      } catch {
        toast.error('Failed to load collection');
        router.push('/dashboard/community');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collectionId, user, router]);

  // Check for active session
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const check = async () => {
      try {
        const s = await sessionsApi.getActive();
        if (!cancelled) setActiveSession(s ?? null);
      } catch {
        if (!cancelled) setActiveSession(null);
      }
    };
    check();
    const interval = setInterval(check, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  const filteredLineups = useMemo(() => {
    if (grenadeFilter === 'all') return lineups;
    return lineups.filter((l) => l.grenadeType === grenadeFilter);
  }, [lineups, grenadeFilter]);

  const searchFilteredLineups = useMemo(() => {
    if (!nadeSearch.trim()) return filteredLineups;
    const q = nadeSearch.toLowerCase();
    return filteredLineups.filter((l) =>
      l.name.toLowerCase().includes(q) ||
      l.playerName?.toLowerCase().includes(q) ||
      l.teamName?.toLowerCase().includes(q),
    );
  }, [filteredLineups, nadeSearch]);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      if (isSubscribed) {
        await collectionsApi.unsubscribe(collectionId);
        setIsSubscribed(false);
        setSubscriberCount((c) => Math.max(0, c - 1));
        toast.success('Unsubscribed');
      } else {
        await collectionsApi.subscribe(collectionId);
        setIsSubscribed(true);
        setSubscriberCount((c) => c + 1);
        toast.success('Subscribed!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    }
  };

  const handleRate = async (rating: number) => {
    if (!user || collection?.ownerId === user.id) return;
    try {
      const result = await communityApi.rate(collectionId, rating);
      setUserRating(result.userRating);
      setAverageRating(result.averageRating);
      setRatingCount(result.ratingCount);
      toast.success('Rating saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to rate');
    }
  };

  const handleAddToCollection = async (lineupId: string, targetCollectionId: string) => {
    setAddingToCollection(lineupId);
    try {
      await userCollectionsApi.addLineup(targetCollectionId, lineupId);
      setUserCollectionLineupIds((prev) => {
        const next = new Map(prev);
        const ids = new Set(next.get(targetCollectionId) ?? []);
        ids.add(lineupId);
        next.set(targetCollectionId, ids);
        return next;
      });
      toast.success('Added to collection');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add';
      toast.error(msg);
    } finally {
      setAddingToCollection(null);
    }
  };

  const handleRemoveFromCollection = async () => {
    // No-op for community detail — users can't remove from community collections
  };

  const handleStartServer = async () => {
    if (!collection) return;
    setStartingServer(true);
    try {
      const created = await sessionsApi.create(collection.mapName, collectionId);
      setActiveSession(created);
      toast.success('Server starting...');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start server';
      toast.error(msg);
    } finally {
      setStartingServer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#6c5ce7]" />
      </div>
    );
  }

  if (!collection) return null;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="max-w-[1600px]">
      {/* Header + Practice Bar */}
      <div className="relative mb-5 flex items-center gap-3">
        <Link
          href="/dashboard/community"
          className="flex items-center gap-1 text-sm text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Community
        </Link>
        <div className="h-4 w-px bg-[#2a2a3e] shrink-0" />
        <h1 className="text-xl font-bold text-[#e8e8e8] shrink-0">{collection.name}</h1>
        {map && (
          <span
            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {map.displayName}
          </span>
        )}

        {/* Practice bar — true center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          {activeSession?.isActive ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-[#4a9fd4]/30 bg-[#4a9fd4]/10 px-4 py-2 text-xs font-semibold text-[#4a9fd4] hover:bg-[#4a9fd4]/20 transition-colors"
            >
              {activeSession.status === 'pending' || activeSession.status === 'provisioning' || activeSession.status === 'queued' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {activeSession.status === 'queued' ? 'Queued...' : 'Starting...'}
                </>
              ) : (
                <>
                  <Monitor className="h-3.5 w-3.5" />
                  Server Active
                </>
              )}
            </Link>
          ) : user && isSubscribed ? (
            <button
              onClick={handleStartServer}
              disabled={startingServer}
              className="flex items-center gap-2 rounded-lg bg-[#f0a500] px-4 py-2 text-xs font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {startingServer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Practice this Collection
            </button>
          ) : null}
        </div>
      </div>

      {/* Collection info bar */}
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#2a2a3e]/30 bg-[#12121a] px-4 py-3">
        {/* Owner */}
        {ownerName && (
          <div className="flex items-center gap-1.5">
            {ownerAvatar ? (
              <img src={ownerAvatar} alt="" className="h-5 w-5 rounded-full" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-[#2a2a3e]" />
            )}
            <span className="text-xs text-[#b8b8cc] font-medium">{ownerName}</span>
          </div>
        )}
        <span className="text-xs text-[#6b6b8a]">{lineups.length} nades</span>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-[#6b6b8a]" />
          <span className="text-xs text-[#6b6b8a]">{subscriberCount}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating value={Math.round(averageRating)} count={ratingCount} />
        </div>
        {user && collection.ownerId !== user.id && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#6b6b8a]">Your rating:</span>
            <StarRating value={userRating} onChange={handleRate} size="md" />
          </div>
        )}

        {/* Subscribe button */}
        {user && collection.ownerId !== user.id && (
          <button
            onClick={handleSubscribe}
            className={`ml-auto shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSubscribed
                ? 'bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-red-500/20 hover:text-red-400'
                : 'bg-[#6c5ce7] text-white hover:bg-[#5a4bd6]'
            }`}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        )}

        {/* Description */}
        {collection.description && (
          <p className="w-full text-xs text-[#6b6b8a] leading-relaxed mt-1">{collection.description}</p>
        )}
      </div>

      {/* Main Layout — two columns */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Center: Radar + Grenade Filters */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Column guide — desktop only */}
          <div className="hidden xl:block mb-1">
            <div className="h-[3px] rounded-full bg-[#4a9fd4]/25" />
            <p className="mt-1.5 text-[9px] text-[#4a9fd4]/50 font-medium tracking-wide">Interactive Map</p>
          </div>

          {/* Grenade Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setGrenadeFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                grenadeFilter === 'all'
                  ? 'bg-[#f0a500]/15 text-[#f0a500] border border-[#f0a500]/30'
                  : 'bg-[#12121a] text-[#6b6b8a] border border-[#2a2a3e]/50 hover:text-[#e8e8e8]'
              }`}
            >
              All
            </button>
            {(Object.keys(GRENADE_TYPES) as Array<keyof typeof GRENADE_TYPES>).map((type) => (
              <button
                key={type}
                onClick={() => setGrenadeFilter(type)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  grenadeFilter === type
                    ? 'bg-[#f0a500]/15 text-[#f0a500] border border-[#f0a500]/30'
                    : 'bg-[#12121a] text-[#6b6b8a] border border-[#2a2a3e]/50 hover:text-[#e8e8e8]'
                }`}
              >
                <GrenadeIcon type={type} size={14} />
                {GRENADE_TYPES[type].label}
              </button>
            ))}
          </div>

          {/* Radar */}
          <div className="max-w-[600px] rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
            {map && (
              <MapRadar
                mapName={collection.mapName}
                lineups={filteredLineups}
                selectedLineupId={selectedLineup?.id ?? null}
                onLineupClick={setSelectedLineup}
              />
            )}
          </div>
        </div>

        {/* Right: Nade List Panel — always visible */}
        <div className="w-full xl:w-[340px] shrink-0">
          <div className="xl:sticky xl:top-4 space-y-2.5">
            {/* Column guide — desktop only */}
            <div className="hidden xl:block mb-1">
              <div className="h-[3px] rounded-full bg-[#22c55e]/25" />
              <p className="mt-1.5 text-[9px] text-[#22c55e]/50 font-medium tracking-wide">Nade List</p>
            </div>

            {/* Selected nade mini card */}
            <div className="rounded-xl border border-[#2a2a3e]/30 bg-[#12121a] px-3.5 py-3">
              {selectedLineup ? (() => {
                const gColor = GRENADE_TYPES[selectedLineup.grenadeType as keyof typeof GRENADE_TYPES]?.color ?? '#f0a500';
                const proInfo = [selectedLineup.playerName, selectedLineup.teamName].filter(Boolean).join(' \u00b7 ');
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                      style={{ backgroundColor: `${gColor}15` }}
                    >
                      <GrenadeIcon type={selectedLineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e8e8e8] truncate">{selectedLineup.name}</p>
                      {proInfo && <p className="text-[10px] text-[#f0a500]/50 truncate">{proInfo}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setShowNadeDetail(true)}
                        className="p-1.5 rounded-lg text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e] transition-colors"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedLineup(null)}
                        className="p-1.5 rounded-lg text-[#6b6b8a] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
                        title="Deselect"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a2e] shrink-0">
                    <Crosshair className="h-4 w-4 text-[#2a2a3e]" />
                  </div>
                  <p className="text-xs text-[#6b6b8a]">No nade selected</p>
                </div>
              )}
            </div>

            {/* Search + count */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-[#2a2a3e]/30 bg-[#12121a] px-3 py-1.5 focus-within:border-[#f0a500]/30 transition-colors">
                <Search className="h-3.5 w-3.5 text-[#6b6b8a] shrink-0" />
                <input
                  type="text"
                  placeholder="Search nades..."
                  value={nadeSearch}
                  onChange={(e) => setNadeSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#e8e8e8] placeholder-[#6b6b8a]/50 focus:outline-none border-none"
                />
              </div>
              <p className="text-[10px] text-[#6b6b8a] shrink-0 tabular-nums">
                {searchFilteredLineups.length}
              </p>
            </div>

            {/* Scrollable nade list */}
            <div className="max-h-[calc(100vh-18rem)] overflow-y-auto scrollbar-thin rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]/30 p-4">
              <NadeList
                lineups={searchFilteredLineups}
                selectedLineupId={selectedLineup?.id ?? null}
                onSelectLineup={setSelectedLineup}
                userCollections={userCollections}
                addingToCollection={addingToCollection}
                onAddToCollection={handleAddToCollection}
                onRemoveFromCollection={handleRemoveFromCollection}
                userCollectionLineupIds={userCollectionLineupIds}
                isCurrentCollectionOwned={false}
              />
            </div>
          </div>
        </div>

        {/* Nade Detail Modal */}
        <AnimatePresence>
          {showNadeDetail && selectedLineup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60"
              onClick={() => setShowNadeDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-sm max-h-[80vh] overflow-y-auto scrollbar-thin rounded-xl border border-[#2a2a3e] bg-[#0d0d14] shadow-2xl shadow-black/60"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#0d0d14] border-b border-[#2a2a3e]/50">
                  <p className="text-sm font-semibold text-[#e8e8e8]">Nade Details</p>
                  <button
                    onClick={() => setShowNadeDetail(false)}
                    className="p-1 rounded-lg text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <NadeDetail lineup={selectedLineup} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
