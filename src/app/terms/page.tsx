'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const LAST_UPDATED = '2026-02-19';

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl md:text-4xl font-bold text-[#e8e8e8] mb-2">Terms of Service</h1>
        <p className="text-[#6b6b8a] text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-[#b8b8cc] text-sm leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#e8e8e8] [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#e8e8e8] [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_ol]:mb-3 [&_a]:text-[#f0a500] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#ffd700]">

          {/* 1 */}
          <section>
            <h2>1. Scope and Acceptance</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of NadePro, a CS2 grenade lineup
              practice platform, including the website, web application, and CS2 server plugin
              (collectively, the &quot;Service&quot;), operated by:
            </p>
            <p>
              [YOUR FULL NAME]<br />
              [YOUR STREET ADDRESS]<br />
              [YOUR POSTAL CODE AND CITY], Germany<br />
              Email: [YOUR EMAIL ADDRESS]
            </p>
            <p>
              By registering for or using the Service, you agree to these Terms. If you do not agree,
              do not use the Service.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2>2. Service Description</h2>
            <p>NadePro provides:</p>
            <ul>
              <li>A web-based lineup browser with interactive 2D radar maps for all Active Duty CS2 maps</li>
              <li>An on-demand private CS2 practice server with in-game markers, teleportation, and ghost replay</li>
              <li>Personal and community collections for organizing and sharing lineups</li>
              <li>Curated pro lineups extracted from professional CS2 matches (Pro plan)</li>
              <li>A CS2 server plugin that enables in-game practice features</li>
            </ul>
            <p>
              NadePro is <strong>not affiliated with, endorsed by, or associated with Valve Corporation</strong>.
              Counter-Strike 2, CS2, and Steam are trademarks of Valve Corporation. All game-related
              trademarks and content belong to their respective owners.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2>3. Account Registration</h2>
            <p>
              To use NadePro, you must log in via Steam (Valve Corporation). By logging in, you authorize
              us to access your public Steam profile information (Steam ID, display name, avatar).
            </p>
            <ul>
              <li>You must be at least 16 years old to use NadePro.</li>
              <li>You may create only one account.</li>
              <li>You are responsible for all activity under your account.</li>
              <li>You must not share your account or allow others to access it.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2>4. Free and Pro Plans</h2>

            <h3>4.1 Free Plan</h3>
            <p>The free plan includes access to core features with the following limits:</p>
            <ul>
              <li>1 collection per map (up to 20 lineups each)</li>
              <li>30 minutes of weekly practice time on private servers</li>
              <li>Access to community lineups, 3D markers, teleport, and ghost replay</li>
            </ul>

            <h3>4.2 Pro Plan</h3>
            <p>The Pro plan costs <strong>&euro;4.99 per month</strong> and includes:</p>
            <ul>
              <li>Unlimited collections and lineups</li>
              <li>Unlimited practice time</li>
              <li>Access to curated pro lineups from professional matches</li>
              <li>Ability to build custom collections from pro lineups</li>
            </ul>

            <h3>4.3 Billing</h3>
            <p>
              Pro subscriptions are billed monthly and renewed automatically. Payments are processed
              by <a href="https://stripe.com" target="_blank" rel="noopener noreferrer">Stripe, Inc.</a>{' '}
              We accept major credit and debit cards.
            </p>
            <p>
              We may change our prices with reasonable advance notice (at least 4 weeks). Continued
              use of the Pro plan after a price change constitutes acceptance of the new price.
            </p>
          </section>

          {/* 5 - Withdrawal */}
          <section>
            <h2>5. Right of Withdrawal (Widerrufsrecht)</h2>
            <p>
              If you are a consumer in the European Union, you have the right to withdraw from this
              contract within 14 days without giving any reason.
            </p>
            <p>
              The withdrawal period is 14 days from the date of contract conclusion (the date you
              subscribe to the Pro plan).
            </p>
            <p>
              To exercise your right of withdrawal, you must inform us of your decision by a clear
              statement (e.g., an email) to:
            </p>
            <p>
              [YOUR FULL NAME]<br />
              [YOUR EMAIL ADDRESS]
            </p>
            <p>
              You may use the model withdrawal form below, but it is not mandatory.
            </p>
            <p>
              If you withdraw, we will reimburse all payments received from you without undue delay
              and no later than 14 days from the day we receive your withdrawal notice. We will use
              the same payment method you used for the original transaction.
            </p>

            <h3>Early Performance and Loss of Withdrawal Right</h3>
            <p>
              By subscribing to the Pro plan, you expressly consent to the immediate commencement of
              the service before the withdrawal period has expired. You acknowledge that you lose your
              right of withdrawal once the service has been fully provided during the withdrawal period.
              If you withdraw before the service is fully provided, you will owe a proportional amount
              for the service already provided.
            </p>

            <h3>Model Withdrawal Form</h3>
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4 my-3">
              <p className="mb-2">To: [YOUR FULL NAME], [YOUR EMAIL ADDRESS]</p>
              <p className="mb-2">
                I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the
                provision of the following service: NadePro Pro subscription
              </p>
              <p className="mb-2">Ordered on (*) / received on (*):</p>
              <p className="mb-2">Name of consumer(s):</p>
              <p className="mb-2">Address of consumer(s):</p>
              <p className="mb-2">Date:</p>
              <p className="text-[#6b6b8a] text-xs">(*) Delete as appropriate.</p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2>6. Cancellation</h2>
            <p>
              You may cancel your Pro subscription at any time. Cancellation takes effect at the end
              of your current billing period. After cancellation:
            </p>
            <ul>
              <li>You retain Pro access until the end of the paid period.</li>
              <li>Your account reverts to the free plan.</li>
              <li>Your lineups and collections are retained, but collections exceeding the free limit become inaccessible until you re-subscribe.</li>
            </ul>
            <p>
              You can cancel through the subscription management portal accessible from your account
              settings, or by contacting us at [YOUR EMAIL ADDRESS].
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2>7. User Obligations</h2>
            <p>When using NadePro, you agree to:</p>
            <ul>
              <li>Use the Service only for its intended purpose (practicing CS2 grenade lineups).</li>
              <li>Comply with Valve&apos;s terms of service and CS2&apos;s rules.</li>
              <li>Not attempt to reverse engineer, decompile, or disassemble the Service or plugin.</li>
              <li>Not use automated tools to scrape, copy, or extract data from the Service.</li>
              <li>Not upload or share offensive, illegal, or infringing content.</li>
              <li>Not abuse, exploit, or interfere with the Service or its infrastructure.</li>
              <li>Not misuse the CS2 server plugin or attempt to gain unauthorized access.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2>8. User-Generated Content</h2>
            <p>
              You retain ownership of lineups and collections you create. By saving content to NadePro
              or sharing it with the community, you grant us a non-exclusive, worldwide license to store,
              display, and make that content available as part of the Service (e.g., in community collections).
            </p>
            <p>
              You can delete your content at any time. Shared content that has been subscribed to by other
              users may remain available to those subscribers. If you delete your account, all your content
              will be removed.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2>9. Intellectual Property</h2>
            <p>
              The NadePro platform, including its design, code, branding, and features, is owned by us
              and protected by applicable intellectual property laws. You receive a limited, non-exclusive,
              non-transferable license to use the Service for personal, non-commercial purposes.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or create derivative works based on the Service
              without our prior written consent.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2>10. Availability</h2>
            <p>
              We strive to keep NadePro available at all times but do not guarantee uninterrupted access.
              The Service may be temporarily unavailable due to maintenance, updates, or circumstances
              beyond our control (including Valve/Steam API outages, server issues, or force majeure events).
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2>11. Warranty and Digital Product Conformity</h2>
            <p>
              We provide the Service in accordance with the statutory requirements for digital products
              under Sections 327 et seq. BGB. The Service will conform to the agreed-upon and objectively
              expected quality standards.
            </p>
            <p>
              If you discover a defect, please contact us at [YOUR EMAIL ADDRESS]. We will remedy
              conformity issues in accordance with applicable law.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2>12. Limitation of Liability</h2>
            <p>Our liability is determined as follows:</p>
            <ul>
              <li>
                <strong>Unlimited liability:</strong> We are fully liable for damages caused by intent
                (Vorsatz) or gross negligence (grobe Fahrlässigkeit), for injury to life, body, or health,
                and for claims under mandatory statutory provisions including the German Product Liability Act
                (Produkthaftungsgesetz).
              </li>
              <li>
                <strong>Limited liability:</strong> In cases of slight negligence in the breach of material
                contractual obligations (Kardinalpflichten), our liability is limited to the foreseeable,
                contract-typical damages. Material contractual obligations are those whose fulfilment is
                essential for the proper performance of the contract.
              </li>
              <li>
                <strong>No liability:</strong> We are not liable for slight negligence in the breach of
                non-essential obligations.
              </li>
            </ul>
            <p>
              We are not liable for damages resulting from Valve/Steam platform changes, CS2 game updates,
              or third-party service outages that are beyond our control.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2>13. Data Protection</h2>
            <p>
              We process your personal data in accordance with our{' '}
              <Link href="/privacy">Privacy Policy</Link>. By using the Service, you acknowledge
              that your data will be processed as described therein.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2>14. Dispute Resolution</h2>
            <p>
              We are neither obligated nor willing to participate in dispute resolution proceedings
              before a consumer arbitration body (Verbraucherschlichtungsstelle) pursuant to the
              German Consumer Dispute Resolution Act (VSBG).
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2>15. Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Germany, excluding the
              UN Convention on Contracts for the International Sale of Goods (CISG).
            </p>
            <p>
              If you are a consumer residing in the EU, you additionally benefit from any mandatory
              provisions of the law of your country of residence. Nothing in these Terms affects your
              rights as a consumer under applicable mandatory consumer protection laws.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2>16. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining
              provisions shall remain in full force and effect.
            </p>
          </section>

          {/* 17 */}
          <section>
            <h2>17. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify registered users of material
              changes at least 4 weeks in advance via the website or email. Continued use of the Service
              after the notice period constitutes acceptance of the updated Terms. If you do not agree
              to the changes, you may terminate your account before the changes take effect.
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
