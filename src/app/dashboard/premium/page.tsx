'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, Check, ChevronDown, Sparkles, Clock, Loader2, HelpCircle, Gamepad2, Crosshair, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { authApi, stripeApi } from '@/lib/api';
import toast from 'react-hot-toast';

const COMPARISON_ROWS = [
  { feature: 'Lineup browser & 2D radar maps', free: true, pro: true },
  { feature: 'Community lineups', free: true, pro: true },
  { feature: 'On-demand practice server (CS2 plugin)', free: true, pro: true },
  { feature: 'Ghost replay guidance', free: true, pro: true },
  { feature: 'Collections & in-game management', free: true, pro: true },
  { feature: 'Own lineups per collection', free: 'Up to 20', pro: 'Unlimited' },
  { feature: 'Collections per map', free: '1', pro: 'Unlimited' },
  { feature: 'Weekly practice time', free: '30 min', pro: 'Unlimited' },
  { feature: 'Curated pro lineups', free: false, pro: true },
  { feature: 'Build custom collections from pro lineups', free: false, pro: true },
  { feature: 'Pro team & event collections', free: false, pro: true },
];

const FAQ_SECTIONS = [
  {
    title: 'Getting Started',
    icon: Gamepad2,
    items: [
      {
        q: 'How does the practice server work?',
        a: 'NadePro spins up a private CS2 server with our custom plugin. Select a collection, hit Practice, and the server loads the map with in-game markers, teleport, and ghost guidance that walks you through each throw step by step.',
      },
      {
        q: 'Do I need to install anything?',
        a: 'No. Just connect to the practice server via the CS2 console. There are no client-side mods or plugins required.',
      },
      {
        q: 'What maps are supported?',
        a: 'All current Active Duty maps are always supported. When the map pool changes, NadePro updates accordingly.',
      },
    ],
  },
  {
    title: 'Practice & Lineups',
    icon: Crosshair,
    items: [
      {
        q: 'What are ghost replays?',
        a: 'When a lineup is saved, the full player movement is recorded. During practice, a ghost model replays the exact movement like a real player — so you can see the positioning, crosshair placement, and timing to truly understand each lineup.',
      },
      {
        q: 'What throw types are supported?',
        a: 'Regular, jump throw, run throw, W-jump throw, duck throw, and all throw strength variations. The server plugin automatically detects the throw type — no manual setup needed.',
      },
      {
        q: 'Can I create my own lineups?',
        a: 'Yes! Use !save in-game to set up a new lineup from scratch, or use !savelast to save the nade you just threw. Manage your collections from the web dashboard or directly in-game.',
      },
      {
        q: 'Can I add nades from pro or community collections to my own?',
        a: 'Yes. As a Premium user you can add any lineup to your own collection — either in-game via the nade menu, or on the website from any pro or community collection page.',
      },
      {
        q: 'Where do pro lineups come from?',
        a: 'Pro lineups are curated from professional matches and demos, enhanced with AI-assisted analysis.',
      },
      {
        q: 'Can I share my collections?',
        a: 'Yes. Publish a collection to the community and other users can subscribe to it, browse your lineups, and practice them on their own server.',
      },
    ],
  },
  {
    title: 'Premium & Billing',
    icon: CreditCard,
    items: [
      {
        q: 'Is there a practice time limit?',
        a: 'Free users get 30 minutes of practice time per week. Pro users get unlimited practice time.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes, cancel anytime from the subscription portal. You keep premium access until the end of your billing period.',
      },
      {
        q: 'Do I keep my lineups if I downgrade?',
        a: 'Your lineups are kept, but collections beyond the free limit are not accessible until you upgrade again.',
      },
    ],
  },
];

const FREE_FEATURES = [
  'Browse community lineups',
  'In-game practice with markers & teleport',
  'Ghost replay guidance',
  'Collections & in-game management',
  '7 Active Duty maps',
  '1 collection per map (up to 20 lineups)',
  '30 min weekly practice time',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited collections & lineups',
  'Unlimited practice time',
  'Curated pro lineups & collections',
  'Pro team & event collections',
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};

function CellValue({ value, color = '#00c850' }: { value: boolean | string; color?: string }) {
  if (typeof value === 'string') {
    return <span className="text-[13px] font-semibold text-[#e8e8e8]">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4.5 w-4.5" style={{ color }} />
  ) : (
    <span className="mx-auto block text-xs text-[#6b6b8a]/40">&mdash;</span>
  );
}

function PremiumPageInner() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const isPremium = user?.isPremium ?? false;
  const premiumExpiresAt = user?.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
  const daysRemaining = premiumExpiresAt
    ? Math.max(0, Math.ceil((premiumExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Handle return from Stripe Checkout
  useEffect(() => {
    if (searchParams.get('session_id')) {
      // Refresh user data to pick up premium status set by webhook
      authApi.getMe().then((auth) => {
        useAuthStore.getState().setTokens(auth.accessToken, auth.refreshToken, auth.user);
      }).catch(() => {});
      toast.success('Welcome to NadePro Premium!');
      window.history.replaceState({}, '', '/dashboard/premium');
    }
    if (searchParams.get('cancelled')) {
      toast('Checkout cancelled. No charges were made.');
      window.history.replaceState({}, '', '/dashboard/premium');
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const { url } = await stripeApi.createCheckout();
      window.location.href = url;
    } catch {
      toast.error('Failed to start checkout. Please try again.');
      setUpgradeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await stripeApi.createPortal();
      window.location.href = url;
    } catch {
      toast.error('Failed to open subscription portal.');
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="max-w-5xl"
    >
      {/* Hero Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-10">
        <div className="relative rounded-2xl overflow-hidden border border-[#2a2a3e]/50 bg-[#12121a]">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#f0a500]/8 via-transparent to-[#f0a500]/3" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f0a500]/50 to-transparent" />

          <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f0a500]/20 to-[#f0a500]/5 border border-[#f0a500]/15">
              <Crown className="h-7 w-7 text-[#f0a500]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#e8e8e8] mb-1">NadePro Premium</h1>
              <p className="text-[#6b6b8a] text-sm sm:text-base">Unlimited practice time, pro lineups, and no restrictions</p>
            </div>
            {isPremium ? (
              <div className="shrink-0 flex items-center gap-2 rounded-full bg-[#00c850]/10 border border-[#00c850]/20 px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-[#00c850] animate-pulse" />
                <span className="text-xs font-bold text-[#00c850] uppercase tracking-wider">Active</span>
              </div>
            ) : (
              <div className="shrink-0 flex items-center gap-2 rounded-full bg-[#f0a500]/10 border border-[#f0a500]/20 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5 text-[#f0a500]" />
                <span className="text-xs font-bold text-[#f0a500] uppercase tracking-wider">Free Plan</span>
              </div>
            )}
          </div>

          {/* Status bar */}
          {isPremium && daysRemaining !== null && (
            <div className="relative border-t border-[#2a2a3e]/50 px-6 sm:px-8 py-3 flex items-center gap-2 text-sm text-[#6b6b8a]">
              <Clock className="h-3.5 w-3.5 text-[#6b6b8a]" />
              <span className="text-[#00c850] font-medium">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>
              <span>remaining &middot; expires {premiumExpiresAt!.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Feature Comparison Table */}
      <motion.div variants={fadeUp} custom={2} className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-semibold text-[#e8e8e8]">Feature Comparison</h2>
        </div>
        <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_100px_100px] border-b border-[#2a2a3e] px-4 sm:px-6 py-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b8a]">Feature</span>
            <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b6b8a]">Free</span>
            <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-[#f0a500]">
              <Crown className="inline h-3 w-3 mr-1 -mt-0.5" />
              Pro
            </span>
          </div>
          {/* Table rows */}
          {COMPARISON_ROWS.map((row, i) => {
            const isProOnly = row.free === false;
            return (
              <div
                key={row.feature}
                className={`grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_100px_100px] items-center px-4 sm:px-6 py-3 transition-colors ${
                  isProOnly ? 'bg-[#f0a500]/[0.03]' : i % 2 !== 0 ? 'bg-[#1a1a2e]/20' : ''
                } ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-[#2a2a3e]/30' : ''}`}
              >
                <span className={`text-sm ${isProOnly ? 'text-[#e8e8e8] font-medium' : 'text-[#b8b8cc]'}`}>{row.feature}</span>
                <div className="text-center">
                  <CellValue value={row.free} />
                </div>
                <div className="text-center">
                  <CellValue value={row.pro} color="#f0a500" />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div variants={fadeUp} custom={3} className="mb-10">
        <h2 className="mb-5 text-xl font-semibold text-[#e8e8e8]">Choose Your Plan</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 max-w-3xl">
          {/* Free Tier */}
          <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#e8e8e8] mb-1">Free</h3>
              <p className="text-xs text-[#6b6b8a]">Get started with the essentials</p>
            </div>
            <p className="mb-6">
              <span className="text-4xl font-bold text-[#e8e8e8]">&euro;0</span>
              <span className="ml-1 text-sm text-[#6b6b8a]">/ forever</span>
            </p>
            <ul className="mb-6 space-y-2.5 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#6b6b8a]">
                  <Check className="h-4 w-4 shrink-0 text-[#00c850] mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full cursor-default rounded-lg border border-[#2a2a3e] bg-[#1a1a2e]/50 py-2.5 text-sm font-semibold text-[#6b6b8a]"
              disabled
            >
              {isPremium ? 'Free Plan' : 'Current Plan'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-xl p-6 flex flex-col bg-[#12121a] glow-gold" style={{ borderWidth: 1, borderColor: 'rgba(240,165,0,0.35)' }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f0a500] to-transparent rounded-t-xl" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#f0a500] to-[#d4920a] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg shadow-[#f0a500]/20">
              Recommended
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#f0a500]" />
                <h3 className="text-lg font-semibold text-[#f0a500]">Pro</h3>
              </div>
              <p className="text-xs text-[#6b6b8a] mt-1">Unlimited everything, pro lineups</p>
            </div>
            <p className="mb-6">
              <span className="text-4xl font-bold text-gradient-gold">&euro;4.99</span>
              <span className="ml-1 text-sm text-[#6b6b8a]">/ month</span>
            </p>
            <ul className="mb-6 space-y-2.5 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#e8e8e8]">
                  <Check className="h-4 w-4 shrink-0 text-[#f0a500] mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {isPremium && !premiumExpiresAt ? (
              <>
                <button
                  onClick={handleManageSubscription}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2a3e] bg-[#1a1a2e]/50 py-2.5 text-sm font-semibold text-[#e8e8e8] hover:bg-[#2a2a3e] transition-colors"
                >
                  Manage Subscription
                </button>
                <p className="mt-3 text-center text-xs text-[#6b6b8a]">
                  Update payment method or cancel
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f0a500] to-[#d4920a] py-3 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-[#f0a500]/15"
                >
                  {upgradeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      Upgrade to Pro
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-[#6b6b8a]">
                  Cancel anytime &bull; Billed monthly
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div variants={fadeUp} custom={4}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2a2a3e]/50">
            <HelpCircle className="h-4.5 w-4.5 text-[#6b6b8a]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#e8e8e8]">Frequently Asked Questions</h2>
            <p className="text-sm text-[#6b6b8a]">Everything you need to know about NadePro</p>
          </div>
        </div>

        <div className="space-y-8">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-3">
                <section.icon className="h-3.5 w-3.5 text-[#f0a500]/60" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f0a500]/60">{section.title}</span>
              </div>
              <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden divide-y divide-[#2a2a3e]/30">
                {section.items.map((item, i) => {
                  const globalKey = `${section.title}-${i}`;
                  const isOpen = openFaq === globalKey;
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : globalKey)}
                        className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-all duration-200 ${
                          isOpen ? 'bg-[#1a1a2e]/60' : 'hover:bg-[#1a1a2e]/30'
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-200 ${
                            isOpen ? 'bg-[#f0a500]' : 'bg-[#2a2a3e]'
                          }`}
                        />
                        <span className={`flex-1 text-sm font-medium transition-colors duration-200 ${
                          isOpen ? 'text-[#e8e8e8]' : 'text-[#b8b8cc]'
                        }`}>
                          {item.q}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                            isOpen ? 'text-[#f0a500]' : 'text-[#6b6b8a]/50'
                          }`} />
                        </motion.div>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pl-[2.35rem] pt-2.5 pb-4 text-sm text-[#6b6b8a] leading-relaxed">{item.a}</p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense>
      <PremiumPageInner />
    </Suspense>
  );
}
