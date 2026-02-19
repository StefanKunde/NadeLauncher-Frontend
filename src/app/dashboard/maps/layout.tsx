import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maps',
  description:
    'Practice CS2 grenade lineups on all Active Duty maps. Interactive radar, 3D markers, teleport, and ghost replay for Dust II, Mirage, Inferno, Nuke, Overpass, Ancient, and Anubis.',
};

export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
