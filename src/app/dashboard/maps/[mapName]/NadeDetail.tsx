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
  const proLine = [lineup.playerName, lineup.teamName].filter(Boolean).join(' \u00b7 ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden border border-[#2a2a3e]/50 bg-[#12121a]"
    >
      {/* Grenade-type colored top accent */}
      <div
        className="h-[3px]"
        style={{ background: `linear-gradient(to right, ${grenadeColor}, ${grenadeColor}60, transparent)` }}
      />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${grenadeColor}12`, border: `1px solid ${grenadeColor}15` }}
          >
            <GrenadeIcon type={lineup.grenadeType as 'smoke' | 'flash' | 'molotov' | 'he'} size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[#e8e8e8] leading-tight">{lineup.name}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize tracking-wide"
                style={{ backgroundColor: `${grenadeColor}15`, color: grenadeColor, border: `1px solid ${grenadeColor}10` }}
              >
                {throwTypeLabel}
              </span>
              {lineup.throwStrength && lineup.throwStrength !== 'full' && (
                <span className="rounded-md bg-[#1a1a2e] border border-[#2a2a3e]/30 px-1.5 py-0.5 text-[10px] text-[#6b6b8a] capitalize">
                  {lineup.throwStrength}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pro attribution */}
        {proLine && (
          <div
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
            style={{
              backgroundColor: `${grenadeColor}06`,
              border: `1px solid ${grenadeColor}12`,
            }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${grenadeColor}15`, color: grenadeColor }}
            >
              Pro
            </span>
            <span className="text-xs text-[#b8b8cc] font-medium">{proLine}</span>
          </div>
        )}

        {/* Description */}
        {lineup.description && (
          <p className="text-xs text-[#6b6b8a] leading-relaxed">{lineup.description}</p>
        )}

        {/* Instructions */}
        {lineup.instructions?.length > 0 && (
          <div className="rounded-lg bg-[#0a0a12] border border-[#2a2a3e]/25 p-3">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#f0a500]/80">
              Instructions
            </p>
            <ol className="space-y-2">
              {lineup.instructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-[#b8b8cc]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                    style={{ backgroundColor: `${grenadeColor}18`, color: grenadeColor, border: `1px solid ${grenadeColor}12` }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Tags */}
        {lineup.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lineup.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[#1a1a2e] border border-[#2a2a3e]/30 px-2 py-0.5 text-[10px] font-medium text-[#6b6b8a]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 text-[10px] text-[#6b6b8a]/70 pt-2 border-t border-[#2a2a3e]/20">
          {lineup.collectionName && <span>{lineup.collectionName}</span>}
          {lineup.collectionName && lineup.createdAt && <span>&middot;</span>}
          {lineup.createdAt && (
            <span>{new Date(lineup.createdAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
