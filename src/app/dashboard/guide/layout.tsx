import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide — How to Use NadePro',
  description:
    'Learn how to use NadePro to practice CS2 grenade lineups. Setup guide, in-game commands, practice server features, and tips for mastering utility.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
