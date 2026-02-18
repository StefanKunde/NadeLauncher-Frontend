'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Users, Loader2, Star, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Globe, ArrowUpDown } from 'lucide-react';
import { communityApi, collectionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import StarRating from '@/components/ui/StarRating';
import type { CommunityCollection } from '@/lib/types';
import toast from 'react-hot-toast';

type SortOption = 'popular' | 'top_rated' | 'newest' | 'most_lineups';
type SortDirection = 'asc' | 'desc';

const LIMIT = 25;

export default function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const [collections, setCollections] = useState<CommunityCollection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mapFilter, setMapFilter] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('popular');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
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
        direction: sortDir,
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
  }, [mapFilter, debouncedSearch, sort, sortDir, page, user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [mapFilter, debouncedSearch, sort, sortDir]);

  const handleSort = (column: SortOption) => {
    if (sort === column) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(column);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortOption }) => {
    if (sort !== column) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-50 transition-opacity" />;
    return sortDir === 'desc'
      ? <ChevronDown className="h-3 w-3 text-[#6c5ce7]" />
      : <ChevronUp className="h-3 w-3 text-[#6c5ce7]" />;
  };

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

      {/* Map filter strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {/* All Maps button */}
        <button
          onClick={() => setMapFilter('')}
          className={`relative shrink-0 flex items-center justify-center w-20 h-14 rounded-lg overflow-hidden border transition-all duration-200 ${
            mapFilter === ''
              ? 'border-[#6c5ce7]/60 ring-1 ring-[#6c5ce7]/30'
              : 'border-[#2a2a3e]/30 hover:border-[#2a2a3e] opacity-60 hover:opacity-100'
          }`}
        >
          <div className="absolute inset-0 bg-[#1a1a2e]" />
          <div className="relative flex flex-col items-center gap-1">
            <Globe className="h-4 w-4 text-[#6c5ce7]" />
            <span className="text-[9px] font-semibold text-white/90">All Maps</span>
          </div>
          {mapFilter === '' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6c5ce7]" />
          )}
        </button>

        {MAPS.map((m) => {
          const isActive = mapFilter === m.name;
          const mColor = MAP_COLORS[m.name] ?? '#6c5ce7';
          return (
            <button
              key={m.name}
              onClick={() => setMapFilter(m.name)}
              className={`relative shrink-0 block w-20 h-14 rounded-lg overflow-hidden border transition-all duration-200 ${
                isActive
                  ? 'border-[#6c5ce7]/60 ring-1 ring-[#6c5ce7]/30'
                  : 'border-[#2a2a3e]/30 hover:border-[#2a2a3e] opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={m.screenshot}
                alt={m.displayName}
                fill
                className="object-cover"
                sizes="80px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-1 left-1.5 text-[9px] font-semibold text-white/90 drop-shadow-md">
                {m.displayName}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: mColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-3 focus-within:border-[#6c5ce7]">
        <Search className="h-4 w-4 shrink-0 text-[#555577]" />
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent py-2 text-white text-sm placeholder-[#555577] focus:outline-none border-none"
        />
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
          {/* Table header — desktop only, sortable */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a] select-none">
            <span className="w-16">Map</span>
            <button
              onClick={() => handleSort('newest')}
              className="group/sort flex-1 flex items-center gap-1 text-left hover:text-[#e8e8e8] transition-colors"
            >
              Collection <SortIcon column="newest" />
            </button>
            <button
              onClick={() => handleSort('most_lineups')}
              className="group/sort w-20 flex items-center justify-center gap-1 hover:text-[#e8e8e8] transition-colors"
            >
              Nades <SortIcon column="most_lineups" />
            </button>
            <button
              onClick={() => handleSort('popular')}
              className="group/sort w-20 flex items-center justify-center gap-1 hover:text-[#e8e8e8] transition-colors"
            >
              Subs <SortIcon column="popular" />
            </button>
            <button
              onClick={() => handleSort('top_rated')}
              className="group/sort w-24 flex items-center justify-center gap-1 hover:text-[#e8e8e8] transition-colors"
            >
              Rating <SortIcon column="top_rated" />
            </button>
            <span className="w-32">By</span>
            <span className="w-24" />
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            {collections.map((col) => (
              <Link key={col.id} href={`/dashboard/community/${col.id}`} className="block">
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
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                            : 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
                        }`}
                      >
                        {col.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
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
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                            : 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
                        }`}
                      >
                        {col.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
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
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-[#6b6b8a]">
              {total} collection{total !== 1 ? 's' : ''}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-[#b8b8cc] hover:border-[#6c5ce7]/40 hover:text-white transition-colors disabled:opacity-30 disabled:hover:border-[#2a2a3e]"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                {/* Previous */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-[#b8b8cc] hover:border-[#6c5ce7]/40 hover:text-white transition-colors disabled:opacity-30 disabled:hover:border-[#2a2a3e]"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages: number[] = [];
                  let start = Math.max(1, page - 2);
                  let end = Math.min(totalPages, start + 4);
                  if (end - start < 4) start = Math.max(1, end - 4);
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-[#6c5ce7] text-white border border-[#6c5ce7]'
                          : 'bg-[#1a1a2e] border border-[#2a2a3e] text-[#b8b8cc] hover:border-[#6c5ce7]/40 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}

                {/* Next */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-[#b8b8cc] hover:border-[#6c5ce7]/40 hover:text-white transition-colors disabled:opacity-30 disabled:hover:border-[#2a2a3e]"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {/* Last page */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-[#b8b8cc] hover:border-[#6c5ce7]/40 hover:text-white transition-colors disabled:opacity-30 disabled:hover:border-[#2a2a3e]"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
