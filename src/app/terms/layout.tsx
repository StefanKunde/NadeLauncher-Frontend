import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for NadePro, the CS2 grenade practice platform. Covers subscription, cancellation, user obligations, and legal information.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
