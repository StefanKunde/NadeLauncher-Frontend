'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Lock, ChevronDown, ChevronRight, Pencil, Trash2, Loader2, X, Calendar, Crown, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { LineupCollection } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import { useAuthStore } from '@/store/auth-store';

export type GrenadeFilter = 'all' | 'smoke' | 'flash' | 'molotov' | 'he';

export type SourceFilter =
  | { type: 'all' }
  | { type: 'collection'; collectionId: string; collectionName: string };

interface FilterSidebarProps {
  grenadeFilter: GrenadeFilter;
  onGrenadeFilterChange: (f: GrenadeFilter) => void;
  sourceFilter: SourceFilter;
  onSourceFilterChange: (f: SourceFilter) => void;
  proCollections: LineupCollection[];
  userCollections: LineupCollection[];
  communityCollections: LineupCollection[];
  crossMapMatches: LineupCollection[];
  currentMapName: string;
  onCreateCollection: () => void;
  onEditCollection: (c: LineupCollection) => void;
  onDeleteCollection: (c: LineupCollection) => void;
  creatingCollection: boolean;
}

const MAP_SHORT: Record<string, string> = {
  de_mirage: 'Mir.', de_inferno: 'Inf.', de_ancient: 'Anc.',
  de_nuke: 'Nuk.', de_anubis: 'Anu.', de_vertigo: 'Vert.', de_dust2: 'Dust2',
};

const GRENADES: { key: GrenadeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'smoke', label: 'Smoke' },
  { key: 'flash', label: 'Flash' },
  { key: 'he', label: 'HE' },
  { key: 'molotov', label: 'Molotov' },
];

function getProLabel(c: LineupCollection): string {
  const baseName = c.name.replace(/\s+—\s+.*$/, '');
  if (c.proCategory === 'meta_all') return 'All Pro Meta Nades';
  return baseName.replace('Pro ', 'Pro Meta ');
}

export default function FilterSidebar({
  grenadeFilter,
  onGrenadeFilterChange,
  sourceFilter,
  onSourceFilterChange,
  proCollections,
  userCollections,
  communityCollections,
  crossMapMatches,
  currentMapName,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  creatingCollection,
}: FilterSidebarProps) {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.isPremium ?? false;
  const router = useRouter();
  const [proExpanded, setProExpanded] = useState(true);
  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [archivesExpanded, setArchivesExpanded] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [archiveTeamsExpanded, setArchiveTeamsExpanded] = useState(false);
  const [communityExpanded, setCommunityExpanded] = useState(true);
  const [myExpanded, setMyExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const metaCollections = proCollections
    .filter((c) => c.proCategory === 'meta' || c.proCategory === 'meta_all')
    .sort((a, b) => (a.proCategory === 'meta_all' ? -1 : b.proCategory === 'meta_all' ? 1 : 0));
  const archiveCollections = proCollections
    .filter((c) => c.proCategory === 'meta_archive' || c.proCategory === 'team_archive')
    .sort((a, b) => (b.timeWindow ?? '').localeCompare(a.timeWindow ?? ''));
  const archiveQuarters = [...new Set(archiveCollections.map((c) => c.timeWindow).filter(Boolean))]
    .sort((a, b) => b!.localeCompare(a!)) as string[];
  const activeQuarter = selectedQuarter ?? archiveQuarters[0] ?? null;
  const quarterMetaArchives = archiveCollections
    .filter((c) => c.proCategory === 'meta_archive' && c.timeWindow === activeQuarter)
    .sort((a, b) => (a.name.startsWith('Pro Nades') ? -1 : b.name.startsWith('Pro Nades') ? 1 : 0));
  const quarterTeamArchives = archiveCollections
    .filter((c) => c.proCategory === 'team_archive' && c.timeWindow === activeQuarter);
  const teamCollections = proCollections.filter((c) => c.proCategory === 'team');
  const eventCollections = proCollections.filter((c) => c.proCategory === 'event');
  const matchCollections = proCollections
    .filter((c) => c.proCategory === 'match')
    .sort((a, b) => (b.timeWindow ?? '').localeCompare(a.timeWindow ?? ''));

  const q = search.toLowerCase().trim();
  const filteredMeta = q ? metaCollections.filter((c) => getProLabel(c).toLowerCase().includes(q)) : metaCollections;
  const filteredQuarterMeta = q ? quarterMetaArchives.filter((c) => c.name.replace(/\s+—\s+.*$/, '').toLowerCase().includes(q)) : quarterMetaArchives;
  const filteredQuarterTeams = q ? quarterTeamArchives.filter((c) => c.name.replace(/\s+—\s+.*$/, '').toLowerCase().includes(q)) : quarterTeamArchives;
  const filteredTeams = q ? teamCollections.filter((c) => c.name.replace(/\s+—\s+.*$/, '').toLowerCase().includes(q)) : teamCollections;
  const filteredEvents = q ? eventCollections.filter((c) => c.name.replace(/\s+—\s+.*$/, '').toLowerCase().includes(q)) : eventCollections;
  const filteredMatches = q ? matchCollections.filter((c) => c.name.replace(/\s+—\s+.*$/, '').toLowerCase().includes(q)) : matchCollections;
  const filteredUser = q ? userCollections.filter((c) => c.name.toLowerCase().includes(q)) : userCollections;
  const filteredCommunity = q ? communityCollections.filter((c) => c.name.toLowerCase().includes(q)) : communityCollections;
  const filteredCrossMapMatches = q
    ? crossMapMatches.filter((c) => c.name.replace(/\s+—\s+.*$/, '').toLowerCase().includes(q))
    : crossMapMatches;

  // Group all matches (current map + cross-map) by event name
  const matchesByEvent = useMemo(() => {
    const allMatches = [...filteredMatches, ...filteredCrossMapMatches];
    const grouped = new Map<string, LineupCollection[]>();
    const ungrouped: LineupCollection[] = [];

    for (const m of allMatches) {
      const eventName = (m.metadata?.eventName as string) ?? null;
      if (eventName) {
        const list = grouped.get(eventName) ?? [];
        list.push(m);
        grouped.set(eventName, list);
      } else {
        ungrouped.push(m);
      }
    }

    // Sort matches within each event: latest first
    for (const list of grouped.values()) {
      list.sort((a, b) => (b.timeWindow ?? '').localeCompare(a.timeWindow ?? ''));
    }
    ungrouped.sort((a, b) => (b.timeWindow ?? '').localeCompare(a.timeWindow ?? ''));

    return { grouped, ungrouped };
  }, [filteredMatches, filteredCrossMapMatches]);

  const eventGroups = useMemo(() => {
    const eventCollByName = new Map<string, LineupCollection>();
    for (const c of filteredEvents) {
      const label = c.name.replace(/\s+—\s+.*$/, '');
      eventCollByName.set(label, c);
    }

    // Only create groups for events that have actual matches
    // (event-only groups with just "All Event Nades" are too cluttered)
    const allEventNames = new Set<string>([
      ...matchesByEvent.grouped.keys(),
    ]);

    const groups = [...allEventNames].map((eventName) => ({
      eventName,
      eventCollection: eventCollByName.get(eventName) ?? null,
      matches: matchesByEvent.grouped.get(eventName) ?? [],
    }));

    groups.sort((a, b) => {
      const aTime = a.matches[0]?.timeWindow ?? a.eventCollection?.timeWindow ?? '';
      const bTime = b.matches[0]?.timeWindow ?? b.eventCollection?.timeWindow ?? '';
      return bTime.localeCompare(aTime);
    });

    return groups;
  }, [filteredEvents, matchesByEvent]);

  const isSourceActive = (id: string) =>
    sourceFilter.type === 'collection' && sourceFilter.collectionId === id;

  const handleProClick = (c: LineupCollection, label: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: label });
  };

  const handleMatchClick = (c: LineupCollection) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    const matchLabel = c.name.replace(/\s+—\s+.*$/, '');
    if (c.mapName === currentMapName) {
      onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: matchLabel });
    } else {
      router.push(`/dashboard/maps/${c.mapName}?collection=${c.id}`);
    }
  };

  return (
    <>
      <div className="hidden lg:block w-64 shrink-0 space-y-5 overflow-y-auto max-h-[calc(100vh-5rem)] p-1 scrollbar-thin sticky top-4 self-start">
        {/* Search Collections */}
        <div className="flex items-center gap-2 rounded-lg border border-[#2a2a3e] bg-[#12121a] px-3 transition-colors focus-within:border-[#f0a500] focus-within:shadow-[0_0_0_3px_rgba(240,165,0,0.15)]">
          <Search className="h-4 w-4 shrink-0 text-[#6b6b8a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="w-full !border-none !bg-transparent !rounded-none !shadow-none !px-0 !py-2 text-sm text-[#e8e8e8] placeholder:text-[#6b6b8a] focus:!outline-none focus:!shadow-none focus:!border-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="shrink-0 text-[#6b6b8a] hover:text-[#e8e8e8]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Grenade Filter */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">Grenade</p>
          <div className="flex flex-wrap gap-1.5">
            {GRENADES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onGrenadeFilterChange(key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  grenadeFilter === key
                    ? 'bg-[#f0a500]/15 text-[#f0a500] border border-[#f0a500]/30'
                    : 'bg-[#12121a] text-[#6b6b8a] border border-[#2a2a3e]/50 hover:text-[#e8e8e8] hover:border-[#2a2a3e]'
                }`}
              >
                {key !== 'all' && <GrenadeIcon type={key} size={14} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* My Collections */}
        <div>
          <button
            onClick={() => setMyExpanded(!myExpanded)}
            className="mb-2 flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
          >
            {myExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            My Collections
          </button>
          <AnimatePresence>
            {myExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-0.5"
              >
                {filteredUser.map((c) => (
                  <div key={c.id} className="group/item relative">
                    <SourceButton
                      active={isSourceActive(c.id)}
                      onClick={() => onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: c.name })}
                      label={c.name}
                    />
                    {/* Count — hidden on hover, replaced by action buttons */}
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 group-hover/item:hidden`}>
                      {c.isPublished && (
                        <Users className="h-3 w-3 shrink-0 text-[#6c5ce7]" />
                      )}
                      <span className={`text-[10px] ${isSourceActive(c.id) ? 'text-[#f0a500]/70' : 'text-[#6b6b8a]'}`}>
                        {c.lineupCount}
                      </span>
                    </span>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/item:flex items-center gap-0.5">
                      {c.isPublished && (
                        <span title="Published to Community" className="p-1">
                          <Users className="h-3 w-3 shrink-0 text-[#6c5ce7]" />
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditCollection(c); }}
                        className="p-1 rounded text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e]"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteCollection(c); }}
                        className="p-1 rounded text-[#6b6b8a] hover:text-[#ff4444] hover:bg-[#ff4444]/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={onCreateCollection}
                  disabled={creatingCollection}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#6b6b8a] hover:text-[#f0a500] hover:bg-[#f0a500]/5 transition-colors disabled:opacity-50"
                >
                  {creatingCollection ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create Collection
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Community Collections */}
        {communityCollections.length > 0 && (
          <div>
            <button
              onClick={() => setCommunityExpanded(!communityExpanded)}
              className="mb-2 flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
            >
              {communityExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Users className="h-3 w-3" />
              Community
            </button>
            <AnimatePresence>
              {communityExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-1"
                >
                  {filteredCommunity.map((c) => (
                    <SourceButton
                      key={c.id}
                      active={isSourceActive(c.id)}
                      onClick={() => onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: c.name })}
                      label={c.name}
                      count={c.lineupCount}
                    />
                  ))}
                  <Link
                    href="/dashboard/community"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#6b6b8a] hover:text-[#6c5ce7] hover:bg-[#6c5ce7]/5 transition-colors"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Browse more...
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Pro Collections */}
        {proCollections.length > 0 && (
          <div>
            <button
              onClick={() => setProExpanded(!proExpanded)}
              className="mb-2 flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
            >
              {proExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Pro Collections
            </button>
            <AnimatePresence>
              {proExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {filteredMeta.map((c) => {
                    const label = getProLabel(c);
                    const grenadeType = c.proCategory === 'meta'
                      ? (c.name.toLowerCase().includes('smoke') ? 'smoke' as const
                        : c.name.toLowerCase().includes('flash') ? 'flash' as const
                        : c.name.toLowerCase().includes('he') ? 'he' as const
                        : c.name.toLowerCase().includes('molotov') ? 'molotov' as const
                        : undefined)
                      : undefined;
                    return (
                      <SourceButton
                        key={c.id}
                        active={isSourceActive(c.id)}
                        onClick={() => handleProClick(c, label)}
                        label={label}
                        count={c.lineupCount}
                        grenadeType={grenadeType}
                        locked={!isPremium}
                        badge={c.timeWindow === 'current' || c.timeWindow === 'all' ? 'Current' : undefined}
                      />
                    );
                  })}

                  {filteredTeams.length > 0 && (
                    <>
                      <div className="my-2 h-px bg-[#2a2a3e]/50" />
                      <button
                        onClick={() => setTeamsExpanded(!teamsExpanded)}
                        className="mb-1 flex w-full items-center gap-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]/70 hover:text-[#e8e8e8] transition-colors"
                      >
                        {teamsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Teams (Current Meta)
                      </button>
                      <AnimatePresence>
                        {teamsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden space-y-0.5"
                          >
                            {filteredTeams.map((c) => {
                              const label = c.name.replace(/\s+—\s+.*$/, '');
                              return (
                                <SourceButton
                                  key={c.id}
                                  active={isSourceActive(c.id)}
                                  onClick={() => handleProClick(c, label)}
                                  label={label}
                                  count={c.lineupCount}
                                  locked={!isPremium}
                                  logoUrl={c.coverImage}
                                />
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Event & Match Collections */}
        {(eventGroups.length > 0 || matchesByEvent.ungrouped.length > 0) && (
          <div>
            <button
              onClick={() => setEventsExpanded(!eventsExpanded)}
              className="mb-2 flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
            >
              {eventsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Calendar className="h-3 w-3" />
              Events
            </button>
            <AnimatePresence>
              {eventsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-1"
                >
                  {eventGroups.map((group) => {
                    const { eventName, eventCollection, matches } = group;
                    const isEventExpanded = expandedEvents.has(eventName);
                    const toggleEvent = () => {
                      setExpandedEvents((prev) => {
                        const next = new Set(prev);
                        if (next.has(eventName)) next.delete(eventName);
                        else next.add(eventName);
                        return next;
                      });
                    };
                    const dateBadge = eventCollection?.timeWindow?.includes('/')
                      ? eventCollection.timeWindow.split('/').map((d) => d.slice(5)).join(' – ')
                      : undefined;
                    return (
                      <div key={eventName}>
                        <button
                          onClick={toggleEvent}
                          className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#6b6b8a]/80 hover:text-[#e8e8e8] transition-colors"
                        >
                          {isEventExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                          <span className="truncate flex-1 text-left">{eventName}</span>
                          {dateBadge && (
                            <span className="shrink-0 text-[9px] font-normal text-[#6b6b8a]/50">{dateBadge}</span>
                          )}
                        </button>
                        <AnimatePresence>
                          {isEventExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden pl-4 space-y-0.5"
                            >
                              {eventCollection && (
                                <SourceButton
                                  active={isSourceActive(eventCollection.id)}
                                  onClick={() => handleProClick(eventCollection, eventName)}
                                  label="All Event Nades"
                                  count={eventCollection.lineupCount}
                                  locked={!isPremium}
                                />
                              )}
                              {matches.map((c) => (
                                <MatchButton
                                  key={c.id}
                                  collection={c}
                                  active={isSourceActive(c.id)}
                                  onClick={() => handleMatchClick(c)}
                                  locked={!isPremium}
                                  isCrossMap={c.mapName !== currentMapName}
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {matchesByEvent.ungrouped.length > 0 && (
                    <>
                      <div className="my-1.5 h-px bg-[#2a2a3e]/50" />
                      <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]/70 mb-0.5">
                        Other Matches
                      </p>
                      {matchesByEvent.ungrouped.map((c) => (
                        <MatchButton
                          key={c.id}
                          collection={c}
                          active={isSourceActive(c.id)}
                          onClick={() => handleMatchClick(c)}
                          locked={!isPremium}
                          isCrossMap={c.mapName !== currentMapName}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Archives */}
        {archiveQuarters.length > 0 && (
          <div>
            <button
              onClick={() => setArchivesExpanded(!archivesExpanded)}
              className="mb-2 flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
            >
              {archivesExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Archives
            </button>
            <AnimatePresence>
              {archivesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {/* Quarter selector */}
                  <select
                    value={activeQuarter ?? ''}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="w-full rounded-lg border border-[#2a2a3e] bg-[#12121a] px-2.5 py-1.5 text-xs text-[#b8b8cc] focus:outline-none focus:border-[#f0a500]/40 mb-1"
                  >
                    {archiveQuarters.map((qtr) => (
                      <option key={qtr} value={qtr}>{qtr}</option>
                    ))}
                  </select>

                  {/* Meta archives for selected quarter */}
                  {filteredQuarterMeta.map((c) => {
                    const label = c.name.replace(/\s+—\s+.*$/, '');
                    const grenadeType = !label.startsWith('Pro Nades')
                      ? (label.toLowerCase().includes('smoke') ? 'smoke' as const
                        : label.toLowerCase().includes('flash') ? 'flash' as const
                        : label.toLowerCase().includes('he') ? 'he' as const
                        : label.toLowerCase().includes('molotov') ? 'molotov' as const
                        : undefined)
                      : undefined;
                    return (
                      <SourceButton
                        key={c.id}
                        active={isSourceActive(c.id)}
                        onClick={() => handleProClick(c, label)}
                        label={label.replace(` ${activeQuarter}`, '')}
                        count={c.lineupCount}
                        locked={!isPremium}
                        grenadeType={grenadeType}
                      />
                    );
                  })}

                  {/* Team archives for selected quarter */}
                  {filteredQuarterTeams.length > 0 && (
                    <>
                      <button
                        onClick={() => setArchiveTeamsExpanded(!archiveTeamsExpanded)}
                        className="mt-1 mb-0.5 flex w-full items-center gap-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]/70 hover:text-[#e8e8e8] transition-colors"
                      >
                        {archiveTeamsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Teams
                      </button>
                      <AnimatePresence>
                        {archiveTeamsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden space-y-0.5"
                          >
                            {filteredQuarterTeams.map((c) => {
                              const label = c.name.replace(/\s+—\s+.*$/, '');
                              return (
                                <SourceButton
                                  key={c.id}
                                  active={isSourceActive(c.id)}
                                  onClick={() => handleProClick(c, label)}
                                  label={label.replace(` ${activeQuarter}`, '')}
                                  count={c.lineupCount}
                                  locked={!isPremium}
                                  logoUrl={c.coverImage}
                                />
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-80 rounded-xl border border-[#2a2a3e] bg-[#12121a] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0a500]/10">
                  <Crown className="h-5 w-5 text-[#f0a500]" />
                </div>
                <h3 className="text-base font-semibold text-[#e8e8e8]">Premium Feature</h3>
              </div>
              <p className="mb-5 text-sm text-[#6b6b8a]">
                Pro collections are curated from professional CS2 matches and require a premium subscription to access.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 rounded-lg border border-[#2a2a3e] px-3 py-2 text-sm text-[#b8b8cc] hover:bg-[#1a1a2e] transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/dashboard/premium"
                  className="flex-1 rounded-lg bg-[#f0a500] px-3 py-2 text-center text-sm font-semibold text-[#0a0a0f] hover:bg-[#ffd700] transition-colors"
                >
                  Upgrade
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SourceButton({
  active,
  onClick,
  label,
  count,
  locked,
  grenadeType,
  logoUrl,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  locked?: boolean;
  grenadeType?: 'smoke' | 'flash' | 'molotov' | 'he';
  logoUrl?: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20'
          : locked
            ? 'text-[#6b6b8a]/50 border border-transparent cursor-not-allowed hover:bg-[#1a1a2e]/50'
            : 'text-[#b8b8cc] border border-transparent hover:bg-[#1a1a2e] hover:text-[#e8e8e8]'
      }`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className={`h-4 w-4 shrink-0 object-contain ${locked ? 'opacity-40 grayscale' : ''}`}
        />
      ) : grenadeType ? (
        <GrenadeIcon type={grenadeType} size={14} />
      ) : null}
      {locked && !logoUrl && !grenadeType && <Lock className="h-3 w-3 text-[#6b6b8a]/50" />}
      <span className="truncate flex-1 text-left">{label}</span>
      {badge && (
        <span className="shrink-0 rounded bg-[#f0a500]/10 px-1 py-0.5 text-[9px] font-semibold text-[#f0a500]/70">{badge}</span>
      )}
      {locked && <Lock className="h-2.5 w-2.5 shrink-0 text-[#6b6b8a]/40" />}
      {count !== undefined && !locked && (
        <span className={`text-[10px] ${active ? 'text-[#f0a500]/70' : 'text-[#6b6b8a]'}`}>{count}</span>
      )}
    </button>
  );
}

function MatchButton({
  collection,
  active,
  onClick,
  locked,
  isCrossMap,
}: {
  collection: LineupCollection;
  active: boolean;
  onClick: () => void;
  locked?: boolean;
  isCrossMap?: boolean;
}) {
  const matchLabel = collection.name.replace(/\s+—\s+.*$/, '');
  const team1Logo = collection.metadata?.team1Logo as string | undefined;
  const team2Logo = collection.metadata?.team2Logo as string | undefined;
  const score = collection.metadata?.score as string | undefined;
  const mapShort = isCrossMap
    ? (MAP_SHORT[collection.mapName] ?? collection.mapName.replace('de_', ''))
    : undefined;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        active
          ? 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20'
          : locked
            ? 'text-[#6b6b8a]/50 border border-transparent cursor-not-allowed hover:bg-[#1a1a2e]/50'
            : 'text-[#b8b8cc] border border-transparent hover:bg-[#1a1a2e] hover:text-[#e8e8e8]'
      }`}
    >
      {team1Logo ? (
        <img src={team1Logo} alt="" className={`h-3.5 w-3.5 shrink-0 object-contain ${locked ? 'opacity-40 grayscale' : ''}`} />
      ) : (
        <span className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate flex-1 text-left">{matchLabel}</span>
      {team2Logo ? (
        <img src={team2Logo} alt="" className={`h-3.5 w-3.5 shrink-0 object-contain ${locked ? 'opacity-40 grayscale' : ''}`} />
      ) : (
        <span className="h-3.5 w-3.5 shrink-0" />
      )}
      {score && (
        <span className={`shrink-0 font-mono text-[9px] ${active ? 'text-[#f0a500]/60' : 'text-[#6b6b8a]'}`}>{score}</span>
      )}
      {mapShort && (
        <span className="shrink-0 rounded bg-[#2a2a3e] px-1 py-0.5 text-[8px] font-semibold text-[#6b6b8a]">{mapShort}</span>
      )}
      {locked && <Lock className="h-2.5 w-2.5 shrink-0 text-[#6b6b8a]/40" />}
    </button>
  );
}
