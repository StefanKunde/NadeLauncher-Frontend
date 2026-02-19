'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Crown,
  ExternalLink,
  Trash2,
  CreditCard,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { stripeApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const CONFIRM_TEXT = 'DELETE';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showDeleteModal) {
      setTimeout(() => confirmInputRef.current?.focus(), 100);
    } else {
      setConfirmInput('');
    }
  }, [showDeleteModal]);

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
    setPortalLoading(true);
    try {
      const { url } = await stripeApi.createPortal();
      window.location.href = url;
    } catch {
      toast.error('Failed to open subscription portal.');
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmInput !== CONFIRM_TEXT) return;
    setDeleteLoading(true);
    try {
      await usersApi.deleteAccount();
      logout();
      router.push('/');
      toast.success('Your account has been deleted.');
    } catch {
      toast.error('Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-3xl"
      >
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a2e]">
              <Settings className="h-5 w-5 text-[#6b6b8a]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#e8e8e8]">Settings</h1>
              <p className="text-[#6b6b8a]">Manage your account</p>
            </div>
          </div>
        </motion.div>

        {/* Account Information */}
        <motion.div variants={fadeUp} custom={1} className="mb-6">
          <div className="glass rounded-xl p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-[#6b6b8a]">
              Account Information
            </h2>
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#1a1a2e]">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#6b6b8a]">
                    {initials}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xl font-bold text-[#e8e8e8]">{user?.username ?? 'Unknown'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {user?.isPremium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f0a500]/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#f0a500]">
                        <Crown className="h-3 w-3" />
                        PREMIUM
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#2a2a3e] px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-[#6b6b8a]">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#6b6b8a]">Steam ID</p>
                    <p className="font-mono text-sm text-[#e8e8e8]">{user?.steamId ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b6b8a]">Member since</p>
                    <p className="text-sm text-[#e8e8e8]">{memberSince}</p>
                  </div>
                </div>

                {user?.profileUrl && (
                  <a
                    href={user.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#f0a500] hover:underline"
                  >
                    View Steam Profile
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscription */}
        <motion.div variants={fadeUp} custom={2} className="mb-6">
          <div className="glass rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6b6b8a]">
              Subscription
            </h2>

            {user?.isPremium ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0a500]/10">
                    <Crown className="h-5 w-5 text-[#f0a500]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#e8e8e8]">Pro Plan</p>
                    {user.premiumExpiresAt && (
                      <p className="text-xs text-[#6b6b8a]">
                        Renews {new Date(user.premiumExpiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#6b6b8a] mb-4">
                  Manage your subscription, update payment method, or cancel via the Stripe customer portal.
                </p>
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a3e] px-4 py-2 text-sm font-medium text-[#e8e8e8] transition-all duration-200 hover:bg-[#1a1a2e] hover:border-[#f0a500]/30 disabled:opacity-50"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Manage Subscription
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a2a3e]">
                    <CreditCard className="h-5 w-5 text-[#6b6b8a]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#e8e8e8]">Free Plan</p>
                    <p className="text-xs text-[#6b6b8a]">Limited collections, lineups, and practice time</p>
                  </div>
                </div>
                <p className="text-sm text-[#6b6b8a] mb-4">
                  Upgrade to Pro for unlimited collections, practice time, and access to curated pro lineups.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUpgrade}
                    disabled={upgradeLoading}
                    className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {upgradeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crown className="h-4 w-4" />
                    )}
                    Upgrade to Pro
                  </button>
                  <Link
                    href="/dashboard/premium"
                    className="text-sm text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
                  >
                    Learn more
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={fadeUp} custom={3}>
          <div className="glass rounded-xl p-6" style={{ borderColor: 'rgba(255,68,68,0.25)' }}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#ff4444]">
              Danger Zone
            </h2>
            <p className="mb-4 text-sm text-[#6b6b8a]">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#ff4444]/30 px-4 py-2 text-sm font-medium text-[#ff4444] transition-all duration-200 hover:bg-[#ff4444]/10 hover:border-[#ff4444]/50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !deleteLoading && setShowDeleteModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md glass rounded-xl border border-[#ff4444]/25 shadow-2xl shadow-black/50 p-6"
            >
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="absolute top-4 right-4 text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff4444]/10">
                  <AlertTriangle className="h-5 w-5 text-[#ff4444]" />
                </div>
                <h3 className="text-lg font-bold text-[#e8e8e8]">Delete Account</h3>
              </div>

              <div className="space-y-3 mb-5">
                <p className="text-sm text-[#b8b8cc]">
                  This will permanently delete your account and all associated data, including:
                </p>
                <ul className="text-sm text-[#9595b0] space-y-1 list-disc pl-5">
                  <li>All your lineups and collections</li>
                  <li>Community published collections</li>
                  <li>Practice session history</li>
                  {user?.isPremium && <li>Your active Pro subscription will be cancelled</li>}
                </ul>
                <p className="text-sm text-[#ff4444] font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm text-[#6b6b8a] mb-2">
                  Type <span className="font-mono font-bold text-[#e8e8e8]">{CONFIRM_TEXT}</span> to confirm
                </label>
                <input
                  ref={confirmInputRef}
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeleteAccount()}
                  disabled={deleteLoading}
                  placeholder={CONFIRM_TEXT}
                  className="w-full rounded-lg border border-[#2a2a3e] bg-[#0a0a0f] px-3 py-2 text-sm text-[#e8e8e8] placeholder-[#3a3a4e] outline-none focus:border-[#ff4444]/50 transition-colors disabled:opacity-50"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmInput !== CONFIRM_TEXT || deleteLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff4444] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ee3333] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="rounded-lg border border-[#2a2a3e] px-4 py-2.5 text-sm font-medium text-[#6b6b8a] transition-all duration-200 hover:text-[#e8e8e8] hover:border-[#3a3a4e] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
