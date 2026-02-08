'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
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

    for (const lineup of myLineups) {
      const isCreator = user && lineup.creatorId === user.id;
      result.push({ ...lineup, source: isCreator ? 'created' : 'added' });
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
  const handleDeleteLineup = useCallback(async (lineup: MergedLineup) => {
    if (deletingIds.has(lineup.id)) return;
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
  }, [deletingIds, mySelectedId]);

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
    </div>
  );
}
