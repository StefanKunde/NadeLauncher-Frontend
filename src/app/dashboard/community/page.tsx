'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Users, Loader2, Star, ChevronDown } from 'lucide-react';
import { communityApi, collectionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import StarRating from '@/components/ui/StarRating';
import type { CommunityCollection } from '@/lib/types';
import toast from 'react-hot-toast';

type SortOption = 'popular' | 'top_rated' | 'newest' | 'most_lineups';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_lineups', label: 'Most Lineups' },
];

const LIMIT = 25;

export default function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const [collections, setCollections] = useState<CommunityCollection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mapFilter, setMapFilter] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('popular');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        map: mapFilter || undefined,
        search: debouncedSearch || undefined,
        sort,
        page,
        limit: LIMIT,
      };
      const result = user
        ? await communityApi.browseWithStatus(params)
        : await communityApi.browse(params);
      setCollections(result.items);
      setTotal(result.total);
    } catch {
      toast.error('Failed to load community collections');
    } finally {
      setLoading(false);
    }
  }, [mapFilter, debouncedSearch, sort, page, user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [mapFilter, debouncedSearch, sort]);

  const handleSubscribe = async (e: React.MouseEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return;
    try {
      if (col.isSubscribed) {
        await collectionsApi.unsubscribe(collectionId);
        toast.success('Unsubscribed');
      } else {
        await collectionsApi.subscribe(collectionId);
        toast.success('Subscribed!');
      }
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                isSubscribed: !c.isSubscribed,
                subscriberCount: c.subscriberCount + (c.isSubscribed ? -1 : 1),
              }
            : c,
        ),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const getMapDisplayName = (name: string) =>
    MAPS.find((m) => m.name === name)?.displayName ?? name;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-[#6c5ce7]" />
          Community Collections
        </h1>
        <p className="text-sm text-[#8888aa] mt-1">
          Browse and subscribe to collections shared by other players
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-3 focus-within:border-[#6c5ce7]">
          <Search className="h-4 w-4 shrink-0 text-[#555577]" />
          <input
            type="text"
            placeholder="Search collections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent py-2 text-white text-sm placeholder-[#555577] focus:outline-none border-none"
          />
        </div>

        <div className="relative">
          <select
            value={mapFilter}
            onChange={(e) => setMapFilter(e.target.value)}
            className="appearance-none pl-3 pr-9 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm focus:border-[#6c5ce7] focus:outline-none cursor-pointer"
          >
            <option value="">All Maps</option>
            {MAPS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.displayName}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b8a] pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="appearance-none pl-3 pr-9 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm focus:border-[#6c5ce7] focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b8a] pointer-events-none" />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#6c5ce7]" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-20 text-[#8888aa]">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium text-white/60">No community collections found</p>
          <p className="text-sm mt-1">Be the first to publish a collection!</p>
        </div>
      ) : (
        <>
          {/* Table header — desktop only */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]">
            <span className="w-16">Map</span>
            <span className="flex-1">Collection</span>
            <span className="w-20 text-center">Nades</span>
            <span className="w-20 text-center">Subs</span>
            <span className="w-24 text-center">Rating</span>
            <span className="w-32">By</span>
            <span className="w-24" />
          </div>

          {/* List */}
          <div className="space-y-2">
            {collections.map((col) => (
              <Link key={col.id} href={`/dashboard/community/${col.id}`}>
                {/* Desktop row */}
                <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#12121a] border border-transparent hover:border-[#6c5ce7]/40 hover:bg-[#1a1a2e] transition-all cursor-pointer group">
                  {/* Map badge */}
                  <span
                    className="w-16 shrink-0 text-[10px] font-bold uppercase text-center px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${MAP_COLORS[col.mapName] || '#6c5ce7'}15`,
                      color: MAP_COLORS[col.mapName] || '#6c5ce7',
                    }}
                  >
                    {getMapDisplayName(col.mapName)}
                  </span>

                  {/* Name + description */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#e8e8e8] group-hover:text-[#6c5ce7] transition-colors truncate block">
                      {col.name}
                    </span>
                    {col.description && (
                      <span className="text-[11px] text-[#6b6b8a] truncate block">
                        {col.description}
                      </span>
                    )}
                  </div>

                  {/* Nades count */}
                  <span className="w-20 text-center text-xs text-[#8888aa]">
                    {col.lineupCount}
                  </span>

                  {/* Subscribers */}
                  <span className="w-20 text-center text-xs text-[#8888aa]">
                    {col.subscriberCount}
                  </span>

                  {/* Rating */}
                  <div className="w-24 flex justify-center">
                    <StarRating value={Math.round(col.averageRating)} count={col.ratingCount} />
                  </div>

                  {/* Owner */}
                  <div className="w-32 flex items-center gap-1.5 min-w-0">
                    {col.ownerAvatar ? (
                      <img src={col.ownerAvatar} alt="" className="h-4 w-4 rounded-full shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-[#2a2a3e] shrink-0" />
                    )}
                    <span className="text-xs text-[#8888aa] truncate">{col.ownerName}</span>
                  </div>

                  {/* Subscribe button */}
                  <div className="w-24 flex justify-end">
                    {user && col.ownerId !== user.id && (
                      <button
                        onClick={(e) => handleSubscribe(e, col.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          col.isSubscribed
                            ? 'bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-[#6c5ce7] text-white hover:bg-[#5a4bd6]'
                        }`}
                      >
                        {col.isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden rounded-lg bg-[#12121a] border border-transparent hover:border-[#6c5ce7]/40 hover:bg-[#1a1a2e] transition-all cursor-pointer p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="shrink-0 text-[10px] font-bold uppercase text-center px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${MAP_COLORS[col.mapName] || '#6c5ce7'}15`,
                          color: MAP_COLORS[col.mapName] || '#6c5ce7',
                        }}
                      >
                        {getMapDisplayName(col.mapName)}
                      </span>
                      <span className="text-sm font-medium text-[#e8e8e8] truncate">{col.name}</span>
                    </div>
                    {user && col.ownerId !== user.id && (
                      <button
                        onClick={(e) => handleSubscribe(e, col.id)}
                        className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          col.isSubscribed
                            ? 'bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-[#6c5ce7] text-white hover:bg-[#5a4bd6]'
                        }`}
                      >
                        {col.isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8888aa]">
                    <span>{col.lineupCount} nades</span>
                    <span>{col.subscriberCount} subs</span>
                    <StarRating value={Math.round(col.averageRating)} count={col.ratingCount} />
                    {col.ownerName && (
                      <span className="ml-auto truncate">by {col.ownerName}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#6b6b8a]">
              {total} collection{total !== 1 ? 's' : ''}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-sm text-white disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-sm text-[#8888aa]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-sm text-white disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
