import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pro Plan — Pricing',
  description:
    'Upgrade to NadePro Pro for unlimited collections, practice time, and curated pro lineups from real Tier-1 CS2 matches. Starting at \u20AC4.99/month.',
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
