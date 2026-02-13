'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import { collectionsApi, userCollectionsApi, sessionsApi, lineupsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Lineup, LineupCollection } from '@/lib/types';
import MapRadar from '@/components/ui/MapRadar';
import FilterSidebar, { type GrenadeFilter, type SourceFilter } from './FilterSidebar';
import NadeList from './NadeList';
import NadeDetail from './NadeDetail';
import { fadeIn } from './types';

export default function MapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mapName = params.mapName as string;
  const user = useAuthStore((s) => s.user);

  const map = MAPS.find((m) => m.name === mapName);
  const color = MAP_COLORS[mapName] || '#f0a500';

  // ── State ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [allCollections, setAllCollections] = useState<LineupCollection[]>([]);
  const [userCollections, setUserCollections] = useState<LineupCollection[]>([]);
  const [lineupsByCollection, setLineupsByCollection] = useState<Map<string, Lineup[]>>(new Map());
  const [myNades, setMyNades] = useState<Lineup[]>([]);

  // Filters
  const [grenadeFilter, setGrenadeFilter] = useState<GrenadeFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>({ type: 'all' });
  const [search, setSearch] = useState('');

  // Selection
  const [selectedLineup, setSelectedLineup] = useState<Lineup | null>(null);

  // Actions
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);
  const [startingServer, setStartingServer] = useState(false);
  const [serverCollectionPicker, setServerCollectionPicker] = useState(false);

  // User collection lineup tracking
  const [userCollectionLineupIds, setUserCollectionLineupIds] = useState<Map<string, Set<string>>>(new Map());

  // ── Data Loading ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [collections, myColls, myLineups] = await Promise.all([
        collectionsApi.getAllWithStatus(mapName),
        userCollectionsApi.getMy(mapName),
        lineupsApi.getMy(mapName),
      ]);

      setAllCollections(collections);
      setUserCollections(myColls);
      setMyNades(myLineups);

      // Load lineups for subscribed collections and user collections
      const collectionsToLoad = [
        ...collections.filter((c) => c.isSubscribed),
        ...myColls,
      ];

      // Deduplicate by ID
      const uniqueIds = new Set<string>();
      const unique = collectionsToLoad.filter((c) => {
        if (uniqueIds.has(c.id)) return false;
        uniqueIds.add(c.id);
        return true;
      });

      const lineupMap = new Map<string, Lineup[]>();
      const userCollLineupMap = new Map<string, Set<string>>();

      await Promise.all(
        unique.map(async (c) => {
          try {
            const data = await collectionsApi.getById(c.id);
            lineupMap.set(c.id, data.lineups);
            if (c.ownerId) {
              userCollLineupMap.set(c.id, new Set(data.lineups.map((l: Lineup) => l.id)));
            }
          } catch {
            lineupMap.set(c.id, []);
          }
        }),
      );

      setLineupsByCollection(lineupMap);
      setUserCollectionLineupIds(userCollLineupMap);
    } catch {
      toast.error('Failed to load nades');
    } finally {
      setLoading(false);
    }
  }, [mapName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered Lineups ──────────────────────────────────────────
  const proCollections = useMemo(
    () => allCollections.filter((c) => c.autoManaged && !c.ownerId),
    [allCollections],
  );

  const allLineups = useMemo(() => {
    const seen = new Set<string>();
    const result: Lineup[] = [];

    const addLineups = (lineups: Lineup[]) => {
      for (const l of lineups) {
        if (!seen.has(l.id)) {
          seen.add(l.id);
          result.push(l);
        }
      }
    };

    if (sourceFilter.type === 'all') {
      addLineups(myNades);
      for (const c of allCollections.filter((c) => c.isSubscribed)) {
        addLineups(lineupsByCollection.get(c.id) ?? []);
      }
      for (const c of userCollections) {
        addLineups(lineupsByCollection.get(c.id) ?? []);
      }
    } else if (sourceFilter.type === 'my-nades') {
      addLineups(myNades);
    } else if (sourceFilter.type === 'collection') {
      addLineups(lineupsByCollection.get(sourceFilter.collectionId) ?? []);
    }

    return result;
  }, [sourceFilter, myNades, allCollections, userCollections, lineupsByCollection]);

  const filteredLineups = useMemo(() => {
    let result = allLineups;

    if (grenadeFilter !== 'all') {
      result = result.filter((l) => l.grenadeType === grenadeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.toLowerCase().includes(q)) ||
          l.description?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [allLineups, grenadeFilter, search]);

  // ── Actions ────────────────────────────────────────────────────
  const handleCreateCollection = async () => {
    const name = prompt('Collection name:');
    if (!name?.trim()) return;

    setCreatingCollection(true);
    try {
      const newColl = await userCollectionsApi.create({ name: name.trim(), mapName });
      setUserCollections((prev) => [...prev, newColl]);
      setUserCollectionLineupIds((prev) => new Map(prev).set(newColl.id, new Set()));
      toast.success(`Created "${name.trim()}"`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create collection';
      toast.error(msg);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleEditCollection = async (c: LineupCollection) => {
    const name = prompt('New name:', c.name);
    if (!name?.trim() || name.trim() === c.name) return;

    try {
      const updated = await userCollectionsApi.update(c.id, { name: name.trim() });
      setUserCollections((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
      toast.success('Collection renamed');
    } catch {
      toast.error('Failed to rename');
    }
  };

  const handleDeleteCollection = async (c: LineupCollection) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;

    try {
      await userCollectionsApi.delete(c.id);
      setUserCollections((prev) => prev.filter((x) => x.id !== c.id));
      if (sourceFilter.type === 'collection' && sourceFilter.collectionId === c.id) {
        setSourceFilter({ type: 'all' });
      }
      toast.success('Collection deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAddToCollection = async (lineupId: string, collectionId: string) => {
    setAddingToCollection(lineupId);
    try {
      await userCollectionsApi.addLineup(collectionId, lineupId);
      setUserCollectionLineupIds((prev) => {
        const next = new Map(prev);
        const ids = new Set(next.get(collectionId) ?? []);
        ids.add(lineupId);
        next.set(collectionId, ids);
        return next;
      });
      setUserCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, lineupCount: c.lineupCount + 1 } : c)),
      );
      toast.success('Added to collection');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add';
      toast.error(msg);
    } finally {
      setAddingToCollection(null);
    }
  };

  const handleStartServer = async (collectionId?: string) => {
    setStartingServer(true);
    setServerCollectionPicker(false);
    try {
      await sessionsApi.create(mapName, collectionId);
      toast.success('Server starting...');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start server';
      toast.error(msg);
    } finally {
      setStartingServer(false);
    }
  };

  // All collections for the practice picker
  const practiceCollections = useMemo(() => {
    const result: { id: string; name: string }[] = [];
    for (const c of userCollections) {
      result.push({ id: c.id, name: c.name });
    }
    for (const c of allCollections.filter((c) => c.isSubscribed && c.autoManaged)) {
      result.push({ id: c.id, name: c.name });
    }
    return result;
  }, [userCollections, allCollections]);

  // ── Render ─────────────────────────────────────────────────────
  if (!map) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6b6b8a]">Map not found</p>
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="max-w-[1600px]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/maps"
            className="flex items-center gap-1 text-sm text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Maps
          </Link>
          <div className="h-4 w-px bg-[#2a2a3e]" />
          <h1 className="text-xl font-bold text-[#e8e8e8]">{map.displayName}</h1>
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        </div>

        {/* Start Server Button */}
        <div className="relative">
          <div className="flex">
            <button
              onClick={() => handleStartServer()}
              disabled={startingServer}
              className="flex items-center gap-2 rounded-l-lg bg-[#f0a500] px-4 py-2 text-sm font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {startingServer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Practice
            </button>
            <button
              onClick={() => setServerCollectionPicker(!serverCollectionPicker)}
              disabled={startingServer}
              className="flex items-center rounded-r-lg border-l border-[#0a0a0f]/20 bg-[#f0a500] px-2 py-2 text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {serverCollectionPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setServerCollectionPicker(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#2a2a3e] bg-[#12121a] py-2 shadow-2xl shadow-black/50">
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]">
                  Practice with collection
                </p>
                <button
                  onClick={() => handleStartServer()}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#b8b8cc] hover:bg-[#1a1a2e] hover:text-[#e8e8e8]"
                >
                  <Play className="h-3.5 w-3.5 text-[#f0a500]" />
                  All subscribed nades
                </button>
                {practiceCollections.length > 0 && <div className="my-1 h-px bg-[#2a2a3e]/50" />}
                {practiceCollections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleStartServer(c.id)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#b8b8cc] hover:bg-[#1a1a2e] hover:text-[#e8e8e8]"
                  >
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Layout */}
      {loading ? (
        <div className="flex gap-6">
          <div className="w-64 shrink-0 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-[#12121a] animate-pulse" />
            ))}
          </div>
          <div className="flex-1">
            <div className="aspect-square max-w-[600px] rounded-xl bg-[#12121a] animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Left: Filter Sidebar */}
          <FilterSidebar
            grenadeFilter={grenadeFilter}
            onGrenadeFilterChange={setGrenadeFilter}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            search={search}
            onSearchChange={setSearch}
            proCollections={proCollections}
            userCollections={userCollections}
            onCreateCollection={handleCreateCollection}
            onEditCollection={handleEditCollection}
            onDeleteCollection={handleDeleteCollection}
            creatingCollection={creatingCollection}
          />

          {/* Center: Radar + Nade List */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
              <MapRadar
                mapName={mapName}
                lineups={filteredLineups}
                selectedLineupId={selectedLineup?.id}
                onLineupClick={(lineup) => setSelectedLineup(lineup)}
                mini={false}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6b6b8a]">
                {filteredLineups.length} nade{filteredLineups.length !== 1 ? 's' : ''}
                {sourceFilter.type === 'collection' && (
                  <span className="text-[#f0a500]"> in {sourceFilter.collectionName}</span>
                )}
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
              <NadeList
                lineups={filteredLineups}
                selectedLineupId={selectedLineup?.id ?? null}
                onSelectLineup={setSelectedLineup}
                userCollections={userCollections}
                addingToCollection={addingToCollection}
                onAddToCollection={handleAddToCollection}
                userCollectionLineupIds={userCollectionLineupIds}
              />
            </div>
          </div>

          {/* Right: Selected Nade Detail */}
          <div className="w-72 shrink-0">
            {selectedLineup ? (
              <div className="sticky top-4">
                <NadeDetail lineup={selectedLineup} />
              </div>
            ) : (
              <div className="rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]/50 px-6 py-12 text-center">
                <p className="text-sm text-[#6b6b8a]">Select a nade to see details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
