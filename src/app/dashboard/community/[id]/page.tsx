'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, Play, Monitor } from 'lucide-react';
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
    <div className="space-y-4 max-w-[1600px]">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={() => router.push('/dashboard/community')}
          className="flex items-center gap-1.5 text-sm text-[#8888aa] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </button>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {map?.displayName ?? collection.mapName}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-[#8888aa] mt-1">{collection.description}</p>
            )}

            {/* Owner + Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {ownerName && (
                <div className="flex items-center gap-1.5">
                  {ownerAvatar ? (
                    <img src={ownerAvatar} alt="" className="h-4 w-4 rounded-full" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-[#2a2a3e]" />
                  )}
                  <span className="text-xs text-[#8888aa]">{ownerName}</span>
                </div>
              )}
              <span className="text-xs text-[#8888aa]">{lineups.length} nades</span>
              <span className="text-xs text-[#8888aa]">{subscriberCount} subscribers</span>
            </div>

            {/* Rating */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#8888aa]">Community:</span>
                <StarRating value={Math.round(averageRating)} count={ratingCount} />
              </div>
              {user && collection.ownerId !== user.id && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#8888aa]">Your rating:</span>
                  <StarRating value={userRating} onChange={handleRate} size="md" />
                </div>
              )}
            </div>
          </div>

          {/* Subscribe Button */}
          {user && collection.ownerId !== user.id && (
            <button
              onClick={handleSubscribe}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSubscribed
                  ? 'bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-red-500/20 hover:text-red-400'
                  : 'bg-[#6c5ce7] text-white hover:bg-[#5a4bd6]'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>

      {/* Main layout — stacks on small screens */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Center: Practice Server + Radar + Nade List */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Practice Server Card */}
          {user && isSubscribed && (
            <div className="max-w-[500px] rounded-xl border border-[#f0a500]/20 bg-gradient-to-r from-[#12121a] to-[#1a1a2e] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/10">
                  <Monitor className="h-5 w-5 text-[#f0a500]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#e8e8e8]">Practice Server</h3>
                      <p className="mt-0.5 text-xs text-[#6b6b8a] truncate">
                        Collection: <span className="text-[#f0a500]">{collection.name}</span>
                      </p>
                    </div>
                    <div className="shrink-0">
                      {activeSession?.isActive ? (
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 rounded-lg border border-[#4a9fd4]/30 bg-[#4a9fd4]/10 px-4 py-2 text-sm font-semibold text-[#4a9fd4] hover:bg-[#4a9fd4]/20 transition-colors"
                        >
                          {activeSession.status === 'pending' || activeSession.status === 'provisioning' || activeSession.status === 'queued' ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {activeSession.status === 'queued' ? 'Queued...' : 'Starting...'}
                            </>
                          ) : (
                            <>
                              <Monitor className="h-4 w-4" />
                              Server Active
                            </>
                          )}
                        </Link>
                      ) : (
                        <button
                          onClick={handleStartServer}
                          disabled={startingServer}
                          className="flex items-center gap-2 rounded-lg bg-[#f0a500] px-4 py-2 text-sm font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
                        >
                          {startingServer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          Start Server
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Radar */}
          <div className="max-w-[500px] rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
            {map && (
              <MapRadar
                mapName={collection.mapName}
                lineups={filteredLineups}
                selectedLineupId={selectedLineup?.id ?? null}
                onLineupClick={setSelectedLineup}
              />
            )}
          </div>

          {/* Grenade Filter + Count */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
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
            <p className="text-xs text-[#6b6b8a]">
              {filteredLineups.length} nade{filteredLineups.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Nade List */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
            <NadeList
              lineups={filteredLineups}
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

        {/* Right: Selected Nade Detail */}
        <div className="w-full lg:w-72 shrink-0">
          {selectedLineup ? (
            <div className="lg:sticky lg:top-4">
              <NadeDetail lineup={selectedLineup} />
            </div>
          ) : (
            <div className="rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]/50 px-6 py-12 text-center">
              <p className="text-sm text-[#6b6b8a]">Select a nade to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
