import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'NadePro cookie policy. We use only strictly necessary cookies for authentication. No tracking or marketing cookies.',
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
