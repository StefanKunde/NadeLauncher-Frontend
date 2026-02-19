import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { CookieConsent } from "@/components/ui/CookieConsent";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nadepro.gg';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NadePro — CS2 Grenade Practice Tool",
    template: "%s | NadePro",
  },
  description:
    "Master every smoke, flash, molotov and HE grenade in Counter-Strike 2. Practice lineups, save positions, and dominate every map.",
  keywords: [
    "CS2",
    "Counter-Strike 2",
    "grenade",
    "lineup",
    "practice",
    "smoke",
    "flash",
    "molotov",
    "CS2 lineups",
    "CS2 practice tool",
    "grenade practice",
    "CS2 utility",
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'NadePro',
    title: 'NadePro — CS2 Grenade Practice Tool',
    description: 'Master every smoke, flash, molotov and HE grenade in Counter-Strike 2. Practice lineups, save positions, and dominate every map.',
    url: SITE_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NadePro — CS2 Grenade Practice Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NadePro — CS2 Grenade Practice Tool',
    description: 'Master every smoke, flash, molotov and HE grenade in Counter-Strike 2. Practice lineups, save positions, and dominate every map.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const isDev = process.env.NEXT_PUBLIC_API_URL?.includes('localhost');

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'NadePro',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        'The ultimate CS2 grenade practice platform. Master every lineup, dominate every map.',
    },
    {
      '@type': 'WebApplication',
      name: 'NadePro',
      url: SITE_URL,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description:
        'Master every smoke, flash, molotov and HE grenade in Counter-Strike 2. Practice lineups, save positions, and dominate every map.',
      offers: [
        {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          name: 'Free Plan',
          description:
            '1 collection per map, 30 min weekly practice time, community lineups, 3D markers & ghost replay',
        },
        {
          '@type': 'Offer',
          price: '4.99',
          priceCurrency: 'EUR',
          name: 'Pro Plan',
          description:
            'Unlimited collections & practice time, curated pro lineups from real Tier-1 matches',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '4.99',
            priceCurrency: 'EUR',
            billingDuration: 'P1M',
          },
        },
      ],
      featureList: [
        'Interactive 2D radar maps for all Active Duty CS2 maps',
        'On-demand private practice server',
        '3D in-game markers and teleportation',
        'Ghost replay guidance system',
        'Community lineup collections',
        'Curated pro lineups from Tier-1 matches',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is there a practice time limit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Free users get 30 minutes of practice time per week. Pro users get unlimited practice time.',
          },
        },
        {
          '@type': 'Question',
          name: 'What payment methods do you accept?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I cancel anytime?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, cancel anytime from the subscription portal. You keep premium access until the end of your billing period.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I keep my lineups if I downgrade?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Your lineups are kept, but collections beyond the free limit are not accessible until you upgrade again.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0a0a0f] text-[#e8e8e8] antialiased">
        {isDev && (
          <div className="fixed top-0 left-0 z-[9999] bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-br-md opacity-80">
            DEV
          </div>
        )}
        {children}
        <CookieConsent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              color: "#e8e8e8",
              border: "1px solid #2a2a3e",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
