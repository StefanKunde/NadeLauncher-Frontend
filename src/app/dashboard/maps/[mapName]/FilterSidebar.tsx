'use client';

import { useState } from 'react';
import { Search, Plus, Lock, ChevronDown, ChevronRight, Pencil, Trash2, Loader2, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LineupCollection } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import { GRENADE_TYPES } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';

export type GrenadeFilter = 'all' | 'smoke' | 'flash' | 'molotov' | 'he';

export type SourceFilter =
  | { type: 'all' }
  | { type: 'my-nades' }
  | { type: 'collection'; collectionId: string; collectionName: string };

interface FilterSidebarProps {
  grenadeFilter: GrenadeFilter;
  onGrenadeFilterChange: (f: GrenadeFilter) => void;
  sourceFilter: SourceFilter;
  onSourceFilterChange: (f: SourceFilter) => void;
  search: string;
  onSearchChange: (s: string) => void;
  // Collections
  proCollections: LineupCollection[];
  userCollections: LineupCollection[];
  // User collection actions
  onCreateCollection: () => void;
  onEditCollection: (c: LineupCollection) => void;
  onDeleteCollection: (c: LineupCollection) => void;
  creatingCollection: boolean;
}

const GRENADES: { key: GrenadeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'smoke', label: 'Smoke' },
  { key: 'flash', label: 'Flash' },
  { key: 'he', label: 'HE' },
  { key: 'molotov', label: 'Molotov' },
];

export default function FilterSidebar({
  grenadeFilter,
  onGrenadeFilterChange,
  sourceFilter,
  onSourceFilterChange,
  search,
  onSearchChange,
  proCollections,
  userCollections,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  creatingCollection,
}: FilterSidebarProps) {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.isPremium ?? false;
  const [proExpanded, setProExpanded] = useState(true);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [myExpanded, setMyExpanded] = useState(true);

  const metaCollections = proCollections.filter((c) => c.proCategory === 'meta' || c.proCategory === 'meta_all');
  const teamCollections = proCollections.filter((c) => c.proCategory === 'team');
  const eventCollections = proCollections.filter((c) => c.proCategory === 'event');

  const isSourceActive = (type: string, id?: string) => {
    if (sourceFilter.type === type && type !== 'collection') return true;
    if (sourceFilter.type === 'collection' && type === 'collection' && id && sourceFilter.collectionId === id) return true;
    return false;
  };

  return (
    <div className="w-64 shrink-0 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1 scrollbar-thin">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b8a]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search nades..."
          className="w-full rounded-lg border border-[#2a2a3e] bg-[#12121a] py-2 pl-9 pr-8 text-sm text-[#e8e8e8] placeholder:text-[#6b6b8a] focus:border-[#f0a500]/50 focus:outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b6b8a] hover:text-[#e8e8e8]"
          >
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

      {/* Source Filter */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">Source</p>
        <div className="space-y-0.5">
          <SourceButton
            active={isSourceActive('all')}
            onClick={() => onSourceFilterChange({ type: 'all' })}
            label="All Nades"
          />
          <SourceButton
            active={isSourceActive('my-nades')}
            onClick={() => onSourceFilterChange({ type: 'my-nades' })}
            label="My Nades"
          />
        </div>
      </div>

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
                {/* Meta collections */}
                {metaCollections.map((c) => (
                  <SourceButton
                    key={c.id}
                    active={isSourceActive('collection', c.id)}
                    onClick={() => onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: c.name })}
                    label={c.name.replace(/^Pro\s+(Nades|Smokes|Flashes|HEs|Molotovs)\s+—\s+/, '')}
                    count={c.lineupCount}
                    grenadeType={c.proCategory === 'meta' ? (c.name.toLowerCase().includes('smoke') ? 'smoke' : c.name.toLowerCase().includes('flash') ? 'flash' : c.name.toLowerCase().includes('he') ? 'he' : c.name.toLowerCase().includes('molotov') ? 'molotov' : undefined) : undefined}
                  />
                ))}

                {/* Team collections */}
                {teamCollections.length > 0 && (
                  <>
                    <div className="my-2 h-px bg-[#2a2a3e]/50" />
                    <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]/70">Teams</p>
                    {teamCollections.map((c) => (
                      <SourceButton
                        key={c.id}
                        active={isSourceActive('collection', c.id)}
                        onClick={() => {
                          if (!isPremium) return;
                          onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: c.name });
                        }}
                        label={c.name.replace(/\s+—\s+.*$/, '')}
                        count={c.lineupCount}
                        locked={!isPremium}
                        logoUrl={c.coverImage}
                      />
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Event Collections */}
      {eventCollections.length > 0 && (
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
                className="overflow-hidden space-y-0.5"
              >
                {eventCollections.map((c) => (
                  <SourceButton
                    key={c.id}
                    active={isSourceActive('collection', c.id)}
                    onClick={() => onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: c.name })}
                    label={c.name.replace(/\s+—\s+.*$/, '')}
                    count={c.lineupCount}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
              {userCollections.map((c) => (
                <div key={c.id} className="group relative">
                  <SourceButton
                    active={isSourceActive('collection', c.id)}
                    onClick={() => onSourceFilterChange({ type: 'collection', collectionId: c.id, collectionName: c.name })}
                    label={c.name}
                    count={c.lineupCount}
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
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
    </div>
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
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  locked?: boolean;
  grenadeType?: 'smoke' | 'flash' | 'molotov' | 'he';
  logoUrl?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20'
          : locked
            ? 'text-[#6b6b8a]/50 border border-transparent cursor-not-allowed'
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
      {locked && !logoUrl && <Lock className="h-3 w-3 text-[#6b6b8a]/50" />}
      <span className="truncate flex-1 text-left">{label}</span>
      {locked && logoUrl && <Lock className="h-3 w-3 shrink-0 text-[#6b6b8a]/50" />}
      {count !== undefined && (
        <span className={`text-[10px] ${active ? 'text-[#f0a500]/70' : 'text-[#6b6b8a]'}`}>{count}</span>
      )}
    </button>
  );
}
