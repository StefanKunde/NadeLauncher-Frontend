'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Users, Loader2 } from 'lucide-react';
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

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
        limit: 18,
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

  const totalPages = Math.ceil(total / 18);

  const getMapDisplayName = (name: string) =>
    MAPS.find((m) => m.name === name)?.displayName ?? name;

  return (
    <div className="space-y-6">
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
        {/* Search */}
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

        {/* Map Filter */}
        <select
          value={mapFilter}
          onChange={(e) => setMapFilter(e.target.value)}
          className="pl-3 pr-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm focus:border-[#6c5ce7] focus:outline-none cursor-pointer"
        >
          <option value="">All Maps</option>
          {MAPS.map((m) => (
            <option key={m.name} value={m.name}>
              {m.displayName}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="pl-3 pr-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm focus:border-[#6c5ce7] focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {collections.map((col) => (
              <motion.div key={col.id} variants={item}>
                <Link href={`/dashboard/community/${col.id}`}>
                  <div className="group bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4 hover:border-[#6c5ce7]/50 transition-all cursor-pointer">
                    {/* Map Badge + Name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <span
                          className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mb-1.5"
                          style={{
                            backgroundColor: `${MAP_COLORS[col.mapName] || '#6c5ce7'}20`,
                            color: MAP_COLORS[col.mapName] || '#6c5ce7',
                          }}
                        >
                          {getMapDisplayName(col.mapName)}
                        </span>
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#6c5ce7] transition-colors">
                          {col.name}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => handleSubscribe(e, col.id)}
                        className={`shrink-0 ml-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          col.isSubscribed
                            ? 'bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-[#6c5ce7] text-white hover:bg-[#5a4bd6]'
                        }`}
                      >
                        {col.isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                    </div>

                    {/* Description */}
                    {col.description && (
                      <p className="text-xs text-[#8888aa] mb-3 line-clamp-2">
                        {col.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-[#8888aa]">
                        <span>{col.lineupCount} nades</span>
                        <span>{col.subscriberCount} subs</span>
                      </div>
                      <StarRating value={Math.round(col.averageRating)} count={col.ratingCount} />
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2a2a3e]">
                      {col.ownerAvatar ? (
                        <img
                          src={col.ownerAvatar}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-[#2a2a3e]" />
                      )}
                      <span className="text-xs text-[#8888aa]">
                        {col.ownerName}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-sm text-white disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-[#8888aa]">
                Page {page} of {totalPages}
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
        </>
      )}
    </div>
  );
}
