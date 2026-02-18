'use client';

import { useState } from 'react';
import { Plus, Check, Loader2, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lineup, LineupCollection } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import { GRENADE_TYPES, THROW_TYPES } from '@/lib/constants';
import { staggerContainer, staggerItem } from './types';

interface NadeListProps {
  lineups: Lineup[];
  selectedLineupId: string | null;
  onSelectLineup: (lineup: Lineup) => void;
  userCollections: LineupCollection[];
  addingToCollection: string | null;
  onAddToCollection: (lineupId: string, collectionId: string) => void;
  onRemoveFromCollection: (lineupId: string, collectionId: string) => void;
  userCollectionLineupIds: Map<string, Set<string>>;
  currentCollectionId?: string;
  isCurrentCollectionOwned: boolean;
}

export default function NadeList({
  lineups,
  selectedLineupId,
  onSelectLineup,
  userCollections,
  addingToCollection,
  onAddToCollection,
  onRemoveFromCollection,
  userCollectionLineupIds,
  currentCollectionId,
  isCurrentCollectionOwned,
}: NadeListProps) {
  if (lineups.length === 0) {
    return (
      <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] px-6 py-14 text-center">
        <p className="text-sm font-medium text-[#6b6b8a]">No nades in this collection yet</p>
        <p className="mt-1.5 text-xs text-[#6b6b8a]/60">
          Browse Pro Collections or create your own lineup in-game
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-1.5"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      key={lineups.length}
    >
      <AnimatePresence mode="popLayout">
        {lineups.map((lineup) => (
          <NadeListItem
            key={lineup.id}
            lineup={lineup}
            isActive={selectedLineupId === lineup.id}
            onSelect={() => onSelectLineup(lineup)}
            userCollections={userCollections}
            addingToCollection={addingToCollection}
            onAddToCollection={onAddToCollection}
            onRemoveFromCollection={onRemoveFromCollection}
            userCollectionLineupIds={userCollectionLineupIds}
            currentCollectionId={currentCollectionId}
            isCurrentCollectionOwned={isCurrentCollectionOwned}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function NadeListItem({
  lineup,
  isActive,
  onSelect,
  userCollections,
  addingToCollection,
  onAddToCollection,
  onRemoveFromCollection,
  userCollectionLineupIds,
  currentCollectionId,
  isCurrentCollectionOwned,
}: {
  lineup: Lineup;
  isActive: boolean;
  onSelect: () => void;
  userCollections: LineupCollection[];
  addingToCollection: string | null;
  onAddToCollection: (lineupId: string, collectionId: string) => void;
  onRemoveFromCollection: (lineupId: string, collectionId: string) => void;
  userCollectionLineupIds: Map<string, Set<string>>;
  currentCollectionId?: string;
  isCurrentCollectionOwned: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const grenadeColor = GRENADE_TYPES[lineup.grenadeType as keyof typeof GRENADE_TYPES]?.color ?? '#f0a500';
  const throwTypeLabel = lineup.throwType && lineup.throwType !== 'normal'
    ? (THROW_TYPES[lineup.throwType as keyof typeof THROW_TYPES] ?? null)
    : null;
  const proLine = [lineup.playerName, lineup.teamName].filter(Boolean).join(' \u00b7 ');

  return (
    <motion.div
      variants={staggerItem}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
      className={`flex items-center gap-3 rounded-lg cursor-pointer transition-all duration-150 group overflow-hidden ${
        isActive
          ? 'border border-transparent'
          : 'border border-transparent hover:bg-[#1a1a2e]'
      }`}
      style={{
        borderLeftWidth: isActive ? 4 : 3,
        borderLeftColor: isActive ? grenadeColor : `${grenadeColor}40`,
        backgroundColor: isActive ? `${grenadeColor}12` : undefined,
      }}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-3">
        <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={20} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${isActive ? 'text-[#e8e8e8]' : 'text-[#b8b8cc]'}`}>
              {lineup.name}
            </span>
            {throwTypeLabel && (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${grenadeColor}18`, color: grenadeColor }}
              >
                {throwTypeLabel}
              </span>
            )}
          </div>
          {proLine ? (
            <span className="text-[10px] text-[#6b6b8a] truncate block mt-0.5">{proLine}</span>
          ) : lineup.collectionName ? (
            <span className="text-[10px] text-[#6b6b8a] truncate block mt-0.5">{lineup.collectionName}</span>
          ) : null}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 pr-2 shrink-0">
        {/* Remove from current collection button (only for user-owned collections) */}
        {isCurrentCollectionOwned && currentCollectionId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromCollection(lineup.id, currentCollectionId);
            }}
            className="p-1.5 rounded text-[#6b6b8a] opacity-0 group-hover:opacity-100 hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-all shrink-0"
            title="Remove from collection"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Add to collection button */}
        {userCollections.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded text-[#6b6b8a] opacity-0 group-hover:opacity-100 hover:text-[#f0a500] hover:bg-[#f0a500]/10 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#2a2a3e] bg-[#12121a] py-1 shadow-xl shadow-black/40">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]">Add to collection</p>
                  {userCollections.map((c) => {
                    const alreadyIn = userCollectionLineupIds.get(c.id)?.has(lineup.id) ?? false;
                    const isAdding = addingToCollection === lineup.id;
                    return (
                      <button
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!alreadyIn && !isAdding) {
                            onAddToCollection(lineup.id, c.id);
                            setMenuOpen(false);
                          }
                        }}
                        disabled={alreadyIn || isAdding}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#b8b8cc] hover:bg-[#1a1a2e] hover:text-[#e8e8e8] disabled:opacity-50 disabled:cursor-default"
                      >
                        {alreadyIn ? (
                          <Check className="h-3 w-3 text-[#22c55e]" />
                        ) : isAdding ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
