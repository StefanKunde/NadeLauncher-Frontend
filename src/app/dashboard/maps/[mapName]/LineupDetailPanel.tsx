'use client';

import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { GRENADE_TYPES, THROW_TYPES } from '@/lib/constants';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';

export default function LineupDetailPanel({ lineup }: { lineup: Lineup }) {
  const grenadeInfo = GRENADE_TYPES[lineup.grenadeType as keyof typeof GRENADE_TYPES];

  return (
    <motion.div
      key={lineup.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="glass rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2.5">
        <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={24} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#e8e8e8] truncate">{lineup.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
              {THROW_TYPES[lineup.throwType as keyof typeof THROW_TYPES] ?? lineup.throwType}
            </span>
            {lineup.throwStrength && lineup.throwStrength !== 'full' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
                {lineup.throwStrength}
              </span>
            )}
          </div>
        </div>
      </div>

      {lineup.description && <p className="text-sm text-[#6b6b8a]">{lineup.description}</p>}

      {lineup.instructions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[#f0a500] uppercase tracking-wider mb-2">Instructions</h4>
          <ol className="space-y-1.5">
            {lineup.instructions.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{
                    backgroundColor: `${grenadeInfo?.color}20`,
                    color: grenadeInfo?.color,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-[#e8e8e8]/80">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {lineup.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lineup.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0a500]/10 text-[#f0a500]/70">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[#6b6b8a]/60 pt-2 border-t border-[#2a2a3e]/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate">By {lineup.creatorName || 'Unknown'}</span>
          {lineup.collectionName && (
            <>
              <span className="text-[#2a2a3e]">&middot;</span>
              <span className="text-[#3b82f6]/60 truncate">{lineup.collectionName}</span>
            </>
          )}
        </div>
        <span className="flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3 h-3" />
          {new Date(lineup.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </motion.div>
  );
}
