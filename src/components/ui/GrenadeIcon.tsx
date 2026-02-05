'use client';

import Image from 'next/image';

const GRENADE_IMAGES: Record<string, string> = {
  smoke: '/images/grenades/smoke.png',
  flash: '/images/grenades/flash.png',
  he: '/images/grenades/he.png',
  molotov: '/images/grenades/molotov.png',
};

const GRENADE_COLORS: Record<string, string> = {
  smoke: '#88bbee',
  flash: '#ffee44',
  molotov: '#ff6633',
  he: '#ff4444',
};

interface GrenadeIconProps {
  type: 'smoke' | 'flash' | 'molotov' | 'he';
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function GrenadeIcon({ type, size = 32, className = '', glow = false }: GrenadeIconProps) {
  const color = GRENADE_COLORS[type];
  const src = GRENADE_IMAGES[type];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-lg opacity-40"
          style={{ backgroundColor: color }}
        />
      )}
      <Image
        src={src}
        alt={`${type} grenade`}
        width={size}
        height={size}
        className="relative z-10 object-contain drop-shadow-lg"
        unoptimized
      />
    </div>
  );
}
