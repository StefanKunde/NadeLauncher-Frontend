'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const LAST_UPDATED = '2026-02-19';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      {/* Top bar */}
      <div className="border-b border-[#2a2a3e]/60 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to NadePro
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#e8e8e8] mb-2">Cookie Policy</h1>
        <p className="text-[#6b6b8a] text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-[#b8b8cc] text-sm leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#e8e8e8] [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#e8e8e8] [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3 [&_a]:text-[#f0a500] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#ffd700]">

          {/* 1 */}
          <section>
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device (computer, tablet, or phone)
              when you visit a website. They are widely used to make websites work, improve efficiency,
              and provide information to site owners. We also use similar technologies such as local
              storage for the same purposes.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2>2. Legal Basis</h2>
            <p>
              Our use of cookies is governed by:
            </p>
            <ul>
              <li>
                <strong>Section 25(2) TDDDG</strong> (German Telecommunications Digital Services Data Protection Act):
                Strictly necessary cookies may be used without consent.
              </li>
              <li>
                <strong>Section 25(1) TDDDG:</strong> Non-essential cookies require your prior consent.
              </li>
              <li>
                <strong>Art. 6(1)(f) GDPR:</strong> Where applicable, our legitimate interest in ensuring
                the functionality and security of the Service.
              </li>
            </ul>
            <p>
              NadePro currently uses <strong>only strictly necessary cookies</strong>. We do not use
              analytics, tracking, or marketing cookies. Therefore, no cookie consent banner is required.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2>3. Cookies We Use</h2>
            <p>
              The following table lists all cookies and similar storage mechanisms used by NadePro:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mb-3">
                <thead>
                  <tr className="border-b border-[#2a2a3e] text-left">
                    <th className="py-2 pr-4 text-[#e8e8e8] font-semibold">Name</th>
                    <th className="py-2 pr-4 text-[#e8e8e8] font-semibold">Provider</th>
                    <th className="py-2 pr-4 text-[#e8e8e8] font-semibold">Purpose</th>
                    <th className="py-2 pr-4 text-[#e8e8e8] font-semibold">Duration</th>
                    <th className="py-2 text-[#e8e8e8] font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-[#2a2a3e]/40">
                  <tr>
                    <td className="font-mono text-xs">connect.sid</td>
                    <td>NadePro</td>
                    <td>User authentication session</td>
                    <td>Session / 24 hours</td>
                    <td>Strictly necessary</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-xs">nl_referral</td>
                    <td>NadePro</td>
                    <td>Stores referral code for attribution</td>
                    <td>Session (localStorage)</td>
                    <td>Strictly necessary</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              We do not use any third-party cookies. No analytics, advertising, or social media cookies are set.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2>4. Third-Party Services</h2>
            <p>
              When you make a payment, you interact with Stripe&apos;s checkout interface. Stripe may set
              its own cookies on their domain during the payment process. These cookies are governed by{' '}
              <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer">
                Stripe&apos;s Cookie Policy
              </a>.
              NadePro does not control these cookies.
            </p>
            <p>
              When you log in via Steam, you interact with Steam&apos;s login page. Steam may use its own
              cookies on their domain. These cookies are governed by{' '}
              <a href="https://store.steampowered.com/privacy_agreement/" target="_blank" rel="noopener noreferrer">
                Steam&apos;s Privacy Policy
              </a>.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2>5. Managing Cookies</h2>
            <p>
              You can control and delete cookies through your browser settings. Note that disabling
              cookies may prevent you from logging in or using certain features of NadePro.
            </p>
            <p>Instructions for common browsers:</p>
            <ul>
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/en-us/105082" target="_blank" rel="noopener noreferrer">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2>6. Changes to This Policy</h2>
            <p>
              If we start using additional cookies (e.g., analytics), we will update this policy and,
              where required by law, obtain your consent before setting non-essential cookies.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2>7. Contact</h2>
            <p>
              If you have questions about our use of cookies, please contact us at [YOUR EMAIL ADDRESS].
            </p>
            <p>
              For more information about how we handle personal data, see our{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </section>

          {/* Valve disclaimer */}
          <section className="border-t border-[#2a2a3e] pt-8">
            <p className="text-[#6b6b8a] text-xs">
              NadePro is not affiliated with, endorsed by, or associated with Valve Corporation.
              Counter-Strike 2, CS2, and Steam are trademarks of Valve Corporation.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
