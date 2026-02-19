import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how NadePro handles your personal data. GDPR-compliant privacy policy covering Steam authentication, payment processing, and data retention.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
