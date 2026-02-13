'use client';

import { useState } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lineup, LineupCollection } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import { staggerContainer, staggerItem } from './types';

interface NadeListProps {
  lineups: Lineup[];
  selectedLineupId: string | null;
  onSelectLineup: (lineup: Lineup) => void;
  userCollections: LineupCollection[];
  addingToCollection: string | null;
  onAddToCollection: (lineupId: string, collectionId: string) => void;
  userCollectionLineupIds: Map<string, Set<string>>;
}

export default function NadeList({
  lineups,
  selectedLineupId,
  onSelectLineup,
  userCollections,
  addingToCollection,
  onAddToCollection,
  userCollectionLineupIds,
}: NadeListProps) {
  if (lineups.length === 0) {
    return (
      <div className="rounded-lg border border-[#2a2a3e]/50 bg-[#12121a] px-6 py-12 text-center text-sm text-[#6b6b8a]">
        No nades found
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-1"
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
            userCollectionLineupIds={userCollectionLineupIds}
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
  userCollectionLineupIds,
}: {
  lineup: Lineup;
  isActive: boolean;
  onSelect: () => void;
  userCollections: LineupCollection[];
  addingToCollection: string | null;
  onAddToCollection: (lineupId: string, collectionId: string) => void;
  userCollectionLineupIds: Map<string, Set<string>>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      variants={staggerItem}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 group border ${
        isActive
          ? 'bg-[#f0a500]/10 border-[#f0a500]/30'
          : 'bg-[#12121a]/60 border-transparent hover:bg-[#1a1a2e] hover:border-[#2a2a3e]'
      }`}
      onClick={onSelect}
    >
      <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={18} />

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium truncate block ${isActive ? 'text-[#e8e8e8]' : 'text-[#b8b8cc]'}`}>
          {lineup.name}
        </span>
        {lineup.collectionName && (
          <span className="text-[10px] text-[#6b6b8a] truncate block">{lineup.collectionName}</span>
        )}
      </div>

      {/* Add to collection button */}
      {userCollections.length > 0 && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded text-[#6b6b8a] opacity-0 group-hover:opacity-100 hover:text-[#f0a500] hover:bg-[#f0a500]/10 transition-all"
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
    </motion.div>
  );
}
