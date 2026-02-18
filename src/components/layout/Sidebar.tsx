'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  Users,
  Crown,
  Gift,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import SidebarServerStatus from './SidebarServerStatus';

const NAV_MAIN = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Overview & practice' },
  { href: '/dashboard/maps', icon: Map, label: 'Nades', desc: 'Browse lineups' },
  { href: '/dashboard/community', icon: Users, label: 'Community', desc: 'Shared collections' },
];

const NAV_ACCOUNT = [
  { href: '/dashboard/premium', icon: Crown, label: 'Premium', desc: 'Unlimited practice', badge: 'PRO' },
  { href: '/dashboard/referrals', icon: Gift, label: 'Referrals', desc: 'Invite & earn' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', desc: 'Account & preferences' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  const renderNavItem = ({ href, icon: Icon, label, desc, badge }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    desc: string;
    badge?: string;
  }) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          active
            ? 'text-[#f0a500]'
            : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
        }`}
      >
        {/* Active background glow */}
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(240,165,0,0.12) 0%, rgba(240,165,0,0.04) 100%)',
              border: '1px solid rgba(240,165,0,0.15)',
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        {/* Hover background */}
        {!active && (
          <div className="absolute inset-0 rounded-xl bg-[#1a1a2e] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}

        {/* Icon container */}
        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors duration-200 ${
          active
            ? 'bg-[#f0a500]/15'
            : 'bg-[#1a1a2e] group-hover:bg-[#22223a]'
        }`}>
          <Icon className={`h-4 w-4 transition-colors duration-200 ${
            active ? 'text-[#f0a500]' : 'text-[#6b6b8a] group-hover:text-[#b8b8cc]'
          }`} />
        </div>

        {/* Label + description */}
        <div className="relative z-10 min-w-0 flex-1">
          <span className="block truncate">{label}</span>
          <span className={`block text-[10px] font-normal truncate transition-colors duration-200 ${
            active ? 'text-[#f0a500]/60' : 'text-[#6b6b8a]/60 group-hover:text-[#6b6b8a]'
          }`}>
            {desc}
          </span>
        </div>

        {/* Badge or chevron */}
        {badge ? (
          <span className="relative z-10 ml-auto rounded-md bg-gradient-to-r from-[#f0a500]/20 to-[#ffd700]/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#f0a500] border border-[#f0a500]/15">
            {badge}
          </span>
        ) : (
          <ChevronRight className={`relative z-10 h-3.5 w-3.5 ml-auto transition-all duration-200 ${
            active ? 'text-[#f0a500]/40' : 'text-transparent group-hover:text-[#6b6b8a]/40'
          }`} />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 pt-5 pb-3">
        <Link href="/dashboard" className="flex flex-col items-center gap-2">
          <Image
            src="/logo.png"
            alt="NadePro"
            width={600}
            height={262}
            className="shrink-0 w-full h-auto"
          />
        </Link>
        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0a500]/8 border border-[#f0a500]/15 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#f0a500]/60">
            Early Access
          </span>
        </div>
      </div>

      {/* Gold separator */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-[#f0a500]/40 to-transparent" />

      {/* Main Navigation */}
      <nav className="mt-5 flex-1 px-3">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b8a]/50">
          Navigate
        </p>
        <div className="space-y-0.5">
          {NAV_MAIN.map(renderNavItem)}
        </div>

        {/* Section separator */}
        <div className="mx-3 my-4 h-px bg-gradient-to-r from-[#2a2a3e]/60 via-[#2a2a3e]/30 to-transparent" />

        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b8a]/50">
          Account
        </p>
        <div className="space-y-0.5">
          {NAV_ACCOUNT.map(renderNavItem)}
        </div>
      </nav>

      {/* Server Status */}
      <SidebarServerStatus />

      {/* User Section */}
      <div className="border-t border-[#2a2a3e]/60 px-3 py-4">
        {user && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#12121a] border border-[#2a2a3e]/40 px-3 py-3">
            {/* Avatar with ring */}
            <div className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full ${
              user.isPremium
                ? 'ring-2 ring-[#f0a500]/40 ring-offset-2 ring-offset-[#12121a]'
                : 'ring-1 ring-[#2a2a3e]'
            }`}>
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-xs font-bold ${
                  user.isPremium ? 'bg-[#f0a500]/10 text-[#f0a500]' : 'bg-[#1a1a2e] text-[#6b6b8a]'
                }`}>
                  {initials}
                </div>
              )}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#e8e8e8]">
                {user.username}
              </p>
              {user.isPremium ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#f0a500]">
                  <Crown className="h-3 w-3" />
                  PREMIUM
                </span>
              ) : (
                <span className="text-[10px] text-[#6b6b8a]">Free Plan</span>
              )}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6b6b8a] transition-all duration-200 hover:bg-[#ff4444]/8 hover:text-[#ff4444]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a2e]">
            <LogOut className="h-4 w-4" />
          </div>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[#2a2a3e] bg-[#0d0d14]/95 backdrop-blur-lg px-4 py-3">
        <Link href="/dashboard">
          <Image src="/logo.png" alt="NadePro" width={600} height={262} className="h-10 w-auto" />
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6b6b8a] hover:text-[#e8e8e8] transition-colors"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide-in drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[#2a2a3e]/50 bg-[#0d0d14] transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Subtle gradient overlay on sidebar */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#f0a500]/[0.02] via-transparent to-[#0a0a0f]/50" />
        <div className="relative z-10 flex flex-col h-full">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
