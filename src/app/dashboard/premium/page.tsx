'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, X, ChevronDown, ChevronUp, Lock, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

const COMPARISON_ROWS = [
  { feature: 'Lineup browser & 2D radar maps', free: true, pro: true },
  { feature: 'Community lineups', free: true, pro: true },
  { feature: 'In-game practice (CS2 plugin)', free: true, pro: true },
  { feature: 'Own lineups', free: 'Up to 20', pro: 'Unlimited' },
  { feature: 'Practice server time', free: '30 min', pro: 'Unlimited' },
  { feature: 'Curated pro lineups', free: false, pro: true },
  { feature: 'Pro demo pipeline', free: false, pro: true },
  { feature: 'Ghost replay', free: false, pro: true },
  { feature: 'Landing verification', free: false, pro: true },
  { feature: 'Collections & in-game management', free: false, pro: true },
  { feature: 'Pro team & event collections', free: false, pro: true },
  { feature: 'Priority support', free: false, pro: true },
];

const FAQ_ITEMS = [
  {
    q: 'What payment methods do you accept?',
    a: "We'll support credit cards, PayPal, and more at launch.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel anytime. No lock-in or hidden fees.',
  },
  {
    q: 'Do I keep my lineups if I downgrade?',
    a: 'Your assigned presets are kept. Custom lineups become read-only.',
  },
  {
    q: 'When does Pro launch?',
    a: 'Pro is coming soon. Sign up now to be the first to know when it launches.',
  },
];

const FREE_FEATURES = [
  'Browse community lineups',
  'In-game practice with markers',
  '7 Active Duty maps',
  'Save up to 20 lineups',
  'Basic grenade types',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited lineups',
  'Curated pro lineups',
  'Demo import & analysis',
  'Execute sequences',
  'Landing verification',
  'Map coverage heatmaps',
  'Collections & folders',
  'Priority support',
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
    return <span className="text-sm font-medium text-[#e8e8e8]">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-5 w-5" style={{ color }} />
  ) : (
    <X className="mx-auto h-5 w-5 text-[#ff4444]/60" />
  );
}

export default function PremiumPage() {
  const user = useAuthStore((s) => s.user);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isPremium = user?.isPremium ?? false;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="max-w-5xl"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0a500]/15">
            <Crown className="h-5 w-5 text-[#f0a500]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#e8e8e8]">Premium</h1>
            <p className="text-[#6b6b8a]">Unlock the full NadePro experience</p>
          </div>
        </div>
      </motion.div>

      {/* Current Plan Banner */}
      <motion.div variants={fadeUp} custom={1} className="mb-10">
        {isPremium ? (
          <div className="glass rounded-xl border-[#00c850]/30 p-5 flex items-center gap-4" style={{ borderColor: 'rgba(0,200,80,0.3)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00c850]/15">
              <Check className="h-5 w-5 text-[#00c850]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#e8e8e8]">You&apos;re on Premium</p>
              <p className="text-sm text-[#6b6b8a]">Thank you for supporting NadePro</p>
            </div>
            <div className="ml-auto">
              <span className="rounded-full bg-[#00c850]/15 px-3 py-1 text-xs font-bold text-[#00c850]">
                ACTIVE
              </span>
            </div>
          </div>
        ) : (
          <div className="glass rounded-xl p-5 flex items-center gap-4 border-[#f0a500]/20" style={{ borderColor: 'rgba(240,165,0,0.2)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0a500]/15">
              <Sparkles className="h-5 w-5 text-[#f0a500]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#e8e8e8]">You&apos;re on the Free plan</p>
              <p className="text-sm text-[#6b6b8a]">Upgrade to unlock all features</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Feature Comparison Table */}
      <motion.div variants={fadeUp} custom={2} className="mb-10">
        <h2 className="mb-5 text-xl font-semibold text-[#e8e8e8]">Feature Comparison</h2>
        <div className="glass rounded-xl overflow-hidden overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_90px_90px] min-w-[400px] border-b border-[#2a2a3e] px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">Feature</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">Free</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wider text-[#f0a500]">Pro</span>
          </div>
          {/* Table rows */}
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_90px_90px] min-w-[400px] items-center px-5 py-3 ${
                i % 2 === 0 ? 'bg-transparent' : 'bg-[#1a1a2e]/30'
              } ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-[#2a2a3e]/50' : ''}`}
            >
              <span className="text-sm text-[#e8e8e8]">{row.feature}</span>
              <div className="text-center">
                <CellValue value={row.free} />
              </div>
              <div className="text-center">
                <CellValue value={row.pro} color="#f0a500" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div variants={fadeUp} custom={3} className="mb-10">
        <h2 className="mb-5 text-xl font-semibold text-[#e8e8e8]">Choose Your Plan</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 max-w-3xl">
          {/* Free Tier */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e8e8e8] mb-1">Free</h3>
            <p className="mb-5">
              <span className="text-4xl font-bold text-[#e8e8e8]">$0</span>
              <span className="ml-1 text-sm text-[#6b6b8a]">/ forever</span>
            </p>
            <ul className="mb-6 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#6b6b8a]">
                  <Check className="h-4 w-4 shrink-0 text-[#00c850]" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full cursor-default rounded-lg bg-[#2a2a3e] py-2.5 text-sm font-semibold text-[#6b6b8a]"
              disabled
            >
              {isPremium ? 'Free Plan' : 'Current Plan'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-xl p-6 glass glow-gold" style={{ borderColor: 'rgba(240,165,0,0.4)' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#f0a500] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
              Most Popular
            </div>
            <div className="mb-1 flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#f0a500]" />
              <h3 className="text-lg font-semibold text-[#f0a500]">Pro</h3>
            </div>
            <p className="mb-5">
              <span className="text-4xl font-bold text-gradient-gold">&euro;5</span>
              <span className="ml-1 text-sm text-[#6b6b8a]">/ month</span>
            </p>
            <ul className="mb-6 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#e8e8e8]">
                  <Check className="h-4 w-4 shrink-0 text-[#f0a500]" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => toast('Pro is coming soon. Stay tuned!')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f0a500]/20 py-2.5 text-sm font-semibold text-[#f0a500] cursor-not-allowed"
              disabled
            >
              <Lock className="h-4 w-4" />
              Coming Soon
            </button>
            <p className="mt-3 text-center text-xs text-[#6b6b8a]">Coming Soon</p>
          </div>
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div variants={fadeUp} custom={4}>
        <h2 className="mb-5 text-xl font-semibold text-[#e8e8e8]">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#1a1a2e]/50"
                >
                  <span className="text-sm font-medium text-[#e8e8e8]">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-[#6b6b8a]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#6b6b8a]" />
                  )}
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm text-[#6b6b8a]">{item.a}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
