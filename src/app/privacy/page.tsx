'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const LAST_UPDATED = '2026-02-19';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl md:text-4xl font-bold text-[#e8e8e8] mb-2">Privacy Policy</h1>
        <p className="text-[#6b6b8a] text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-[#b8b8cc] text-sm leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#e8e8e8] [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#e8e8e8] [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3 [&_a]:text-[#f0a500] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#ffd700]">

          {/* 1 */}
          <section>
            <h2>1. Controller and Contact</h2>
            <p>
              The controller responsible for data processing on this website within the meaning of the
              General Data Protection Regulation (GDPR / DSGVO) is:
            </p>
            <p>
              [YOUR FULL NAME]<br />
              [YOUR STREET ADDRESS]<br />
              [YOUR POSTAL CODE AND CITY], Germany<br />
              Email: [YOUR EMAIL ADDRESS]
            </p>
            <p>
              If you have any questions about data protection, please contact us at the email address above.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2>2. Overview</h2>
            <p>
              NadePro is a CS2 grenade lineup practice platform consisting of a web application and an in-game
              CS2 server plugin. When you use our service, we process personal data as described in this policy.
              We take the protection of your personal data seriously and treat it confidentially in accordance
              with applicable data protection laws and this privacy policy.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2>3. Data We Collect</h2>

            <h3>3.1 Steam Login Data</h3>
            <p>
              We use Steam (Valve Corporation) as our sole authentication provider. When you log in, we receive
              the following data from the Steam Web API:
            </p>
            <ul>
              <li>Steam ID (SteamID64)</li>
              <li>Steam display name</li>
              <li>Steam avatar URL</li>
              <li>Steam profile URL</li>
            </ul>
            <p>Legal basis: Art. 6(1)(b) GDPR — necessary for contract performance (account creation).</p>

            <h3>3.2 Account and Usage Data</h3>
            <p>When you use our service, we store:</p>
            <ul>
              <li>Your saved lineups, collections, and settings</li>
              <li>Subscription status and plan type</li>
              <li>Referral codes you create or use</li>
            </ul>
            <p>Legal basis: Art. 6(1)(b) GDPR — necessary for contract performance.</p>

            <h3>3.3 Payment Data</h3>
            <p>
              Payment processing is handled entirely by Stripe, Inc. We do not store your credit card details.
              We receive and store only:
            </p>
            <ul>
              <li>Stripe customer ID and subscription ID</li>
              <li>Payment status and billing cycle</li>
              <li>Subscription start and end dates</li>
            </ul>
            <p>
              Stripe processes your payment data as an independent controller for fraud prevention and as a
              data processor on our behalf for payment processing. See{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.
            </p>
            <p>Legal basis: Art. 6(1)(b) GDPR — necessary for contract performance.</p>

            <h3>3.4 CS2 Server Plugin Data</h3>
            <p>
              When you use the in-game practice plugin, the following data is processed:
            </p>
            <ul>
              <li>Your Steam ID (to identify your account)</li>
              <li>In-game position and angle data</li>
              <li>Commands you execute (e.g., !save, !savelast, !practice)</li>
              <li>Throw type and grenade trajectory data</li>
            </ul>
            <p>
              This data is transmitted to our servers to provide the practice functionality
              (saving lineups, ghost replays, teleporting).
            </p>
            <p>Legal basis: Art. 6(1)(b) GDPR — necessary for contract performance.</p>

            <h3>3.5 Server Log Files</h3>
            <p>
              When you access our website, our server automatically collects:
            </p>
            <ul>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Referrer URL</li>
              <li>Date and time of access</li>
            </ul>
            <p>
              This data is stored for a maximum of 14 days and is used solely for ensuring the security and
              stability of our service.
            </p>
            <p>Legal basis: Art. 6(1)(f) GDPR — our legitimate interest in service security and abuse prevention.</p>

            <h3>3.6 Cookies</h3>
            <p>
              We use strictly necessary cookies for authentication and session management.
              For details, see our <Link href="/cookies">Cookie Policy</Link>.
            </p>
            <p>Legal basis: Section 25(2) TDDDG — strictly necessary cookies do not require consent.</p>
          </section>

          {/* 4 */}
          <section>
            <h2>4. Purpose of Processing</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mb-3">
                <thead>
                  <tr className="border-b border-[#2a2a3e] text-left">
                    <th className="py-2 pr-4 text-[#e8e8e8] font-semibold">Purpose</th>
                    <th className="py-2 pr-4 text-[#e8e8e8] font-semibold">Data</th>
                    <th className="py-2 text-[#e8e8e8] font-semibold">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-[#2a2a3e]/40">
                  <tr><td>Account creation &amp; authentication</td><td>Steam ID, username, avatar</td><td>Art. 6(1)(b)</td></tr>
                  <tr><td>Providing the service</td><td>Lineups, collections, settings</td><td>Art. 6(1)(b)</td></tr>
                  <tr><td>Payment processing</td><td>Stripe IDs, billing data</td><td>Art. 6(1)(b)</td></tr>
                  <tr><td>In-game practice features</td><td>Position, angle, throw data</td><td>Art. 6(1)(b)</td></tr>
                  <tr><td>Service security</td><td>Server logs, IP address</td><td>Art. 6(1)(f)</td></tr>
                  <tr><td>Session management</td><td>Auth cookies</td><td>Sec. 25(2) TDDDG</td></tr>
                  <tr><td>Tax &amp; legal obligations</td><td>Billing records</td><td>Art. 6(1)(c)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2>5. Recipients of Your Data</h2>
            <p>We share your data with the following third parties only as necessary to provide our service:</p>

            <h3>Stripe, Inc.</h3>
            <p>
              Payment processing. Stripe acts as our data processor and as an independent controller for fraud prevention.
              Stripe participates in the EU-US Data Privacy Framework.
              See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.
            </p>

            <h3>Valve Corporation (Steam)</h3>
            <p>
              Authentication provider. We receive your public Steam profile data via the Steam Web API. Valve acts as
              an independent controller. See <a href="https://store.steampowered.com/privacy_agreement/" target="_blank" rel="noopener noreferrer">Steam&apos;s Privacy Policy</a>.
            </p>

            <h3>Hosting Provider</h3>
            <p>
              Our servers are hosted by [YOUR HOSTING PROVIDER] in [LOCATION, e.g., Germany/EU].
              They act as our data processor under a Data Processing Agreement (DPA).
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2>6. International Data Transfers</h2>
            <p>
              Your data is primarily processed within the EU/EEA. Where data is transferred to the United States
              (e.g., Stripe, Valve), the transfer is safeguarded by:
            </p>
            <ul>
              <li>The EU-US Data Privacy Framework (where the recipient is certified), or</li>
              <li>EU Standard Contractual Clauses (SCCs)</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2>7. Data Retention</h2>
            <ul>
              <li><strong>Account data:</strong> Retained until you delete your account, plus up to 30 days for technical cleanup.</li>
              <li><strong>Lineups and collections:</strong> Retained until you delete them or close your account.</li>
              <li><strong>Billing and payment records:</strong> Retained for 10 years as required by German tax law (Section 147 AO, Section 257 HGB).</li>
              <li><strong>Server log files:</strong> Automatically deleted after 14 days.</li>
              <li><strong>Session cookies:</strong> Deleted when your session ends or you log out.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2>8. Your Rights</h2>
            <p>Under the GDPR, you have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Right of access</strong> (Art. 15 GDPR) — obtain confirmation of whether your data is processed and request a copy.</li>
              <li><strong>Right to rectification</strong> (Art. 16 GDPR) — request correction of inaccurate data.</li>
              <li><strong>Right to erasure</strong> (Art. 17 GDPR) — request deletion of your data (&quot;right to be forgotten&quot;).</li>
              <li><strong>Right to restriction</strong> (Art. 18 GDPR) — request restricted processing under certain conditions.</li>
              <li><strong>Right to data portability</strong> (Art. 20 GDPR) — receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to object</strong> (Art. 21 GDPR) — object to processing based on legitimate interest. We will cease processing unless we demonstrate compelling legitimate grounds.</li>
              <li><strong>Right to withdraw consent</strong> (Art. 7(3) GDPR) — where processing is based on consent, withdraw it at any time. Withdrawal does not affect the lawfulness of processing before withdrawal.</li>
            </ul>
            <p>
              To exercise your rights, contact us at [YOUR EMAIL ADDRESS]. We will respond within one month.
            </p>
            <p>
              You also have the right to lodge a complaint with a supervisory authority. The competent authority is:
            </p>
            <p>
              [NAME OF YOUR STATE DATA PROTECTION AUTHORITY]<br />
              [ADDRESS]<br />
              [WEBSITE]
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2>9. Obligation to Provide Data</h2>
            <p>
              Providing your Steam login data is required to create an account and use NadePro.
              Without it, we cannot provide the service. Providing payment data is required only
              if you subscribe to the Pro plan.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2>10. Automated Decision-Making</h2>
            <p>
              We do not use automated decision-making or profiling as defined in Art. 22 GDPR.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2>11. Third-Party Data Sources</h2>
            <p>
              We obtain personal data from Valve Corporation via the Steam Web API when you log in.
              The categories of data obtained are listed in Section 3.1 above. This data comes from
              your public Steam profile.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2>12. SSL/TLS Encryption</h2>
            <p>
              This website uses SSL/TLS encryption (recognizable by &quot;https://&quot; in the address bar)
              for all data transmission. This protects your data during transfer between your browser and our servers.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2>13. Minors</h2>
            <p>
              NadePro is intended for users aged 16 and older in accordance with Art. 8 GDPR as implemented
              in Germany. We do not knowingly collect data from persons under 16. If we become aware that we
              have collected data from a minor under 16, we will delete it promptly.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2>14. Changes to This Policy</h2>
            <p>
              We may update this privacy policy to reflect changes in our practices or legal requirements.
              The updated version will be published on this page with a new &quot;Last updated&quot; date.
              For material changes, we will notify registered users via the website.
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
