'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trophy, Search, Users, Crosshair, TrendingUp, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAPS, MAP_COLORS, GRENADE_TYPES } from '@/lib/constants';
import { proNadesApi, collectionsApi } from '@/lib/api';
import type { ProCollection, Lineup, TimeWindow, CollectionWithLineups } from '@/lib/types';
import TimeWindowFilter from '@/components/pro-nades/TimeWindowFilter';
import ImpactBadge from '@/components/pro-nades/ImpactBadge';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import MapRadar from '@/components/ui/MapRadar';

type GrenadeType = keyof typeof GRENADE_TYPES;

interface CategoryTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  filter: (c: ProCollection) => boolean;
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'All', icon: <Trophy className="h-4 w-4" />, filter: () => true },
  { key: 'meta', label: 'Meta', icon: <TrendingUp className="h-4 w-4" />, filter: (c) => c.proCategory === 'meta' },
  { key: 'team', label: 'Teams', icon: <Users className="h-4 w-4" />, filter: (c) => c.proCategory === 'team' },
  { key: 'pistol', label: 'Pistol', icon: <Crosshair className="h-4 w-4" />, filter: (c) => c.proCategory === 'pistol' },
];

export default function ProNadesMapPage() {
  const params = useParams();
  const router = useRouter();
  const mapName = params.mapName as string;

  const map = MAPS.find((m) => m.name === mapName);
  const color = MAP_COLORS[mapName] || '#f0a500';

  const [collections, setCollections] = useState<ProCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all_time');
  const [search, setSearch] = useState('');

  // Collection detail view
  const [selectedCollection, setSelectedCollection] = useState<ProCollection | null>(null);
  const [collectionLineups, setCollectionLineups] = useState<Lineup[]>([]);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [selectedLineup, setSelectedLineup] = useState<Lineup | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'damage' | 'blind'>('name');

  useEffect(() => {
    setLoading(true);
    proNadesApi.getCollections(mapName, undefined, undefined)
      .then((cols) => setCollections(cols.filter((c) => c.autoManaged)))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, [mapName]);

  const filteredCollections = useMemo(() => {
    const tab = CATEGORY_TABS.find((t) => t.key === activeTab);
    let filtered = tab ? collections.filter(tab.filter) : collections;

    // Time window filter
    if (timeWindow !== 'all_time') {
      filtered = filtered.filter((c) => !c.timeWindow || c.timeWindow === timeWindow);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    return filtered;
  }, [collections, activeTab, timeWindow, search]);

  const sortedLineups = useMemo(() => {
    const list = [...collectionLineups];
    if (sortBy === 'damage') {
      list.sort((a, b) => (b.totalDamage ?? 0) - (a.totalDamage ?? 0));
    } else if (sortBy === 'blind') {
      list.sort((a, b) => (b.totalBlindDuration ?? 0) - (a.totalBlindDuration ?? 0));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [collectionLineups, sortBy]);

  const openCollection = useCallback(async (col: ProCollection) => {
    setSelectedCollection(col);
    setLoadingLineups(true);
    setSelectedLineup(null);
    setSortBy('name');
    try {
      const data: CollectionWithLineups = await collectionsApi.getById(col.id);
      setCollectionLineups(data.lineups);
    } catch {
      setCollectionLineups([]);
    } finally {
      setLoadingLineups(false);
    }
  }, []);

  if (!map) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6b6b8a]">Map not found</p>
        <Link href="/dashboard/pro-nades" className="text-[#f0a500] hover:underline mt-2 inline-block">
          Back to Pro Nades
        </Link>
      </div>
    );
  }

  // Collection detail view
  if (selectedCollection) {
    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => { setSelectedCollection(null); setCollectionLineups([]); setSelectedLineup(null); }}
          className="mb-4 flex items-center gap-2 text-sm text-[#6b6b8a] transition-colors hover:text-[#e8e8e8]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to collections
        </button>

        {/* Collection header */}
        <div className="mb-6 rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] p-5">
          <h2 className="text-xl font-bold text-[#e8e8e8]">{selectedCollection.name}</h2>
          {selectedCollection.description && (
            <p className="mt-1 text-sm text-[#6b6b8a]">{selectedCollection.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded bg-[#f0a500]/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#f0a500]">
              PRO
            </span>
            {selectedCollection.proCategory && (
              <span className="text-xs text-[#6b6b8a] capitalize">
                {selectedCollection.proCategory.replace('_', ' ')}
              </span>
            )}
            <span className="text-xs text-[#6b6b8a]">
              {sortedLineups.length} lineups
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#6b6b8a]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'damage' | 'blind')}
                className="rounded-lg border border-[#2a2a3e] bg-[#12121a] px-2 py-1 text-xs text-[#e8e8e8] focus:border-[#f0a500]/40 focus:outline-none"
              >
                <option value="name">Sort by name</option>
                <option value="damage">Sort by damage</option>
                <option value="blind">Sort by blind duration</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Lineup list */}
          <div className="flex-1 space-y-2">
            {loadingLineups ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-[#12121a] border border-[#2a2a3e]/50 p-4 animate-pulse">
                  <div className="h-4 w-40 bg-[#1a1a2e] rounded" />
                  <div className="mt-2 h-3 w-24 bg-[#1a1a2e] rounded" />
                </div>
              ))
            ) : sortedLineups.length === 0 ? (
              <div className="rounded-lg border border-[#2a2a3e]/50 bg-[#12121a] px-6 py-12 text-center text-sm text-[#6b6b8a]">
                No lineups in this collection
              </div>
            ) : (
              sortedLineups.map((lineup) => (
                <button
                  key={lineup.id}
                  onClick={() => setSelectedLineup(lineup)}
                  className={`w-full rounded-lg border bg-[#12121a] p-4 text-left transition-all hover:border-[#2a2a3e] ${
                    selectedLineup?.id === lineup.id ? 'border-[#f0a500]/40' : 'border-[#2a2a3e]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GrenadeIcon type={lineup.grenadeType} size={16} />
                      <span className="text-sm font-medium text-[#e8e8e8]">{lineup.name}</span>
                    </div>
                    <ImpactBadge
                      totalDamage={lineup.totalDamage}
                      enemiesBlinded={lineup.enemiesBlinded}
                      totalBlindDuration={lineup.totalBlindDuration}
                      flashAssists={lineup.flashAssists}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-[#6b6b8a]">
                    {lineup.playerName && <span>{lineup.playerName}</span>}
                    {lineup.teamName && <span>{lineup.teamName}</span>}
                    <span className="capitalize">{lineup.throwType?.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Radar + detail sidebar */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-8 self-start space-y-4">
            <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
              <MapRadar
                mapName={mapName}
                lineups={sortedLineups}
                selectedLineupId={selectedLineup?.id}
                onLineupClick={(lineup) => setSelectedLineup(lineup)}
                mini={false}
              />
            </div>
            {selectedLineup && (
              <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#e8e8e8]">{selectedLineup.name}</h3>
                {selectedLineup.description && (
                  <p className="text-xs text-[#6b6b8a]">{selectedLineup.description}</p>
                )}
                <ImpactBadge
                  totalDamage={selectedLineup.totalDamage}
                  enemiesBlinded={selectedLineup.enemiesBlinded}
                  totalBlindDuration={selectedLineup.totalBlindDuration}
                  flashAssists={selectedLineup.flashAssists}
                />
                <div className="space-y-1.5 text-xs text-[#6b6b8a]">
                  {selectedLineup.playerName && <p>Player: <span className="text-[#e8e8e8]">{selectedLineup.playerName}</span></p>}
                  {selectedLineup.teamName && <p>Team: <span className="text-[#e8e8e8]">{selectedLineup.teamName}</span></p>}
                  {selectedLineup.teamSide && <p>Side: <span className="text-[#e8e8e8]">{selectedLineup.teamSide}</span></p>}
                  {selectedLineup.roundNumber != null && <p>Round: <span className="text-[#e8e8e8]">{selectedLineup.roundNumber}</span></p>}
                </div>
                {selectedLineup.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedLineup.tags.map((tag) => (
                      <span key={tag} className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] text-[#6b6b8a]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main collections grid view
  return (
    <div>
      {/* Map Banner */}
      <div className="relative mb-6 h-36 overflow-hidden rounded-2xl">
        <Image
          src={map.screenshot}
          alt={map.displayName}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0a0a0f]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8">
          <div>
            <Link
              href="/dashboard/pro-nades"
              className="mb-1 flex items-center gap-1.5 text-xs text-[#6b6b8a] transition-colors hover:text-[#e8e8e8]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Pro Nades
            </Link>
            <h1 className="text-3xl font-bold text-white">{map.displayName}</h1>
            <p className="mt-1 text-sm text-[#a0a0b0]">
              {filteredCollections.length} pro {filteredCollections.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
        />
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
          <TimeWindowFilter value={timeWindow} onChange={setTimeWindow} />

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b8a]" />
            <input
              type="text"
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a3e] bg-[#12121a] py-2 pl-9 pr-3 text-sm text-[#e8e8e8] placeholder:text-[#4a4a6a] focus:border-[#f0a500]/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#12121a] border border-[#2a2a3e]/50 p-5 animate-pulse">
              <div className="h-4 w-32 bg-[#1a1a2e] rounded" />
              <div className="mt-3 h-3 w-48 bg-[#1a1a2e] rounded" />
              <div className="mt-4 h-3 w-20 bg-[#1a1a2e] rounded" />
            </div>
          ))}
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] px-8 py-12 text-center">
          <p className="text-sm text-[#6b6b8a]">
            No collections found{search ? ` matching "${search}"` : ' for this filter'}
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredCollections.map((col) => (
              <motion.button
                key={col.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => openCollection(col)}
                className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] p-5 text-left transition-all hover:border-[#2a2a3e] hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[#e8e8e8] line-clamp-2">{col.name}</h3>
                  <span className="ml-2 shrink-0 rounded bg-[#f0a500]/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#f0a500]">
                    PRO
                  </span>
                </div>
                {col.description && (
                  <p className="mt-1.5 text-xs text-[#6b6b8a] line-clamp-2">{col.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs font-medium text-[#a0a0b0]">
                    {col.lineupCount} {col.lineupCount === 1 ? 'lineup' : 'lineups'}
                  </span>
                  {col.proCategory && (
                    <span className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] text-[#6b6b8a] capitalize">
                      {col.proCategory.replace('_', ' ')}
                    </span>
                  )}
                  {col.timeWindow && col.timeWindow !== 'all_time' && (
                    <span className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] text-[#6b6b8a]">
                      {col.timeWindow === 'last_30d' ? '30d' : '90d'}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
