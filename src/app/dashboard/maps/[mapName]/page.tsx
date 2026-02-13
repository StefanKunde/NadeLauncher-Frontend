'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, ChevronDown, Loader2, Monitor } from 'lucide-react';
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

  // On-demand collection loading
  const [loadingCollection, setLoadingCollection] = useState(false);

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

  // On-demand loading when selecting a collection not yet loaded
  useEffect(() => {
    if (sourceFilter.type !== 'collection') return;
    if (lineupsByCollection.has(sourceFilter.collectionId)) return;

    let cancelled = false;
    setLoadingCollection(true);

    collectionsApi.getById(sourceFilter.collectionId).then((data) => {
      if (cancelled) return;
      setLineupsByCollection((prev) => {
        const next = new Map(prev);
        next.set(sourceFilter.collectionId, data.lineups);
        return next;
      });
    }).catch(() => {
      if (!cancelled) toast.error('Failed to load collection');
    }).finally(() => {
      if (!cancelled) setLoadingCollection(false);
    });

    return () => { cancelled = true; };
  }, [sourceFilter, lineupsByCollection]);

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
      <div className="mb-5 flex items-center gap-3">
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
            <div className="max-w-[700px] rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
              <MapRadar
                mapName={mapName}
                lineups={filteredLineups}
                selectedLineupId={selectedLineup?.id}
                onLineupClick={(lineup) => setSelectedLineup(lineup)}
                mini={false}
              />
            </div>

            {/* Practice Server Card */}
            <div className="max-w-[700px] relative rounded-xl border border-[#2a2a3e]/50 bg-gradient-to-r from-[#12121a] to-[#1a1a2e] p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/10">
                  <Monitor className="h-5 w-5 text-[#f0a500]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#e8e8e8]">Practice Server</h3>
                  <p className="mt-0.5 text-xs text-[#6b6b8a]">
                    Launch a private CS2 server with ghost guidance to practice these lineups
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleStartServer()}
                      disabled={startingServer}
                      className="flex items-center gap-2 rounded-lg bg-[#f0a500] px-4 py-2 text-sm font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
                    >
                      {startingServer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Practice All Nades
                    </button>
                    {practiceCollections.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setServerCollectionPicker(!serverCollectionPicker)}
                          disabled={startingServer}
                          className="flex items-center gap-1.5 rounded-lg border border-[#2a2a3e] bg-[#12121a] px-3 py-2 text-sm text-[#b8b8cc] hover:border-[#f0a500]/30 hover:text-[#e8e8e8] transition-colors disabled:opacity-50"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${serverCollectionPicker ? 'rotate-180' : ''}`} />
                          With Collection
                        </button>
                        {serverCollectionPicker && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setServerCollectionPicker(false)} />
                            <div className="absolute left-0 bottom-full z-50 mb-2 w-64 rounded-xl border border-[#2a2a3e] bg-[#12121a] py-2 shadow-2xl shadow-black/50">
                              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]">
                                Choose a collection
                              </p>
                              {practiceCollections.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => handleStartServer(c.id)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#b8b8cc] hover:bg-[#1a1a2e] hover:text-[#e8e8e8]"
                                >
                                  <Play className="h-3 w-3 text-[#f0a500]" />
                                  <span className="truncate">{c.name}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6b6b8a]">
                {loadingCollection ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading collection...
                  </span>
                ) : (
                  <>
                    {filteredLineups.length} nade{filteredLineups.length !== 1 ? 's' : ''}
                    {sourceFilter.type === 'collection' && (
                      <span className="text-[#f0a500]"> in {sourceFilter.collectionName}</span>
                    )}
                  </>
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
