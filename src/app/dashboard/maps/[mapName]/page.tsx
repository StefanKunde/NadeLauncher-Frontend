'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lineupsApi, collectionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import type { Lineup, LineupCollection, CollectionWithLineups } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import toast from 'react-hot-toast';

import type { TabKey, MergedLineup, GrenadeFilter, SortMode } from './types';
import MyLineupsTab from './MyLineupsTab';
import CollectionsTab from './CollectionsTab';
import BrowseTab from './BrowseTab';

export default function MapDetailPage() {
  const params = useParams();
  const mapName = params.mapName as string;
  const user = useAuthStore((s) => s.user);

  const mapInfo = MAPS.find((m) => m.name === mapName);
  const mapColor = MAP_COLORS[mapName] || '#f0a500';

  /* ── Tab State ── */
  const [activeTab, setActiveTab] = useState<TabKey>('my-lineups');

  /* ── Tab 1: My Lineups State ── */
  const [myLineups, setMyLineups] = useState<Lineup[]>([]);
  const [subscribedCollectionData, setSubscribedCollectionData] = useState<CollectionWithLineups[]>([]);
  const [myLineupsLoading, setMyLineupsLoading] = useState(true);
  const [myFilterGrenade, setMyFilterGrenade] = useState<GrenadeFilter>('all');
  const [mySearch, setMySearch] = useState('');
  const [mySelectedId, setMySelectedId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [hidingIds, setHidingIds] = useState<Set<string>>(new Set());
  const [unassigningIds, setUnassigningIds] = useState<Set<string>>(new Set());
  const [pendingDeleteLineup, setPendingDeleteLineup] = useState<MergedLineup | null>(null);

  /* ── Tab 2: Collections State ── */
  const [collections, setCollections] = useState<LineupCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());

  /* ── Tab 3: Browse State ── */
  const [presets, setPresets] = useState<Lineup[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseFilterGrenade, setBrowseFilterGrenade] = useState<GrenadeFilter>('all');
  const [browseSort, setBrowseSort] = useState<SortMode>('name');
  const [assigningIds, setAssigningIds] = useState<Set<string>>(new Set());

  /* ── Data Loading ── */
  const loadMyLineups = useCallback(async () => {
    setMyLineupsLoading(true);
    try {
      const [myData, allCollections] = await Promise.all([
        lineupsApi.getMy(mapName).catch(() => [] as Lineup[]),
        collectionsApi.getAllWithStatus(mapName).catch(() => [] as LineupCollection[]),
      ]);
      setMyLineups(myData);
      const subscribed = allCollections.filter((c) => c.isSubscribed);
      const collectionDetails = await Promise.all(
        subscribed.map((c) => collectionsApi.getByIdWithUserState(c.id).catch(() => null)),
      );
      setSubscribedCollectionData(collectionDetails.filter((d): d is CollectionWithLineups => d !== null));
    } catch {
      toast.error('Failed to load lineups');
    } finally {
      setMyLineupsLoading(false);
    }
  }, [mapName]);

  const loadCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const data = await collectionsApi.getAllWithStatus(mapName);
      setCollections(data);
    } catch {
      toast.error('Failed to load collections');
    } finally {
      setCollectionsLoading(false);
    }
  }, [mapName]);

  const loadBrowse = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const [presetsData, myData] = await Promise.all([
        lineupsApi.getPresets(mapName).catch(() => [] as Lineup[]),
        lineupsApi.getMy(mapName).catch(() => [] as Lineup[]),
      ]);
      setPresets(presetsData);
      setAssignedIds(new Set(myData.map((l) => l.id)));
    } catch {
      toast.error('Failed to load presets');
    } finally {
      setBrowseLoading(false);
    }
  }, [mapName]);

  useEffect(() => {
    if (activeTab === 'my-lineups') loadMyLineups();
    else if (activeTab === 'collections') loadCollections();
    else if (activeTab === 'browse') loadBrowse();
  }, [activeTab, mapName, loadMyLineups, loadCollections, loadBrowse]);

  /* ── Tab 1: Merged lineup list ── */
  const mergedLineups = useMemo<MergedLineup[]>(() => {
    const result: MergedLineup[] = [];
    const addedIds = new Set<string>();

    // Build set of all visible collection lineup IDs so we can prioritise collection source
    const collectionLineupIds = new Set<string>();
    for (const colData of subscribedCollectionData) {
      const hiddenSet = new Set(colData.hiddenLineupIds);
      for (const lineup of colData.lineups) {
        if (!hiddenSet.has(lineup.id)) collectionLineupIds.add(lineup.id);
      }
    }

    for (const lineup of myLineups) {
      // If this lineup belongs to a subscribed collection, skip it here —
      // it will be added as 'collection' source in the next loop
      if (collectionLineupIds.has(lineup.id)) continue;
      if (lineup.collectionId) {
        // Individually assigned from a collection — show collection name but allow unassign
        result.push({
          ...lineup,
          source: 'added',
          sourceCollectionName: lineup.collectionName,
        });
      } else {
        const isCreator = user && lineup.creatorId === user.id;
        result.push({ ...lineup, source: isCreator ? 'created' : 'added' });
      }
      addedIds.add(lineup.id);
    }

    for (const colData of subscribedCollectionData) {
      const hiddenSet = new Set(colData.hiddenLineupIds);
      for (const lineup of colData.lineups) {
        if (addedIds.has(lineup.id) || hiddenSet.has(lineup.id)) continue;
        result.push({
          ...lineup,
          source: 'collection',
          sourceCollectionId: colData.collection.id,
          sourceCollectionName: lineup.collectionName || colData.collection.name,
        });
        addedIds.add(lineup.id);
      }
    }
    return result;
  }, [myLineups, subscribedCollectionData, user]);

  const myFilteredLineups = useMemo(() => {
    let result = mergedLineups;
    if (myFilterGrenade !== 'all') result = result.filter((l) => l.grenadeType === myFilterGrenade);
    if (mySearch.trim()) {
      const q = mySearch.toLowerCase().trim();
      result = result.filter((l) => l.name.toLowerCase().includes(q));
    }
    return result;
  }, [mergedLineups, myFilterGrenade, mySearch]);

  const mySelectedLineup = useMemo(
    () => mergedLineups.find((l) => l.id === mySelectedId) ?? null,
    [mergedLineups, mySelectedId],
  );

  /* ── Grenade stats for header ── */
  const grenadeStats = useMemo(() => {
    const counts: Record<string, number> = { smoke: 0, flash: 0, molotov: 0, he: 0 };
    mergedLineups.forEach((l) => { if (counts[l.grenadeType] !== undefined) counts[l.grenadeType]++; });
    return counts;
  }, [mergedLineups]);

  /* ── Tab 1: Actions ── */
  const handleDeleteLineup = useCallback((lineup: MergedLineup) => {
    setPendingDeleteLineup(lineup);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteLineup || deletingIds.has(pendingDeleteLineup.id)) return;
    const lineup = pendingDeleteLineup;
    setPendingDeleteLineup(null);
    setDeletingIds((prev) => new Set(prev).add(lineup.id));
    try {
      await lineupsApi.delete(lineup.id);
      setMyLineups((prev) => prev.filter((l) => l.id !== lineup.id));
      if (mySelectedId === lineup.id) setMySelectedId(null);
      toast.success(`Deleted: ${lineup.name}`);
    } catch {
      toast.error('Failed to delete lineup');
    } finally {
      setDeletingIds((prev) => { const next = new Set(prev); next.delete(lineup.id); return next; });
    }
  }, [pendingDeleteLineup, deletingIds, mySelectedId]);

  const handleToggleHide = useCallback(async (lineup: MergedLineup) => {
    if (!lineup.sourceCollectionId || hidingIds.has(lineup.id)) return;
    setHidingIds((prev) => new Set(prev).add(lineup.id));
    try {
      await collectionsApi.hideLineup(lineup.sourceCollectionId, lineup.id);
      setSubscribedCollectionData((prev) =>
        prev.map((cd) =>
          cd.collection.id === lineup.sourceCollectionId
            ? { ...cd, hiddenLineupIds: [...cd.hiddenLineupIds, lineup.id] }
            : cd,
        ),
      );
      if (mySelectedId === lineup.id) setMySelectedId(null);
      toast.success(`Hidden: ${lineup.name}`);
    } catch {
      toast.error('Failed to hide lineup');
    } finally {
      setHidingIds((prev) => { const next = new Set(prev); next.delete(lineup.id); return next; });
    }
  }, [hidingIds, mySelectedId]);

  const handleUnassign = useCallback(async (lineup: MergedLineup) => {
    if (unassigningIds.has(lineup.id)) return;
    setUnassigningIds((prev) => new Set(prev).add(lineup.id));
    try {
      await lineupsApi.unassign(lineup.id);
      setMyLineups((prev) => prev.filter((l) => l.id !== lineup.id));
      if (mySelectedId === lineup.id) setMySelectedId(null);
      toast.success(`Removed: ${lineup.name}`);
    } catch {
      toast.error('Failed to remove lineup');
    } finally {
      setUnassigningIds((prev) => { const next = new Set(prev); next.delete(lineup.id); return next; });
    }
  }, [unassigningIds, mySelectedId]);

  /* ── Tab 2: Subscribe/Unsubscribe ── */
  const handleToggleSubscription = useCallback(async (collection: LineupCollection) => {
    if (subscribingIds.has(collection.id)) return;
    setSubscribingIds((prev) => new Set(prev).add(collection.id));
    try {
      if (collection.isSubscribed) {
        await collectionsApi.unsubscribe(collection.id);
        setCollections((prev) => prev.map((c) => (c.id === collection.id ? { ...c, isSubscribed: false } : c)));
        toast.success(`Unsubscribed from ${collection.name}`);
      } else {
        await collectionsApi.subscribe(collection.id);
        setCollections((prev) => prev.map((c) => (c.id === collection.id ? { ...c, isSubscribed: true } : c)));
        toast.success(`Subscribed to ${collection.name}`);
      }
    } catch {
      toast.error('Failed to update subscription');
    } finally {
      setSubscribingIds((prev) => { const next = new Set(prev); next.delete(collection.id); return next; });
    }
  }, [subscribingIds]);

  /* ── Tab 3: Assign/Unassign ── */
  const handleToggleAssign = useCallback(async (lineup: Lineup, e: React.MouseEvent) => {
    e.stopPropagation();
    if (assigningIds.has(lineup.id)) return;
    setAssigningIds((prev) => new Set(prev).add(lineup.id));
    try {
      if (assignedIds.has(lineup.id)) {
        await lineupsApi.unassign(lineup.id);
        setAssignedIds((prev) => { const next = new Set(prev); next.delete(lineup.id); return next; });
        toast.success(`Removed: ${lineup.name}`);
      } else {
        await lineupsApi.assign(lineup.id);
        setAssignedIds((prev) => new Set(prev).add(lineup.id));
        toast.success(`Assigned: ${lineup.name}`);
      }
    } catch {
      toast.error('Failed to update assignment');
    } finally {
      setAssigningIds((prev) => { const next = new Set(prev); next.delete(lineup.id); return next; });
    }
  }, [assigningIds, assignedIds]);

  const handleMyRadarClick = useCallback((lineup: Lineup) => {
    setMySelectedId((prev) => (prev === lineup.id ? null : lineup.id));
  }, []);

  /* ── Tab counts ── */
  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'my-lineups', label: 'My Lineups', count: mergedLineups.length },
    { key: 'collections', label: 'Collections', count: collections.length },
    { key: 'browse', label: 'Browse', count: presets.length },
  ];

  return (
    <div>
      {/* Back Navigation */}
      <Link
        href="/dashboard/maps"
        className="inline-flex items-center gap-2 text-sm text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Maps
      </Link>

      {/* Map Banner */}
      <div className="relative h-48 rounded-2xl overflow-hidden mb-8">
        {mapInfo && (
          <Image
            src={mapInfo.screenshot}
            alt={mapInfo.displayName}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {mapInfo?.displayName ?? mapName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-[#a0a0b0]">{mergedLineups.length} Lineups</span>
            {Object.entries(grenadeStats).map(([type, count]) => {
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center gap-1">
                  <GrenadeIcon type={type as 'smoke' | 'flash' | 'molotov' | 'he'} size={14} />
                  <span className="text-xs text-[#a0a0b0]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(to right, ${mapColor}, transparent)` }}
        />
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#2a2a3e]/50">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'text-[#e8e8e8]' : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-[#f0a500]/70' : 'text-[#6b6b8a]/60'}`}>
                ({tab.count})
              </span>
            )}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: mapColor }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'my-lineups' && (
          <motion.div key="my-lineups" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <MyLineupsTab
              mapName={mapName}
              loading={myLineupsLoading}
              lineups={myFilteredLineups}
              allLineups={mergedLineups}
              filterGrenade={myFilterGrenade}
              setFilterGrenade={setMyFilterGrenade}
              search={mySearch}
              setSearch={setMySearch}
              selectedId={mySelectedId}
              setSelectedId={setMySelectedId}
              selectedLineup={mySelectedLineup}
              deletingIds={deletingIds}
              hidingIds={hidingIds}
              unassigningIds={unassigningIds}
              onDelete={handleDeleteLineup}
              onHide={handleToggleHide}
              onUnassign={handleUnassign}
              onRadarClick={handleMyRadarClick}
            />
          </motion.div>
        )}

        {activeTab === 'collections' && (
          <motion.div key="collections" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <CollectionsTab
              mapName={mapName}
              collections={collections}
              loading={collectionsLoading}
              subscribingIds={subscribingIds}
              onToggleSubscription={handleToggleSubscription}
            />
          </motion.div>
        )}

        {activeTab === 'browse' && (
          <motion.div key="browse" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <BrowseTab
              mapName={mapName}
              loading={browseLoading}
              presets={presets}
              filterGrenade={browseFilterGrenade}
              setFilterGrenade={setBrowseFilterGrenade}
              sort={browseSort}
              setSort={setBrowseSort}
              assignedIds={assignedIds}
              assigningIds={assigningIds}
              onToggleAssign={handleToggleAssign}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {pendingDeleteLineup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setPendingDeleteLineup(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="glass rounded-2xl p-6 w-full max-w-md mx-4 border border-[#2a2a3e]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#ff4444]/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#ff4444]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#e8e8e8] mb-1">Delete Lineup</h3>
                  <p className="text-sm text-[#6b6b8a] leading-relaxed">
                    Are you sure you want to delete <span className="text-[#e8e8e8]/80 font-medium">{pendingDeleteLineup.name}</span>?
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setPendingDeleteLineup(null)}
                  className="flex-shrink-0 p-1 rounded-lg text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setPendingDeleteLineup(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a2e] border border-[#2a2a3e] text-[#e8e8e8] hover:bg-[#2a2a3e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#ff4444]/10 border border-[#ff4444]/30 text-[#ff4444] hover:bg-[#ff4444]/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
