import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { CookieConsent } from "@/components/ui/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "NadePro — CS2 Grenade Practice Tool",
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
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

const isDev = process.env.NEXT_PUBLIC_API_URL?.includes('localhost');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
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
