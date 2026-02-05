import { create } from 'zustand';
import type { Lineup } from '@/lib/types';

interface LineupState {
  presets: Lineup[];
  assigned: Lineup[];
  selectedLineup: Lineup | null;
  setPresets: (lineups: Lineup[]) => void;
  setAssigned: (lineups: Lineup[]) => void;
  selectLineup: (lineup: Lineup | null) => void;
}

export const useLineupStore = create<LineupState>((set) => ({
  presets: [],
  assigned: [],
  selectedLineup: null,
  setPresets: (presets) => set({ presets }),
  setAssigned: (assigned) => set({ assigned }),
  selectLineup: (selectedLineup) => set({ selectedLineup }),
}));
