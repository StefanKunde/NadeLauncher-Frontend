'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Gift,
  Users,
  Crown,
  Clock,
  Copy,
  Check,
  UserPlus,
  Info,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { referralsApi } from '@/lib/api';
import type { ReferralStats, ReferralEntry } from '@/lib/types';
import toast from 'react-hot-toast';

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

export default function ReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, r] = await Promise.all([
          referralsApi.getStats(),
          referralsApi.getReferrals(),
        ]);
        setStats(s);
        setReferrals(r);
      } catch {
        // stats will remain null
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = async () => {
    if (!stats?.referralLink) return;
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const daysRemaining = stats?.premiumExpiresAt
    ? Math.max(0, Math.ceil((new Date(stats.premiumExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f0a500] border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="max-w-4xl"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0a500]/15">
            <Gift className="h-5 w-5 text-[#f0a500]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#e8e8e8]">Referrals</h1>
            <p className="text-[#6b6b8a]">Invite friends, earn premium time</p>
          </div>
        </div>
      </motion.div>

      {/* Referral Link Card */}
      <motion.div variants={fadeUp} custom={1} className="mb-6">
        <div className="glass rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6b6b8a]">
            Your Referral Link
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg bg-[#0d0d14] border border-[#2a2a3e] px-4 py-3">
              <p className="font-mono text-sm text-[#e8e8e8] truncate">
                {stats?.referralLink ?? '...'}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/15 text-[#f0a500] transition-all hover:bg-[#f0a500]/25"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-3 text-xs text-[#6b6b8a]">
            Share this link with friends. When they sign up and buy premium, you earn <span className="text-[#f0a500] font-medium">14 days</span> of premium time.
          </p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={fadeUp} custom={2} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a2e]">
              <Users className="h-4 w-4 text-[#6b6b8a]" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">
              Total Referrals
            </span>
          </div>
          <p className="text-3xl font-bold text-[#e8e8e8]">{stats?.totalReferrals ?? 0}</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0a500]/10">
              <Crown className="h-4 w-4 text-[#f0a500]" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">
              Conversions
            </span>
          </div>
          <p className="text-3xl font-bold text-[#f0a500]">{stats?.convertedReferrals ?? 0}</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00c850]/10">
              <Clock className="h-4 w-4 text-[#00c850]" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">
              Days Earned
            </span>
          </div>
          <p className="text-3xl font-bold text-[#00c850]">{stats?.premiumDaysEarned ?? 0}</p>
        </div>
      </motion.div>

      {/* Premium Status */}
      {user?.isPremium && daysRemaining !== null && daysRemaining > 0 && (
        <motion.div variants={fadeUp} custom={3} className="mb-6">
          <div className="glass rounded-xl p-5 flex items-center gap-4" style={{ borderColor: 'rgba(0,200,80,0.3)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00c850]/15">
              <Crown className="h-5 w-5 text-[#00c850]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e8e8e8]">Referral Premium Active</p>
              <p className="text-sm text-[#6b6b8a]">
                <span className="text-[#00c850] font-medium">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span> remaining
                {stats?.premiumExpiresAt && (
                  <> &middot; expires {formatDate(stats.premiumExpiresAt)}</>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banked Days (subscription active + earned referral days saved for later) */}
      {stats?.hasActiveSubscription && (stats.bankedDays ?? 0) > 0 && (
        <motion.div variants={fadeUp} custom={3} className="mb-6">
          <div className="glass rounded-xl p-5 flex items-center gap-4" style={{ borderColor: 'rgba(108,92,231,0.3)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6c5ce7]/15">
              <Wallet className="h-5 w-5 text-[#6c5ce7]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e8e8e8]">
                {stats.bankedDays} Bonus Day{stats.bankedDays !== 1 ? 's' : ''} Saved
              </p>
              <p className="text-sm text-[#6b6b8a]">
                You have an active subscription, so your referral days are banked. They&apos;ll activate automatically if your subscription ends.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!user?.isPremium && (stats?.convertedReferrals ?? 0) === 0 && (
        <motion.div variants={fadeUp} custom={3} className="mb-6">
          <div className="glass rounded-xl p-5 flex items-center gap-4 border-[#f0a500]/20" style={{ borderColor: 'rgba(240,165,0,0.2)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0a500]/15">
              <Gift className="h-5 w-5 text-[#f0a500]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e8e8e8]">Earn Premium Time</p>
              <p className="text-sm text-[#6b6b8a]">
                Invite friends and earn 14 days of premium for each one who upgrades.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* How it Works */}
      <motion.div variants={fadeUp} custom={3.5} className="mb-6">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-[#6b6b8a]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6b6b8a]">How it Works</h2>
          </div>
          <div className="space-y-3 text-sm text-[#6b6b8a]">
            <div className="flex gap-3">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#f0a500]/10 text-[10px] font-bold text-[#f0a500]">1</span>
              <p>Share your referral link with friends. When they sign up through your link, they&apos;re tracked as your referral.</p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#f0a500]/10 text-[10px] font-bold text-[#f0a500]">2</span>
              <p>When a referred friend buys premium, you earn <span className="text-[#f0a500] font-medium">14 days</span> of premium time.</p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#f0a500]/10 text-[10px] font-bold text-[#f0a500]">3</span>
              <p><span className="text-[#e8e8e8]">No premium?</span> The 14 days activate immediately.</p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#f0a500]/10 text-[10px] font-bold text-[#f0a500]">4</span>
              <p><span className="text-[#e8e8e8]">Already have referral premium?</span> The days are added to your remaining time.</p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#6c5ce7]/10 text-[10px] font-bold text-[#6c5ce7]">5</span>
              <p><span className="text-[#e8e8e8]">Have a subscription?</span> Your referral days are saved and activate automatically when your subscription ends. They never expire.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div variants={fadeUp} custom={4}>
        <h2 className="mb-4 text-xl font-semibold text-[#e8e8e8]">Referral History</h2>
        {referrals.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <UserPlus className="mx-auto h-10 w-10 text-[#2a2a3e] mb-3" />
            <p className="text-sm text-[#6b6b8a]">
              No referrals yet. Share your link to get started!
            </p>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            {/* Header — desktop only */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-[#2a2a3e]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b8a]">User</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b8a] w-24 text-center">Status</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b8a] w-28 text-right">Date</span>
            </div>
            {/* Rows */}
            {referrals.map((ref, i) => (
              <div key={ref.id}>
                {/* Desktop row */}
                <div
                  className={`hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3 ${
                    i % 2 === 0 ? 'bg-transparent' : 'bg-[#1a1a2e]/30'
                  } ${i < referrals.length - 1 ? 'border-b border-[#2a2a3e]/50' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#1a1a2e]">
                      {ref.referredAvatar ? (
                        <Image
                          src={ref.referredAvatar}
                          alt={ref.referredUsername}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#6b6b8a]">
                          {ref.referredUsername.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-[#e8e8e8] truncate">{ref.referredUsername}</span>
                  </div>
                  <div className="w-24 text-center">
                    {ref.converted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#00c850]/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#00c850]">
                        <Check className="h-3 w-3" />
                        CONVERTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#2a2a3e] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#6b6b8a]">
                        PENDING
                      </span>
                    )}
                  </div>
                  <span className="w-28 text-right text-xs text-[#6b6b8a]">
                    {formatDate(ref.createdAt)}
                  </span>
                </div>

                {/* Mobile row */}
                <div
                  className={`sm:hidden flex items-center justify-between gap-3 px-4 py-3 ${
                    i % 2 === 0 ? 'bg-transparent' : 'bg-[#1a1a2e]/30'
                  } ${i < referrals.length - 1 ? 'border-b border-[#2a2a3e]/50' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#1a1a2e]">
                      {ref.referredAvatar ? (
                        <Image
                          src={ref.referredAvatar}
                          alt={ref.referredUsername}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#6b6b8a]">
                          {ref.referredUsername.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm text-[#e8e8e8] truncate block">{ref.referredUsername}</span>
                      <span className="text-xs text-[#6b6b8a]">{formatDate(ref.createdAt)}</span>
                    </div>
                  </div>
                  {ref.converted ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#00c850]/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#00c850]">
                      <Check className="h-3 w-3" />
                      CONVERTED
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-[#2a2a3e] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#6b6b8a]">
                      PENDING
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
