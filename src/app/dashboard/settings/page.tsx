'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Settings,
  Crown,
  ExternalLink,
  Trash2,
  Bell,
  Eye,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
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

function ToggleSwitch({ enabled, label, icon: Icon }: { enabled: boolean; label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[#6b6b8a]" />
        <span className="text-sm text-[#e8e8e8]">{label}</span>
      </div>
      <div
        className={`relative h-6 w-11 cursor-not-allowed rounded-full transition-colors ${
          enabled ? 'bg-[#f0a500]/30' : 'bg-[#2a2a3e]'
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200 ${
            enabled
              ? 'left-[22px] bg-[#f0a500]'
              : 'left-0.5 bg-[#6b6b8a]'
          }`}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [toggles] = useState({
    emailNotifications: false,
    showOnlineStatus: true,
    publicProfile: false,
  });

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

      {/* Preferences */}
      <motion.div variants={fadeUp} custom={2} className="mb-6">
        <div className="glass rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6b6b8a]">
            Preferences
          </h2>
          <div className="divide-y divide-[#2a2a3e]/50">
            <ToggleSwitch enabled={toggles.emailNotifications} label="Email notifications" icon={Bell} />
            <ToggleSwitch enabled={toggles.showOnlineStatus} label="Show online status" icon={Eye} />
            <ToggleSwitch enabled={toggles.publicProfile} label="Public profile" icon={Globe} />
          </div>
          <p className="mt-4 text-xs text-[#6b6b8a]">More settings coming soon</p>
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
            onClick={() => toast.error('Contact support to delete your account')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#ff4444]/30 px-4 py-2 text-sm font-medium text-[#ff4444] transition-all duration-200 hover:bg-[#ff4444]/10 hover:border-[#ff4444]/50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
