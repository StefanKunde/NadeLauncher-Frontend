import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Collections',
  description:
    'Browse and subscribe to community-created CS2 grenade lineup collections. Find the best smokes, flashes, molotovs, and HE grenades shared by other players.',
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
