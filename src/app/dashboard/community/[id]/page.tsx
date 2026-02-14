'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MAPS, MAP_COLORS, GRENADE_TYPES } from '@/lib/constants';
import { collectionsApi, userCollectionsApi, communityApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Lineup, LineupCollection, CollectionWithLineups } from '@/lib/types';
import MapRadar from '@/components/ui/MapRadar';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import StarRating from '@/components/ui/StarRating';
import NadeDetail from '../../maps/[mapName]/NadeDetail';

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
      toast.success('Added to collection');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add';
      toast.error(msg);
    } finally {
      setAddingToCollection(null);
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
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="shrink-0 pb-4 space-y-3">
        <button
          onClick={() => router.push('/dashboard/community')}
          className="flex items-center gap-1.5 text-sm text-[#8888aa] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${color}20`,
                  color,
                }}
              >
                {map?.displayName ?? collection.mapName}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-[#8888aa] mt-1">{collection.description}</p>
            )}

            {/* Owner + Stats */}
            <div className="flex items-center gap-4 mt-2">
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
            <div className="flex items-center gap-3 mt-2">
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
          {user && (
            <button
              onClick={handleSubscribe}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

      {/* Grenade Filter */}
      <div className="shrink-0 flex gap-1.5 pb-3">
        <button
          onClick={() => setGrenadeFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            grenadeFilter === 'all'
              ? 'bg-white/10 text-white'
              : 'text-[#8888aa] hover:text-white'
          }`}
        >
          All
        </button>
        {(Object.keys(GRENADE_TYPES) as Array<keyof typeof GRENADE_TYPES>).map((type) => (
          <button
            key={type}
            onClick={() => setGrenadeFilter(type)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              grenadeFilter === type
                ? 'bg-white/10 text-white'
                : 'text-[#8888aa] hover:text-white'
            }`}
          >
            <GrenadeIcon type={type} size={12} />
            {GRENADE_TYPES[type].label}
          </button>
        ))}
      </div>

      {/* Main Content: Map + Nade List + Detail */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Map Radar */}
        <div className="flex-1 min-w-0">
          {map && (
            <MapRadar
              mapName={collection.mapName}
              lineups={filteredLineups}
              selectedLineupId={selectedLineup?.id ?? null}
              onLineupClick={setSelectedLineup}
            />
          )}
        </div>

        {/* Nade List + Detail Panel */}
        <div className="w-80 shrink-0 flex flex-col gap-3 min-h-0">
          {/* Nade List */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {filteredLineups.length === 0 ? (
              <p className="text-sm text-[#8888aa] text-center py-8">No nades found</p>
            ) : (
              filteredLineups.map((lineup) => (
                <div
                  key={lineup.id}
                  onClick={() => setSelectedLineup(lineup)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    selectedLineup?.id === lineup.id
                      ? 'bg-[#6c5ce7]/20 border border-[#6c5ce7]/40'
                      : 'bg-[#1a1a2e] border border-transparent hover:border-[#2a2a3e]'
                  }`}
                >
                  <GrenadeIcon type={lineup.grenadeType} size={16} />
                  <span className="flex-1 text-sm text-white truncate">
                    {lineup.name}
                  </span>
                  {/* Add to collection dropdown */}
                  {user && userCollections.length > 0 && (
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                      <select
                        className="appearance-none bg-[#6c5ce7] text-white text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleAddToCollection(lineup.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">+ Add</option>
                        {userCollections.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Nade Detail */}
          {selectedLineup && (
            <div className="shrink-0 max-h-[40%] overflow-y-auto">
              <NadeDetail lineup={selectedLineup} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
