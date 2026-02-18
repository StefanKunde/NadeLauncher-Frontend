'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Check, Loader2, Minus, ChevronRight, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lineup, LineupCollection } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import { GRENADE_TYPES } from '@/lib/constants';
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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1a2e] border border-[#2a2a3e]/30">
          <Plus className="h-5 w-5 text-[#6b6b8a]/60" />
        </div>
        <p className="text-sm font-medium text-[#6b6b8a]">No nades in this collection yet</p>
        <p className="mt-1.5 text-xs text-[#6b6b8a]/60 leading-relaxed">
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
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const grenadeColor = GRENADE_TYPES[lineup.grenadeType as keyof typeof GRENADE_TYPES]?.color ?? '#f0a500';

  // Scroll into view when selected (e.g. from map marker click)
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isActive]);
  const proLine = [lineup.playerName, lineup.teamName].filter(Boolean).join(' \u00b7 ');
  const hasGhostReplay = (lineup.movementPath?.length ?? 0) > 0;

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen && addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = userCollections.length * 36 + 40; // estimate
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setMenuPos({
        top: openAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuOpen(!menuOpen);
  }, [menuOpen, userCollections.length]);

  return (
    <motion.div
      ref={itemRef}
      variants={staggerItem}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
      className={`relative flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200 group overflow-hidden ${
        isActive
          ? 'border border-[#2a2a3e]/30'
          : 'border border-[#2a2a3e]/10 hover:border-[#2a2a3e]/30 hover:bg-[#1a1a2e]/60'
      }`}
      style={{
        borderLeftWidth: isActive ? 4 : 3,
        borderLeftColor: isActive ? grenadeColor : `${grenadeColor}30`,
        backgroundColor: isActive ? `${grenadeColor}10` : undefined,
      }}
      onClick={onSelect}
      title={lineup.name}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2.5">
        {/* Grenade icon with subtle background */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors duration-200"
          style={{
            backgroundColor: isActive ? `${grenadeColor}15` : `${grenadeColor}08`,
          }}
        >
          <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate transition-colors duration-200 ${isActive ? 'text-[#e8e8e8]' : 'text-[#b8b8cc] group-hover:text-[#e8e8e8]'}`}>
              {lineup.name}
            </span>
            {hasGhostReplay && (
              <span className="shrink-0 flex items-center gap-1 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#22c55e]">
                <Eye className="h-3 w-3" />
                Ghost
              </span>
            )}
          </div>
          {proLine ? (
            <span className="text-[10px] text-[#f0a500]/50 truncate block mt-0.5 font-medium">{proLine}</span>
          ) : lineup.collectionName ? (
            <span className="text-[10px] text-[#6b6b8a]/60 truncate block mt-0.5">{lineup.collectionName}</span>
          ) : null}
        </div>
      </div>

      {/* Active chevron indicator */}
      {isActive && (
        <ChevronRight
          className="h-3.5 w-3.5 mr-1 shrink-0"
          style={{ color: `${grenadeColor}60` }}
        />
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 pr-2 shrink-0">
        {/* Remove from current collection button (only for user-owned collections) */}
        {isCurrentCollectionOwned && currentCollectionId && (
          confirmRemove ? (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromCollection(lineup.id, currentCollectionId);
                  setConfirmRemove(false);
                }}
                className="p-1 rounded-lg text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
                title="Confirm remove"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmRemove(false);
                }}
                className="p-1 rounded-lg text-[#6b6b8a] hover:text-[#e8e8e8] hover:bg-[#1a1a2e] transition-colors"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmRemove(true);
              }}
              className="p-1.5 rounded-lg text-[#6b6b8a] opacity-0 group-hover:opacity-100 hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-all shrink-0"
              title="Remove from collection"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          )
        )}

        {/* Add to collection button */}
        {userCollections.length > 0 && (
          <div className="shrink-0">
            <button
              ref={addBtnRef}
              onClick={toggleMenu}
              className="p-1.5 rounded-lg text-[#6b6b8a] opacity-0 group-hover:opacity-100 hover:text-[#f0a500] hover:bg-[#f0a500]/10 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {menuOpen && menuPos && (
              <>
                <div className="fixed inset-0 z-[80]" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div
                  className="fixed z-[90] w-52 rounded-xl border border-[#2a2a3e] bg-[#12121a] py-1.5 shadow-xl shadow-black/50"
                  style={{ top: menuPos.top, right: menuPos.right }}
                >
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]/60">Add to collection</p>
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
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#b8b8cc] hover:bg-[#1a1a2e] hover:text-[#e8e8e8] disabled:opacity-50 disabled:cursor-default transition-colors rounded-lg mx-0"
                      >
                        {alreadyIn ? (
                          <Check className="h-3 w-3 text-[#22c55e]" />
                        ) : isAdding ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3 text-[#6b6b8a]" />
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
