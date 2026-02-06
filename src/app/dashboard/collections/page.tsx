'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FolderOpen, Check, Plus, Search, X, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collectionsApi } from '@/lib/api';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import type { LineupCollection } from '@/lib/types';
import toast from 'react-hot-toast';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<LineupCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMap, setFilterMap] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const data = await collectionsApi.getAllWithStatus();
      setCollections(data);
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = collections;
    if (filterMap !== 'all') {
      result = result.filter((c) => c.mapName === filterMap);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [collections, filterMap, searchText]);

  // Group by map
  const groupedByMap = useMemo(() => {
    const groups: Record<string, LineupCollection[]> = {};
    for (const c of filtered) {
      if (!groups[c.mapName]) groups[c.mapName] = [];
      groups[c.mapName].push(c);
    }
    // Sort by map order from MAPS constant
    const sortedGroups: [string, LineupCollection[]][] = [];
    for (const m of MAPS) {
      if (groups[m.name]) {
        sortedGroups.push([m.name, groups[m.name]]);
      }
    }
    // Add any maps not in MAPS constant
    for (const [mapName, colls] of Object.entries(groups)) {
      if (!MAPS.find((m) => m.name === mapName)) {
        sortedGroups.push([mapName, colls]);
      }
    }
    return sortedGroups;
  }, [filtered]);

  const handleSubscribe = async (collection: LineupCollection) => {
    if (subscribingIds.has(collection.id)) return;

    setSubscribingIds((prev) => new Set(prev).add(collection.id));
    try {
      if (collection.isSubscribed) {
        await collectionsApi.unsubscribe(collection.id);
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collection.id ? { ...c, isSubscribed: false } : c
          )
        );
        toast.success(`Unsubscribed from ${collection.name}`);
      } else {
        await collectionsApi.subscribe(collection.id);
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collection.id ? { ...c, isSubscribed: true } : c
          )
        );
        toast.success(`Subscribed to ${collection.name}`);
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setSubscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(collection.id);
        return next;
      });
    }
  };

  const subscribedCount = collections.filter((c) => c.isSubscribed).length;
  const totalLineups = collections.reduce((acc, c) => acc + (c.isSubscribed ? c.lineupCount : 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-[#f0a500]/10 border border-[#f0a500]/20">
            <FolderOpen className="w-6 h-6 text-[#f0a500]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold">Collections</h1>
          </div>
        </div>
        <p className="text-[#6b6b8a] text-lg ml-[52px]">
          Subscribe to curated lineup collections to see them in-game
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-8 p-4 rounded-xl bg-[#12121a] border border-[#2a2a3e]">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-[#f0a500]/10 shrink-0">
            <FolderOpen className="w-4 h-4 text-[#f0a500]" />
          </div>
          <div className="text-sm">
            <p className="text-[#e8e8e8] font-medium mb-1">How Collections Work</p>
            <ul className="text-[#6b6b8a] space-y-1">
              <li>• <span className="text-[#f0a500]">Default</span> collections are auto-subscribed when you sign up</li>
              <li>• Subscribe to any collection to add its lineups to your in-game menu</li>
              <li>• Use the <code className="text-[#f0a500] bg-[#1a1a2e] px-1 rounded">!nades</code> command in practice mode to browse your subscribed lineups</li>
              <li>• Hide individual lineups you don&apos;t need without unsubscribing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#e8e8e8]">{collections.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mt-1">
            Available
          </span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#f0a500]">{subscribedCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mt-1">
            Subscribed
          </span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#22c55e]">{totalLineups}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b8a] mt-1">
            Total Lineups
          </span>
        </div>
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
              <option key={m.name} value={m.name}>
                {m.displayName}
              </option>
            ))}
          </select>
          <svg
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a] pointer-events-none"
            style={{ right: 12 }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b8a] pointer-events-none"
            style={{ left: 12 }}
          />
          <input
            type="text"
            placeholder="Search collections..."
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

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-32 bg-[#1a1a2e] rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="glass rounded-xl p-4 h-32 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="flex justify-center mb-6">
            <FolderOpen className="w-16 h-16 text-[#6b6b8a]/30" />
          </div>
          <p className="text-[#e8e8e8] text-xl font-semibold mb-2">
            {collections.length === 0
              ? 'No collections available'
              : 'No collections match your filters'}
          </p>
          <p className="text-[#6b6b8a]">
            {collections.length === 0
              ? 'Check back later for curated lineup collections'
              : 'Try adjusting the map or search filters'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-10"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {groupedByMap.map(([mapName, mapCollections]) => {
            const mapInfo = MAPS.find((m) => m.name === mapName);
            const mapColor = MAP_COLORS[mapName] || '#f0a500';

            return (
              <motion.div key={mapName} variants={item}>
                {/* Map Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: mapColor }}
                  />
                  <h2 className="text-lg font-semibold text-[#e8e8e8]">
                    {mapInfo?.displayName || mapName}
                  </h2>
                  <span className="text-sm text-[#6b6b8a]">
                    {mapCollections.length} collection
                    {mapCollections.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Collection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mapCollections.map((collection) => (
                    <motion.div
                      key={collection.id}
                      className={`glass rounded-xl p-4 border transition-all duration-200 ${
                        collection.isSubscribed
                          ? 'border-[#22c55e]/30 bg-[#22c55e]/5'
                          : 'border-transparent hover:border-[#2a2a3e]'
                      }`}
                      variants={item}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#e8e8e8] truncate">
                            {collection.name}
                          </h3>
                          {collection.description && (
                            <p className="text-sm text-[#6b6b8a] mt-1 line-clamp-2">
                              {collection.description}
                            </p>
                          )}
                        </div>
                        {collection.isDefault && (
                          <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0a500]/15 text-[#f0a500]">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6b6b8a]">
                          {collection.lineupCount} lineup
                          {collection.lineupCount !== 1 ? 's' : ''}
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/collections/${collection.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e] hover:text-[#e8e8e8] hover:border-[#3a3a5e] transition-all duration-200"
                          >
                            View
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleSubscribe(collection);
                            }}
                            disabled={subscribingIds.has(collection.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                              collection.isSubscribed
                                ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/20'
                                : 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/30 hover:bg-[#f0a500]/20'
                            }`}
                          >
                            {subscribingIds.has(collection.id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : collection.isSubscribed ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Subscribed
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                Subscribe
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
