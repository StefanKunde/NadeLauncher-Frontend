'use client';

import { Flame, Eye, Crosshair } from 'lucide-react';

interface ImpactBadgeProps {
  totalDamage?: number;
  enemiesBlinded?: number;
  totalBlindDuration?: number;
  flashAssists?: number;
}

export default function ImpactBadge({ totalDamage, enemiesBlinded, totalBlindDuration, flashAssists }: ImpactBadgeProps) {
  const hasImpact = (totalDamage && totalDamage > 0) || (enemiesBlinded && enemiesBlinded > 0) || (flashAssists && flashAssists > 0);
  if (!hasImpact) return null;

  return (
    <div className="flex items-center gap-2">
      {totalDamage && totalDamage > 0 ? (
        <div className="flex items-center gap-1 rounded bg-[#ff4444]/10 px-1.5 py-0.5" title={`${totalDamage.toFixed(0)} HP damage`}>
          <Flame className="h-3 w-3 text-[#ff4444]" />
          <span className="text-[10px] font-bold text-[#ff4444]">{totalDamage.toFixed(0)}</span>
        </div>
      ) : null}
      {enemiesBlinded && enemiesBlinded > 0 ? (
        <div className="flex items-center gap-1 rounded bg-[#ffee44]/10 px-1.5 py-0.5" title={`${enemiesBlinded} blinded (${totalBlindDuration?.toFixed(1)}s)`}>
          <Eye className="h-3 w-3 text-[#ffee44]" />
          <span className="text-[10px] font-bold text-[#ffee44]">{enemiesBlinded}</span>
        </div>
      ) : null}
      {flashAssists && flashAssists > 0 ? (
        <div className="flex items-center gap-1 rounded bg-[#3b82f6]/10 px-1.5 py-0.5" title={`${flashAssists} flash assists`}>
          <Crosshair className="h-3 w-3 text-[#3b82f6]" />
          <span className="text-[10px] font-bold text-[#3b82f6]">{flashAssists}</span>
        </div>
      ) : null}
    </div>
  );
}
