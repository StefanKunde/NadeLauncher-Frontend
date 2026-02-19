'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const CONSENT_KEY = 'nadepro_cookie_consent';

type ConsentState = {
  necessary: true; // always true, can't be disabled
  analytics: boolean;
  version: number;
};

const CONSENT_VERSION = 1;

function getStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeConsent(consent: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  const accept = (analytics: boolean) => {
    storeConsent({ necessary: true, analytics, version: CONSENT_VERSION });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="max-w-2xl mx-auto glass rounded-xl border border-[#2a2a3e] shadow-2xl shadow-black/50 p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-[#f0a500]/10 flex items-center justify-center mt-0.5">
            <Cookie className="w-5 h-5 text-[#f0a500]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#e8e8e8]">Cookie Notice</h3>
              <button
                onClick={() => accept(false)}
                className="text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors p-1 -m-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[#9595b0] text-xs leading-relaxed mb-4">
              We use strictly necessary cookies to keep you logged in and make the site work.
              We do not use tracking or marketing cookies. Learn more in our{' '}
              <Link href="/cookies" className="text-[#f0a500] hover:text-[#ffd700] underline underline-offset-2">
                Cookie Policy
              </Link>.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => accept(true)}
                className="btn-primary text-xs px-4 py-2 font-semibold"
              >
                Accept All
              </button>
              <button
                onClick={() => accept(false)}
                className="btn-secondary text-xs px-4 py-2 font-semibold"
              >
                Necessary Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
