'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { MAP_COORDINATES, worldToRadar } from '@/lib/map-coordinates';
import { GRENADE_TYPES } from '@/lib/constants';
import type { Lineup } from '@/lib/types';

interface MapRadarProps {
  mapName: string;
  lineups: Lineup[];
  selectedLineupId?: string | null;
  onLineupClick?: (lineup: Lineup) => void;
  /** Compact mode for overview cards */
  mini?: boolean;
}

const GRENADE_COLORS: Record<string, string> = {
  smoke: GRENADE_TYPES.smoke.color,
  flash: GRENADE_TYPES.flash.color,
  molotov: GRENADE_TYPES.molotov.color,
  he: GRENADE_TYPES.he.color,
};

export default function MapRadar({
  mapName,
  lineups,
  selectedLineupId,
  onLineupClick,
  mini = false,
}: MapRadarProps) {
  const config = MAP_COORDINATES[mapName];
  const hasLayers = !!config?.lowerRadarImage;
  const [showLower, setShowLower] = useState(false);

  const radarImage = useMemo(() => {
    if (!config) return null;
    return showLower && config.lowerRadarImage
      ? config.lowerRadarImage
      : config.radarImage;
  }, [config, showLower]);

  const markers = useMemo(() => {
    if (!config) return [];
    return lineups
      .filter((l) => {
        if (!hasLayers || !config.zSplitThreshold) return true;
        const z = l.throwPosition.z;
        return showLower
          ? z < config.zSplitThreshold
          : z >= config.zSplitThreshold;
      })
      .map((l) => {
        const throwPos = worldToRadar(l.throwPosition.x, l.throwPosition.y, config);
        const landingPos = worldToRadar(l.landingPosition.x, l.landingPosition.y, config);
        return { lineup: l, throwPos, landingPos };
      });
  }, [lineups, config, showLower, hasLayers]);

  if (!config) {
    return (
      <div className="aspect-square bg-[#0a0a0f] rounded-xl flex items-center justify-center text-[#666]">
        No radar available
      </div>
    );
  }

  const selectedMarker = markers.find((m) => m.lineup.id === selectedLineupId);
  const dotSize = mini ? 6 : 10;
  const selectedDotSize = mini ? 8 : 16;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#0a0a0f]">
      {/* Radar image */}
      <Image
        src={radarImage!}
        alt={`${mapName} radar`}
        fill
        className="object-contain"
        unoptimized
        draggable={false}
      />

      {/* SVG overlay for throw→landing lines */}
      {!mini && selectedMarker && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <line
            x1={`${selectedMarker.throwPos.x}%`}
            y1={`${selectedMarker.throwPos.y}%`}
            x2={`${selectedMarker.landingPos.x}%`}
            y2={`${selectedMarker.landingPos.y}%`}
            stroke={GRENADE_COLORS[selectedMarker.lineup.grenadeType] || '#fff'}
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.7"
          />
          {/* Landing position marker */}
          <circle
            cx={`${selectedMarker.landingPos.x}%`}
            cy={`${selectedMarker.landingPos.y}%`}
            r="6"
            fill="none"
            stroke={GRENADE_COLORS[selectedMarker.lineup.grenadeType] || '#fff'}
            strokeWidth="2"
            opacity="0.8"
          />
          <line
            x1={`${selectedMarker.landingPos.x - 0.6}%`}
            y1={`${selectedMarker.landingPos.y}%`}
            x2={`${selectedMarker.landingPos.x + 0.6}%`}
            y2={`${selectedMarker.landingPos.y}%`}
            stroke={GRENADE_COLORS[selectedMarker.lineup.grenadeType] || '#fff'}
            strokeWidth="2"
            opacity="0.8"
          />
          <line
            x1={`${selectedMarker.landingPos.x}%`}
            y1={`${selectedMarker.landingPos.y - 0.6}%`}
            x2={`${selectedMarker.landingPos.x}%`}
            y2={`${selectedMarker.landingPos.y + 0.6}%`}
            stroke={GRENADE_COLORS[selectedMarker.lineup.grenadeType] || '#fff'}
            strokeWidth="2"
            opacity="0.8"
          />
        </svg>
      )}

      {/* Lineup markers */}
      {markers.map(({ lineup, throwPos }) => {
        const isSelected = lineup.id === selectedLineupId;
        const color = GRENADE_COLORS[lineup.grenadeType] || '#fff';
        const size = isSelected ? selectedDotSize : dotSize;

        return (
          <div
            key={lineup.id}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
              !mini ? 'cursor-pointer hover:scale-125' : ''
            } ${isSelected ? 'ring-2 ring-white/50' : ''}`}
            style={{
              left: `${throwPos.x}%`,
              top: `${throwPos.y}%`,
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: isSelected
                ? `0 0 12px ${color}, 0 0 24px ${color}40`
                : `0 0 4px ${color}80`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!mini && onLineupClick) onLineupClick(lineup);
            }}
            title={!mini ? lineup.name : undefined}
          />
        );
      })}

      {/* Selected lineup label */}
      {!mini && selectedMarker && (
        <div
          className="absolute z-30 -translate-x-1/2 pointer-events-none"
          style={{
            left: `${selectedMarker.throwPos.x}%`,
            top: `${selectedMarker.throwPos.y - 2.5}%`,
          }}
        >
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0a0a0f]/90 text-white whitespace-nowrap border border-[#2a2a3e]">
            {selectedMarker.lineup.name}
          </span>
        </div>
      )}

      {/* Nuke layer toggle */}
      {hasLayers && !mini && (
        <div className="absolute top-2 right-2 z-30 flex gap-1">
          <button
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              !showLower
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
            onClick={() => setShowLower(false)}
          >
            Upper
          </button>
          <button
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              showLower
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
            onClick={() => setShowLower(true)}
          >
            Lower
          </button>
        </div>
      )}
    </div>
  );
}
