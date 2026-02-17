'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Play, ChevronDown, Loader2, Monitor, X, Trash2, Users, Share2, Star, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import { collectionsApi, userCollectionsApi, sessionsApi, lineupsApi, communityApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Lineup, LineupCollection, Session } from '@/lib/types';
import MapRadar from '@/components/ui/MapRadar';
import FilterSidebar, { type GrenadeFilter, type SourceFilter } from './FilterSidebar';
import NadeList from './NadeList';
import NadeDetail from './NadeDetail';
import { fadeIn } from './types';

export default function MapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [crossMapMatches, setCrossMapMatches] = useState<LineupCollection[]>([]);

  // Filters
  const [grenadeFilter, setGrenadeFilter] = useState<GrenadeFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>({ type: 'all' });

  // Selection
  const [selectedLineup, setSelectedLineup] = useState<Lineup | null>(null);

  // Actions
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);
  const [startingServer, setStartingServer] = useState(false);
  const [serverCollectionPicker, setServerCollectionPicker] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  // User collection lineup tracking
  const [userCollectionLineupIds, setUserCollectionLineupIds] = useState<Map<string, Set<string>>>(new Map());

  // On-demand collection loading
  const [loadingCollection, setLoadingCollection] = useState(false);

  // Create collection modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCollectionName, setCreateCollectionName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  // Edit collection modal
  const [editingCollection, setEditingCollection] = useState<LineupCollection | null>(null);
  const [editCollectionName, setEditCollectionName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Delete collection modal
  const [deletingCollection, setDeletingCollection] = useState<LineupCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Publish state tracked inside edit modal (saved on "Save")
  const [editPublishState, setEditPublishState] = useState(false);

  // Inline publish
  const [publishing, setPublishing] = useState(false);

  // ── Data Loading ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [collections, myColls, myLineups, allProColls] = await Promise.all([
        collectionsApi.getAllWithStatus(mapName),
        userCollectionsApi.getMy(mapName),
        lineupsApi.getMy(mapName),
        collectionsApi.getAll(undefined, 'match'),
      ]);

      setAllCollections(collections);
      setUserCollections(myColls);
      setMyNades(myLineups);
      setCrossMapMatches(
        allProColls.filter((c) => c.mapName !== mapName),
      );

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

  // Check for active session on mount and poll during provisioning
  useEffect(() => {
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
    // Poll while provisioning
    const interval = setInterval(check, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Auto-select collection after initial load (URL param takes priority)
  useEffect(() => {
    if (loading) return;
    if (sourceFilter.type === 'collection') return;

    // URL query param pre-selection (e.g. from cross-map match navigation)
    const collectionParam = searchParams.get('collection');
    if (collectionParam) {
      const target = allCollections.find((c) => c.id === collectionParam);
      if (target) {
        setSourceFilter({ type: 'collection', collectionId: target.id, collectionName: target.name });
        return;
      }
    }

    const isPremium = user?.isPremium ?? false;
    if (isPremium) {
      const metaAll = allCollections.find((c) => c.proCategory === 'meta_all');
      if (metaAll) {
        setSourceFilter({ type: 'collection', collectionId: metaAll.id, collectionName: 'All Pro Meta Nades' });
        return;
      }
    }

    // Non-premium: select first user collection if available
    if (userCollections.length > 0) {
      const first = userCollections[0];
      setSourceFilter({ type: 'collection', collectionId: first.id, collectionName: first.name });
    }
  }, [loading, allCollections, userCollections, sourceFilter.type, user, searchParams]);

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

  // Focus modal inputs
  useEffect(() => {
    if (showCreateModal) setTimeout(() => createInputRef.current?.focus(), 100);
  }, [showCreateModal]);

  useEffect(() => {
    if (editingCollection) setTimeout(() => editInputRef.current?.focus(), 100);
  }, [editingCollection]);

  // ── Filtered Lineups ──────────────────────────────────────────
  const proCollections = useMemo(
    () => allCollections.filter((c) => c.autoManaged && !c.ownerId),
    [allCollections],
  );

  const communityCollections = useMemo(
    () => allCollections.filter((c) => c.isPublished && c.isSubscribed && c.ownerId && c.ownerId !== user?.id),
    [allCollections, user],
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
    } else if (sourceFilter.type === 'collection') {
      addLineups(lineupsByCollection.get(sourceFilter.collectionId) ?? []);
    }

    return result;
  }, [sourceFilter, myNades, allCollections, userCollections, lineupsByCollection]);

  const filteredLineups = useMemo(() => {
    if (grenadeFilter === 'all') return allLineups;
    return allLineups.filter((l) => l.grenadeType === grenadeFilter);
  }, [allLineups, grenadeFilter]);

  // ── Actions ────────────────────────────────────────────────────
  const handleCreateCollection = () => {
    setCreateCollectionName('');
    setShowCreateModal(true);
  };

  const handleCreateCollectionSubmit = async () => {
    if (!createCollectionName.trim()) return;

    setCreatingCollection(true);
    try {
      const newColl = await userCollectionsApi.create({ name: createCollectionName.trim(), mapName });
      setUserCollections((prev) => [...prev, newColl]);
      setUserCollectionLineupIds((prev) => new Map(prev).set(newColl.id, new Set()));
      toast.success(`Created "${createCollectionName.trim()}"`);
      setShowCreateModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create collection';
      toast.error(msg);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleEditCollection = (c: LineupCollection) => {
    setEditingCollection(c);
    setEditCollectionName(c.name);
    setEditPublishState(c.isPublished ?? false);
  };

  const handleEditCollectionSubmit = async () => {
    if (!editingCollection) {
      setEditingCollection(null);
      return;
    }

    const nameChanged = editCollectionName.trim() && editCollectionName.trim() !== editingCollection.name;
    const publishChanged = editPublishState !== editingCollection.isPublished;

    if (!nameChanged && !publishChanged) {
      setEditingCollection(null);
      return;
    }

    try {
      let updated = editingCollection;

      if (nameChanged) {
        updated = await userCollectionsApi.update(editingCollection.id, { name: editCollectionName.trim() });
      }

      if (publishChanged) {
        await communityApi.publish(editingCollection.id, editPublishState);
        updated = { ...updated, isPublished: editPublishState };
      }

      setUserCollections((prev) => prev.map((x) => (x.id === editingCollection.id ? updated : x)));
      toast.success(publishChanged ? (editPublishState ? 'Published to Community!' : 'Unpublished') : 'Collection updated');
      setEditingCollection(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    }
  };

  const handleDeleteCollection = (c: LineupCollection) => {
    if (userCollections.length <= 1) {
      toast.error("Can't delete your last collection");
      return;
    }
    setDeletingCollection(c);
  };

  const handleDeleteCollectionConfirm = async () => {
    if (!deletingCollection) return;
    setIsDeleting(true);
    try {
      await userCollectionsApi.delete(deletingCollection.id);
      setUserCollections((prev) => prev.filter((x) => x.id !== deletingCollection.id));
      if (sourceFilter.type === 'collection' && sourceFilter.collectionId === deletingCollection.id) {
        setSourceFilter({ type: 'all' });
      }
      toast.success('Collection deleted');
      setDeletingCollection(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddToCollection = async (lineupId: string, collectionId: string) => {
    setAddingToCollection(lineupId);
    try {
      await userCollectionsApi.addLineup(collectionId, lineupId);

      // Find the lineup object to add to lineupsByCollection
      const lineup = filteredLineups.find((l) => l.id === lineupId) ?? allLineups.find((l) => l.id === lineupId);

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

      // Instantly update lineupsByCollection so the nade appears in the collection view
      if (lineup) {
        setLineupsByCollection((prev) => {
          const next = new Map(prev);
          const existing = next.get(collectionId) ?? [];
          next.set(collectionId, [...existing, lineup]);
          return next;
        });
      }

      toast.success('Added to collection');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add';
      toast.error(msg);
    } finally {
      setAddingToCollection(null);
    }
  };

  const handleRemoveFromCollection = async (lineupId: string, collectionId: string) => {
    try {
      await userCollectionsApi.removeLineup(collectionId, lineupId);

      // Instantly update lineup tracking
      setUserCollectionLineupIds((prev) => {
        const next = new Map(prev);
        const ids = new Set(next.get(collectionId) ?? []);
        ids.delete(lineupId);
        next.set(collectionId, ids);
        return next;
      });
      setUserCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, lineupCount: Math.max(0, c.lineupCount - 1) } : c)),
      );

      // Instantly remove from lineupsByCollection
      setLineupsByCollection((prev) => {
        const next = new Map(prev);
        const existing = next.get(collectionId) ?? [];
        next.set(collectionId, existing.filter((l) => l.id !== lineupId));
        return next;
      });

      toast.success('Removed from collection');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to remove';
      toast.error(msg);
    }
  };

  const handleStartServer = async (collectionId?: string) => {
    setStartingServer(true);
    setServerCollectionPicker(false);
    try {
      const created = await sessionsApi.create(mapName, collectionId);
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

  const handlePublishCollection = async (collectionId: string) => {
    setPublishing(true);
    try {
      await communityApi.publish(collectionId, true);
      setUserCollections((prev) => prev.map((c) => (c.id === collectionId ? { ...c, isPublished: true, publishedAt: new Date().toISOString() } : c)));
      toast.success('Published to Community!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublishCollection = async (collectionId: string) => {
    setPublishing(true);
    try {
      await communityApi.publish(collectionId, false);
      setUserCollections((prev) => prev.map((c) => (c.id === collectionId ? { ...c, isPublished: false } : c)));
      toast.success('Collection unpublished');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to unpublish');
    } finally {
      setPublishing(false);
    }
  };

  // Current collection for practice server
  const currentCollectionId = sourceFilter.type === 'collection' ? sourceFilter.collectionId : undefined;
  const currentCollectionName = sourceFilter.type === 'collection' ? sourceFilter.collectionName : undefined;

  // Collections for the practice picker — non-premium only sees user collections
  const isPremium = user?.isPremium ?? false;
  const practiceCollections = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    for (const c of userCollections) {
      seen.add(c.id);
      result.push({ id: c.id, name: c.name });
    }
    for (const c of allCollections.filter((c) => c.isSubscribed && !seen.has(c.id))) {
      seen.add(c.id);
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
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left: Filter Sidebar */}
          <FilterSidebar
            grenadeFilter={grenadeFilter}
            onGrenadeFilterChange={setGrenadeFilter}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            proCollections={proCollections}
            userCollections={userCollections}
            communityCollections={communityCollections}
            crossMapMatches={crossMapMatches}
            currentMapName={mapName}
            onCreateCollection={handleCreateCollection}
            onEditCollection={handleEditCollection}
            onDeleteCollection={handleDeleteCollection}
            creatingCollection={creatingCollection}
          />

          {/* Center: Radar + Nade List */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Practice Server Card — prominent position */}
            <div className="max-w-[700px] rounded-xl border border-[#f0a500]/20 bg-gradient-to-r from-[#12121a] to-[#1a1a2e] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/10">
                  <Monitor className="h-5 w-5 text-[#f0a500]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#e8e8e8]">Practice Server</h3>
                      {currentCollectionName ? (
                        <p className="mt-0.5 text-xs text-[#6b6b8a] truncate">
                          Collection: <span className="text-[#f0a500]">{currentCollectionName}</span>
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-[#6b6b8a]">All nades on this map</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                        <>
                          <button
                            onClick={() => handleStartServer(currentCollectionId)}
                            disabled={startingServer}
                            className="flex items-center gap-2 rounded-lg bg-[#f0a500] px-4 py-2 text-sm font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
                          >
                            {startingServer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Start Server
                          </button>
                          {practiceCollections.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={() => setServerCollectionPicker(!serverCollectionPicker)}
                                disabled={startingServer}
                                className="flex items-center gap-1.5 rounded-lg border border-[#2a2a3e] bg-[#12121a] px-3 py-2 text-sm text-[#b8b8cc] hover:border-[#f0a500]/30 hover:text-[#e8e8e8] transition-colors disabled:opacity-50"
                              >
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${serverCollectionPicker ? 'rotate-180' : ''}`} />
                                Change
                              </button>
                              {serverCollectionPicker && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setServerCollectionPicker(false)} />
                                  <div className="absolute right-0 bottom-full z-50 mb-2 w-64 rounded-xl border border-[#2a2a3e] bg-[#12121a] py-2 shadow-2xl shadow-black/50">
                                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]">
                                      Choose a collection
                                    </p>
                                    {practiceCollections.map((c) => {
                                      const isActive = sourceFilter.type === 'collection' && sourceFilter.collectionId === c.id;
                                      return (
                                        <button
                                          key={c.id}
                                          onClick={() => {
                                            setSourceFilter({ type: 'collection', collectionId: c.id, collectionName: c.name });
                                            setServerCollectionPicker(false);
                                          }}
                                          className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                            isActive
                                              ? 'bg-[#f0a500]/10 text-[#f0a500]'
                                              : 'text-[#b8b8cc] hover:bg-[#1a1a2e] hover:text-[#e8e8e8]'
                                          }`}
                                        >
                                          <span className="truncate">{c.name}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <div className="max-w-[700px] flex-1 rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
                <MapRadar
                  mapName={mapName}
                  lineups={filteredLineups}
                  selectedLineupId={selectedLineup?.id}
                  onLineupClick={(lineup) => setSelectedLineup(lineup)}
                  mini={false}
                />
              </div>

              {/* Map Navigation Strip */}
              <div className="hidden md:flex flex-col gap-1.5 shrink-0">
                {MAPS.map((m) => {
                  const isActive = m.name === mapName;
                  const mapColor = MAP_COLORS[m.name] || '#f0a500';
                  return (
                    <Link
                      key={m.name}
                      href={`/dashboard/maps/${m.name}`}
                      title={m.displayName}
                      className={`relative w-[72px] h-[60px] rounded-lg overflow-hidden border-2 transition-all duration-200 group ${
                        isActive
                          ? 'border-[#f0a500] shadow-[0_0_10px_rgba(240,165,0,0.25)]'
                          : 'border-[#2a2a3e]/50 hover:border-[#6b6b8a]/50 hover:shadow-lg hover:shadow-black/30'
                      }`}
                    >
                      <Image
                        src={m.screenshot}
                        alt={m.displayName}
                        fill
                        className={`object-cover transition-all duration-200 ${isActive ? 'brightness-90' : 'brightness-[0.35] group-hover:brightness-[0.6]'}`}
                        sizes="72px"
                      />
                      {isActive && (
                        <div className="absolute inset-0 ring-1 ring-inset ring-[#f0a500]/30 rounded-[6px]" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-1.5 pb-1 pt-3">
                        <p className={`text-[9px] font-bold text-center leading-tight tracking-wide ${isActive ? 'text-[#f0a500]' : 'text-white/80 group-hover:text-white'}`}>
                          {m.displayName}
                        </p>
                      </div>
                      {isActive && (
                        <div
                          className="absolute inset-x-0 top-0 h-[2px]"
                          style={{ background: `linear-gradient(to right, transparent, ${mapColor}, transparent)` }}
                        />
                      )}
                    </Link>
                  );
                })}
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

            {/* Community publish/status banner */}
            {(() => {
              if (sourceFilter.type !== 'collection') return null;
              const coll = userCollections.find((c) => c.id === sourceFilter.collectionId);
              if (!coll) return null;

              if (coll.isPublished) {
                // Published — show stats + unpublish
                return (
                  <div className="max-w-[700px] rounded-lg border border-[#6c5ce7]/20 bg-[#6c5ce7]/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[#6c5ce7]">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs font-semibold">Published</span>
                      </div>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-1.5 text-[#b8b8cc]">
                          <Users className="h-3.5 w-3.5 text-[#6b6b8a]" />
                          <span className="text-xs">{coll.subscriberCount ?? 0} subscriber{(coll.subscriberCount ?? 0) !== 1 ? 's' : ''}</span>
                        </div>
                        {(coll.ratingCount ?? 0) > 0 && (
                          <div className="flex items-center gap-1 text-[#b8b8cc]">
                            <Star className="h-3.5 w-3.5 text-[#f0a500]" />
                            <span className="text-xs">{(coll.averageRating ?? 0).toFixed(1)}</span>
                            <span className="text-[10px] text-[#6b6b8a]">({coll.ratingCount})</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnpublishCollection(coll.id)}
                        disabled={publishing}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[#2a2a3e] bg-[#12121a] px-3 py-1.5 text-xs font-medium text-[#b8b8cc] hover:text-[#ff4444] hover:border-[#ff4444]/30 transition-colors disabled:opacity-40"
                      >
                        {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <><EyeOff className="h-3 w-3" /> Unpublish</>}
                      </button>
                    </div>
                  </div>
                );
              }

              // Not published — show publish CTA
              const canPublish = coll.lineupCount >= 5;
              return (
                <div className="max-w-[700px] flex items-center gap-3 rounded-lg border border-[#6c5ce7]/20 bg-[#6c5ce7]/5 px-4 py-3">
                  <Share2 className="h-4 w-4 shrink-0 text-[#6c5ce7]" />
                  <p className="flex-1 text-xs text-[#b8b8cc]">
                    {canPublish
                      ? 'Share this collection with the community so others can subscribe!'
                      : `Add ${5 - coll.lineupCount} more lineup${5 - coll.lineupCount !== 1 ? 's' : ''} to publish this collection.`}
                  </p>
                  <button
                    onClick={() => handlePublishCollection(coll.id)}
                    disabled={!canPublish || publishing}
                    className="shrink-0 rounded-lg bg-[#6c5ce7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7c6df7] transition-colors disabled:opacity-40"
                  >
                    {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Publish'}
                  </button>
                </div>
              );
            })()}

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
                currentCollectionId={sourceFilter.type === 'collection' ? sourceFilter.collectionId : undefined}
                isCurrentCollectionOwned={
                  sourceFilter.type === 'collection'
                    ? userCollections.some((c) => c.id === sourceFilter.collectionId)
                    : false
                }
              />
            </div>
          </div>

          {/* Right: Selected Nade Detail */}
          <div className="w-full xl:w-72 shrink-0">
            {selectedLineup ? (
              <div className="xl:sticky xl:top-4">
                <NadeDetail lineup={selectedLineup} />
              </div>
            ) : (
              <div className="hidden xl:block rounded-xl border border-[#2a2a3e]/30 bg-[#12121a]/50 px-6 py-12 text-center">
                <p className="text-sm text-[#6b6b8a]">Select a nade to see details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-96 rounded-xl border border-[#2a2a3e] bg-[#12121a] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#e8e8e8]">Create Collection</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-[#6b6b8a] hover:text-[#e8e8e8]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-4">
                <input
                  ref={createInputRef}
                  type="text"
                  value={createCollectionName}
                  onChange={(e) => setCreateCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCollectionSubmit()}
                  maxLength={50}
                  placeholder="Collection name..."
                  className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#e8e8e8] placeholder:text-[#6b6b8a] focus:border-[#f0a500]/50 focus:outline-none"
                />
                <p className={`mt-1.5 text-right text-[10px] ${createCollectionName.length >= 45 ? 'text-[#f0a500]' : 'text-[#6b6b8a]/50'}`}>
                  {createCollectionName.length}/50
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-[#2a2a3e] px-3 py-2 text-sm text-[#b8b8cc] hover:bg-[#1a1a2e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollectionSubmit}
                  disabled={!createCollectionName.trim() || creatingCollection}
                  className="flex-1 rounded-lg bg-[#f0a500] px-3 py-2 text-sm font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
                >
                  {creatingCollection ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Collection Modal */}
      <AnimatePresence>
        {deletingCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setDeletingCollection(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-96 rounded-xl border border-[#2a2a3e] bg-[#12121a] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#e8e8e8]">Delete Collection</h3>
                <button onClick={() => setDeletingCollection(null)} className="text-[#6b6b8a] hover:text-[#e8e8e8]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-5 text-sm text-[#6b6b8a]">
                Are you sure you want to delete <span className="text-[#e8e8e8] font-medium">"{deletingCollection.name}"</span>? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingCollection(null)}
                  className="flex-1 rounded-lg border border-[#2a2a3e] px-3 py-2 text-sm text-[#b8b8cc] hover:bg-[#1a1a2e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCollectionConfirm}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#ff4444] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ff5555] transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Collection Modal */}
      <AnimatePresence>
        {editingCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setEditingCollection(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-96 rounded-xl border border-[#2a2a3e] bg-[#12121a] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#e8e8e8]">Edit Collection</h3>
                <button onClick={() => setEditingCollection(null)} className="text-[#6b6b8a] hover:text-[#e8e8e8]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-4">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editCollectionName}
                  onChange={(e) => setEditCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditCollectionSubmit()}
                  maxLength={50}
                  placeholder="Collection name..."
                  className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#e8e8e8] placeholder:text-[#6b6b8a] focus:border-[#f0a500]/50 focus:outline-none"
                />
                <p className={`mt-1.5 text-right text-[10px] ${editCollectionName.length >= 45 ? 'text-[#f0a500]' : 'text-[#6b6b8a]/50'}`}>
                  {editCollectionName.length}/50
                </p>
              </div>
              {/* Publish to Community toggle */}
              {user?.isPremium && editingCollection && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-[#2a2a3e] bg-[#0a0a0f] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#6c5ce7] shrink-0" />
                    <div>
                      <p className="text-sm text-[#e8e8e8]">Published to Community</p>
                      <p className="text-xs text-[#6b6b8a]">
                        {editingCollection.lineupCount < 5 && !editPublishState
                          ? 'Needs at least 5 lineups'
                          : editPublishState
                            ? 'Others can browse and subscribe'
                            : 'Let others browse and subscribe'}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={!editPublishState && editingCollection.lineupCount < 5}
                    onClick={() => setEditPublishState(!editPublishState)}
                    className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-30 ${
                      editPublishState ? 'bg-[#6c5ce7]' : 'bg-[#2a2a3e]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        editPublishState ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCollection(null)}
                  className="flex-1 rounded-lg border border-[#2a2a3e] px-3 py-2 text-sm text-[#b8b8cc] hover:bg-[#1a1a2e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCollectionSubmit}
                  disabled={!editCollectionName.trim() || (editCollectionName.trim() === editingCollection.name && editPublishState === editingCollection.isPublished)}
                  className="flex-1 rounded-lg bg-[#f0a500] px-3 py-2 text-sm font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
