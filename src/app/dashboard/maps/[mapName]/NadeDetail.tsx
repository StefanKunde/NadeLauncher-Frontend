'use client';

import { motion } from 'framer-motion';
import type { Lineup } from '@/lib/types';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import { GRENADE_TYPES, THROW_TYPES } from '@/lib/constants';

interface NadeDetailProps {
  lineup: Lineup;
}

export default function NadeDetail({ lineup }: NadeDetailProps) {
  const grenadeColor = GRENADE_TYPES[lineup.grenadeType as keyof typeof GRENADE_TYPES]?.color ?? '#f0a500';

  const throwTypeLabel = THROW_TYPES[lineup.throwType as keyof typeof THROW_TYPES] ?? 'Normal';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="glass rounded-xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={24} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#e8e8e8] leading-tight">{lineup.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
              style={{ backgroundColor: `${grenadeColor}15`, color: grenadeColor }}
            >
              {throwTypeLabel}
            </span>
            {lineup.throwStrength && lineup.throwStrength !== 'full' && (
              <span className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] text-[#6b6b8a] capitalize">
                {lineup.throwStrength}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {lineup.description && (
        <p className="text-xs text-[#6b6b8a] leading-relaxed">{lineup.description}</p>
      )}

      {/* Instructions */}
      {lineup.instructions?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#f0a500]">Instructions</p>
          <ol className="space-y-1">
            {lineup.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#b8b8cc]">
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: `${grenadeColor}20`, color: grenadeColor }}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tags */}
      {lineup.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lineup.tags.map((tag) => (
            <span key={tag} className="rounded bg-[#f0a500]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#f0a500]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-[10px] text-[#6b6b8a] pt-1 border-t border-[#2a2a3e]/30">
        {lineup.collectionName && <span>{lineup.collectionName}</span>}
        {lineup.collectionName && lineup.createdAt && <span>·</span>}
        {lineup.createdAt && (
          <span>{new Date(lineup.createdAt).toLocaleDateString()}</span>
        )}
      </div>
    </motion.div>
  );
}
