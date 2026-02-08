'use client';

import { Check, Plus, Loader2, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LineupCollection } from '@/lib/types';
import { staggerContainer, fadeIn } from './types';

interface CollectionsTabProps {
  collections: LineupCollection[];
  loading: boolean;
  subscribingIds: Set<string>;
  onToggleSubscription: (collection: LineupCollection) => void;
}

export default function CollectionsTab({
  collections,
  loading,
  subscribingIds,
  onToggleSubscription,
}: CollectionsTabProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-5">
            <div className="h-5 w-40 bg-[#1a1a2e] rounded animate-pulse mb-3" />
            <div className="h-3 w-full bg-[#1a1a2e] rounded animate-pulse mb-2" />
            <div className="h-3 w-2/3 bg-[#1a1a2e] rounded animate-pulse mb-4" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[#1a1a2e] rounded animate-pulse" />
              <div className="h-8 w-28 bg-[#1a1a2e] rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
        <FolderOpen className="w-12 h-12 text-[#6b6b8a]/40 mx-auto mb-4" />
        <p className="text-[#6b6b8a] text-lg">No collections available for this map</p>
        <p className="text-[#6b6b8a]/60 text-sm mt-1">Collections will appear here when they are created.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {collections.map((collection) => {
        const isSubscribing = subscribingIds.has(collection.id);

        return (
          <motion.div
            key={collection.id}
            variants={fadeIn}
            className="glass rounded-xl p-5 group transition-colors hover:border-[#3a3a5e]"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#e8e8e8] truncate">{collection.name}</h3>
                  {collection.isDefault && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0a500]/15 text-[#f0a500] flex-shrink-0">
                      DEFAULT
                    </span>
                  )}
                </div>
                {collection.description && (
                  <p className="text-sm text-[#6b6b8a] line-clamp-2">{collection.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2a3e]/50">
              <span className="text-xs text-[#6b6b8a]">
                {collection.lineupCount} {collection.lineupCount === 1 ? 'lineup' : 'lineups'}
              </span>

              <button
                onClick={() => onToggleSubscription(collection)}
                disabled={isSubscribing}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  collection.isSubscribed
                    ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/20'
                    : 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/30 hover:bg-[#f0a500]/20'
                }`}
              >
                {isSubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : collection.isSubscribed ? (
                  <>
                    <Check className="w-4 h-4" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Subscribe
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
