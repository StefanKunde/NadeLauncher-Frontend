import type { Lineup } from '@/lib/types';

export type TabKey = 'my-lineups' | 'collections' | 'browse';
export type SortMode = 'name' | 'newest';
export type GrenadeFilter = 'all' | 'smoke' | 'flash' | 'molotov' | 'he';

export interface MergedLineup extends Lineup {
  source: 'created' | 'collection' | 'added';
  sourceCollectionId?: string;
  sourceCollectionName?: string;
  isHidden?: boolean;
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};
