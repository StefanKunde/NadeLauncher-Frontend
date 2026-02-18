'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { MAP_COORDINATES, worldToRadar } from '@/lib/map-coordinates';
import { GRENADE_TYPES, THROW_TYPES } from '@/lib/constants';
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

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.15;

type Marker = { lineup: Lineup; throwPos: { x: number; y: number }; landingPos: { x: number; y: number } };
type MarkerGroup = { key: string; pos: { x: number; y: number }; items: Marker[] };

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

  // Zoom & pan state (only for non-mini mode)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Popup state for stacked markers
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

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

  // Group markers by position (round to 0.5% to cluster near-identical positions)
  const groupedMarkers = useMemo<MarkerGroup[]>(() => {
    const groups = new Map<string, Marker[]>();
    for (const m of markers) {
      const kx = Math.round(m.throwPos.x * 2) / 2;
      const ky = Math.round(m.throwPos.y * 2) / 2;
      const key = `${kx},${ky}`;
      const group = groups.get(key);
      if (group) group.push(m);
      else groups.set(key, [m]);
    }
    return [...groups.entries()].map(([key, items]) => ({
      key,
      pos: items[0].throwPos,
      items,
    }));
  }, [markers]);

  // Close popup when lineups change (filter/collection switch)
  useEffect(() => { setOpenGroupKey(null); }, [lineups]);

  // Attach wheel listener as non-passive so preventDefault stops page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mini) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [mini]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mini) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  }, [mini, zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  if (!config) {
    return (
      <div className="aspect-square bg-[#0a0a0f] rounded-xl flex items-center justify-center text-[#666]">
        No radar available
      </div>
    );
  }

  const selectedMarker = markers.find((m) => m.lineup.id === selectedLineupId);
  const dotSize = mini ? 5 : 7;
  const selectedDotSize = mini ? 7 : 12;
  const isZoomed = zoom !== 1;

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square w-full overflow-hidden rounded-xl bg-[#0a0a0f] ${
        !mini ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      onMouseDown={(e) => {
        // Close popup when clicking the map background
        if (!mini) setOpenGroupKey(null);
        handleMouseDown(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoomable content wrapper */}
      <div
        className="absolute inset-0 origin-center"
        style={
          !mini
            ? {
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
              }
            : undefined
        }
      >
        {/* Radar image */}
        <Image
          src={radarImage!}
          alt={`${mapName} radar`}
          fill
          className="object-contain"
          unoptimized
          draggable={false}
        />

        {/* SVG overlay for throw->landing lines */}
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

        {/* Lineup markers (grouped) */}
        {groupedMarkers.map((group) => {
          const hasSelected = group.items.some((m) => m.lineup.id === selectedLineupId);
          const isStacked = group.items.length > 1;
          const isPopupOpen = openGroupKey === group.key;

          if (!isStacked) {
            // Single marker — render exactly as before
            const { lineup, throwPos } = group.items[0];
            const isSelected = lineup.id === selectedLineupId;
            const color = GRENADE_COLORS[lineup.grenadeType] || '#fff';
            const size = isSelected ? selectedDotSize : dotSize;

            return (
              <div
                key={group.key}
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
          }

          // Stacked marker — show dot with count badge + popup on click
          const selectedInGroup = hasSelected
            ? group.items.find((m) => m.lineup.id === selectedLineupId)!
            : null;
          const primaryColor = selectedInGroup
            ? GRENADE_COLORS[selectedInGroup.lineup.grenadeType] || '#fff'
            : GRENADE_COLORS[group.items[0].lineup.grenadeType] || '#fff';
          // Check if group has mixed grenade types
          const grenadeTypes = new Set(group.items.map((m) => m.lineup.grenadeType));
          const isMixed = grenadeTypes.size > 1;

          return (
            <div
              key={group.key}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${isPopupOpen ? 'z-[45]' : 'z-20'}`}
              style={{
                left: `${group.pos.x}%`,
                top: `${group.pos.y}%`,
              }}
            >
              {/* Selected nade rendered as individual marker on top */}
              {!mini && selectedInGroup && (
                <div
                  className="absolute z-[25] rounded-full ring-2 ring-white/50 transition-all duration-200"
                  style={{
                    width: selectedDotSize,
                    height: selectedDotSize,
                    backgroundColor: primaryColor,
                    boxShadow: `0 0 12px ${primaryColor}, 0 0 24px ${primaryColor}40`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}

              {/* Group dot */}
              <div
                className={`rounded-full transition-all duration-200 ${
                  !mini ? 'cursor-pointer hover:scale-125' : ''
                }`}
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: isMixed && !hasSelected ? '#aaa' : primaryColor,
                  boxShadow: hasSelected
                    ? `0 0 12px ${primaryColor}, 0 0 24px ${primaryColor}40`
                    : `0 0 4px ${primaryColor}80`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mini) return;
                  setOpenGroupKey(isPopupOpen ? null : group.key);
                }}
              />

              {/* Count badge */}
              {!mini && (
                <div
                  className="absolute pointer-events-none flex items-center justify-center rounded-full bg-white text-[#0a0a0f] font-bold"
                  style={{
                    width: 11,
                    height: 11,
                    fontSize: 7,
                    lineHeight: 1,
                    top: -dotSize / 2 - 6,
                    left: dotSize / 2 - 3,
                  }}
                >
                  {group.items.length}
                </div>
              )}

              {/* Popup selector */}
              {!mini && isPopupOpen && (
                <div
                  className="absolute z-[50] min-w-[180px] max-w-[240px] rounded-lg border border-[#2a2a3e] bg-[#12121a]/95 shadow-xl backdrop-blur-sm"
                  style={{
                    // Open downward by default, upward if near bottom
                    ...(group.pos.y > 70
                      ? { bottom: dotSize / 2 + 8, left: '50%', transform: 'translateX(-50%)' }
                      : { top: dotSize / 2 + 8, left: '50%', transform: 'translateX(-50%)' }),
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1.5 border-b border-[#2a2a3e]/50">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b8a]">
                      {group.items.length} lineups at this position
                    </span>
                  </div>
                  <div className="py-1 max-h-[200px] overflow-y-auto">
                    {group.items.map(({ lineup }) => {
                      const color = GRENADE_COLORS[lineup.grenadeType] || '#fff';
                      const isSelected = lineup.id === selectedLineupId;
                      const throwLabel = THROW_TYPES[lineup.throwType as keyof typeof THROW_TYPES] ?? '';
                      return (
                        <button
                          key={lineup.id}
                          title={lineup.name}
                          className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-white/5 ${
                            isSelected ? 'bg-white/10' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onLineupClick) onLineupClick(lineup);
                            setOpenGroupKey(null);
                          }}
                        >
                          <span
                            className="flex-shrink-0 h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="flex-1 truncate text-[11px] text-white/90">
                            {lineup.name}
                          </span>
                          {throwLabel && (
                            <span className="flex-shrink-0 text-[9px] text-[#6b6b8a]">
                              {throwLabel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Selected lineup label */}
        {!mini && selectedMarker && (() => {
          const dx = selectedMarker.landingPos.x - selectedMarker.throwPos.x;
          const dy = selectedMarker.landingPos.y - selectedMarker.throwPos.y;

          const offsetDistance = 4;
          const length = Math.sqrt(dx * dx + dy * dy) || 1;
          const offsetX = -(dx / length) * offsetDistance;
          const offsetY = -(dy / length) * offsetDistance;

          let labelX = selectedMarker.throwPos.x + offsetX;
          let labelY = selectedMarker.throwPos.y + offsetY;

          labelX = Math.max(8, Math.min(92, labelX));
          labelY = Math.max(3, Math.min(97, labelY));

          return (
            <div
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${labelX}%`,
                top: `${labelY}%`,
              }}
            >
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0a0a0f]/90 text-white whitespace-nowrap border border-[#2a2a3e]">
                {selectedMarker.lineup.name}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Zoom controls (outside the zoomable wrapper so they stay fixed) */}
      {!mini && (
        <div className="absolute bottom-2 left-2 z-40 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center h-7 w-7 rounded bg-[#0a0a0f]/80 text-white/70 hover:text-white hover:bg-[#0a0a0f] border border-[#2a2a3e]/50 transition-colors"
            title="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center h-7 w-7 rounded bg-[#0a0a0f]/80 text-white/70 hover:text-white hover:bg-[#0a0a0f] border border-[#2a2a3e]/50 transition-colors"
            title="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          {isZoomed && (
            <button
              onClick={handleResetZoom}
              className="flex items-center justify-center h-7 w-7 rounded bg-[#0a0a0f]/80 text-white/70 hover:text-white hover:bg-[#0a0a0f] border border-[#2a2a3e]/50 transition-colors"
              title="Reset zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Nuke layer toggle */}
      {hasLayers && !mini && (
        <div className="absolute top-2 right-2 z-40 flex gap-1">
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
