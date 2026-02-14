'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  Map,
  Gamepad2,
  Zap,
  Shield,
  Trophy,
  ArrowRight,
  Play,
  Check,
  Crown,
} from 'lucide-react';
import Image from 'next/image';
import GrenadeIcon from '@/components/ui/GrenadeIcon';
import { Footer } from '@/components/layout/Footer';

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

const GRENADE_TYPES = [
  {
    type: 'smoke' as const,
    name: 'Smoke Grenades',
    label: 'Smoke',
    color: '#88bbee',
    description:
      'Block sightlines and control map areas. Perfect your one-way smokes and executes.',
  },
  {
    type: 'flash' as const,
    name: 'Flashbangs',
    label: 'Flash',
    color: '#ffee44',
    description:
      'Blind your enemies at the perfect moment. Master pop-flashes and team flashes.',
  },
  {
    type: 'molotov' as const,
    name: 'Molotovs',
    label: 'Molotov',
    color: '#ff6633',
    description:
      'Deny positions and flush out enemies. Learn pixel-perfect molotov lineups.',
  },
  {
    type: 'he' as const,
    name: 'HE Grenades',
    label: 'HE',
    color: '#ff4444',
    description:
      'Deal maximum damage with calculated throws. Stack nades for devastating results.',
  },
];

const FEATURES = [
  {
    icon: Target,
    title: 'Precise Lineups',
    desc: 'Pixel-perfect positions with exact angles and coordinates on 2D radar maps',
  },
  {
    icon: Map,
    title: '7 Competitive Maps',
    desc: 'Full coverage of the Active Duty map pool with interactive 2D radar views',
  },
  {
    icon: Gamepad2,
    title: 'In-Game Practice',
    desc: 'Dedicated CS2 server plugin with teleport, rethrow, and auto-detect throw types',
  },
  {
    icon: Zap,
    title: 'Instant Teleport',
    desc: 'Point at any 3D marker and press E to instantly teleport to the lineup position',
  },
  {
    icon: Shield,
    title: 'Pro Demo Pipeline',
    desc: 'Lineups auto-extracted from Tier-1 pro matches — always stay up to date',
  },
  {
    icon: Play,
    title: 'Ghost Replay',
    desc: 'Watch 3D ghost replays of grenade trajectories to perfect your positioning and timing',
  },
  {
    icon: Trophy,
    title: 'Collections & Library',
    desc: 'Create and manage personal lineup collections — organize directly in-game or on the web',
  },
  {
    icon: Crown,
    title: 'Pro Collections',
    desc: 'Curated lineups from Tier-1 pro teams and major events — always up to date with the meta',
  },
];

const MAPS = [
  { name: 'de_dust2', display: 'Dust II', color: '#d4a04a' },
  { name: 'de_mirage', display: 'Mirage', color: '#4a9fd4' },
  { name: 'de_inferno', display: 'Inferno', color: '#d44a4a' },
  { name: 'de_nuke', display: 'Nuke', color: '#4ad49f' },
  { name: 'de_overpass', display: 'Overpass', color: '#9f4ad4' },
  { name: 'de_ancient', display: 'Ancient', color: '#4ad4d4' },
  { name: 'de_anubis', display: 'Anubis', color: '#d4c04a' },
];

const FREE_FEATURES = [
  'Browse community lineups',
  'Practice on CS2 servers',
  '7 competitive maps',
  'In-game markers & teleport',
  '1 collection per map (up to 20 lineups)',
  '30 min weekly practice time',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited collections & lineups',
  'Unlimited practice time',
  'Curated pro lineups & collections',
  'Pro demo pipeline',
  'Ghost replay',
  'In-game collection management',
];

const STATS = [
  { value: '500+', label: 'Lineups' },
  { value: '7', label: 'Maps' },
  { value: 'Active', label: 'Community' },
  { value: 'Free', label: 'To Use' },
];

const CT_AGENT_IMAGE = '/images/agents/ct-sas.png';
const T_AGENT_IMAGE = '/images/agents/t-professional.png';

// ---------------------------------------------------------------------------
// FLOATING GRENADES (decorative hero background)
// ---------------------------------------------------------------------------

const FLOATING_GRENADES: {
  type: 'smoke' | 'flash' | 'molotov' | 'he';
  size: number;
  top: string;
  left: string;
  opacity: number;
  delay: string;
}[] = [
  { type: 'smoke', size: 64, top: '12%', left: '8%', opacity: 0.25, delay: '0s' },
  { type: 'flash', size: 48, top: '20%', left: '85%', opacity: 0.2, delay: '1.5s' },
  { type: 'molotov', size: 56, top: '65%', left: '5%', opacity: 0.3, delay: '0.8s' },
  { type: 'he', size: 40, top: '70%', left: '90%', opacity: 0.25, delay: '2.2s' },
  { type: 'smoke', size: 36, top: '40%', left: '92%', opacity: 0.2, delay: '3s' },
  { type: 'flash', size: 44, top: '80%', left: '50%', opacity: 0.2, delay: '1s' },
];

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nadelauncher-backend-a99d397c.apps.deploypilot.stefankunde.dev';
  const steamLoginUrl = `${apiUrl}/auth/steam`;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      {/* ================================================================
          1. NAVIGATION BAR
          ================================================================ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass shadow-lg shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <Image src="/logo.png" alt="NadePro" width={600} height={262} className="shrink-0 h-20 w-auto -my-6" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#6b6b8a] hover:text-[#e8e8e8] text-sm font-medium transition-colors">
              Features
            </a>
            <a href="#maps" className="text-[#6b6b8a] hover:text-[#e8e8e8] text-sm font-medium transition-colors">
              Maps
            </a>
            <a href="#pricing" className="text-[#6b6b8a] hover:text-[#e8e8e8] text-sm font-medium transition-colors">
              Pricing
            </a>
            <a href={steamLoginUrl} className="btn-primary text-sm px-5 py-2">
              Login with Steam
            </a>
          </div>
        </div>
      </nav>

      {/* ================================================================
          2. HERO SECTION
          ================================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden smoke-bg">
        {/* Radial glow backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(240,165,0,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Floating decorative grenades */}
        {FLOATING_GRENADES.map((g, i) => (
          <div
            key={i}
            className="absolute pointer-events-none animate-float"
            style={{
              top: g.top,
              left: g.left,
              opacity: g.opacity,
              animationDelay: g.delay,
              animationDuration: '6s',
            }}
          >
            <GrenadeIcon type={g.type} size={g.size} glow />
          </div>
        ))}

        {/* CT Agent — left side */}
        <div className="absolute bottom-0 left-0 hidden lg:block pointer-events-none z-[1]" style={{ opacity: 0.12 }}>
          <Image
            src={CT_AGENT_IMAGE}
            alt=""
            width={350}
            height={500}
            className="object-contain"
            unoptimized
          />
        </div>

        {/* T Agent — right side */}
        <div className="absolute bottom-0 right-0 hidden lg:block pointer-events-none z-[1]" style={{ opacity: 0.12 }}>
          <Image
            src={T_AGENT_IMAGE}
            alt=""
            width={350}
            height={500}
            className="object-contain -scale-x-100"
            unoptimized
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight mb-6"
          >
            Master Every
            <br />
            <span className="text-gradient-gold">Grenade</span> in CS2
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[#6b6b8a] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Practice smokes, flashes, molotovs and HE grenades with precision.
            Save lineups, teleport to positions, and dominate every competitive map.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <a
              href={steamLoginUrl}
              className="btn-primary text-base px-8 py-3.5 font-bold"
            >
              Start Practicing &mdash; It&apos;s Free
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#features" className="btn-secondary text-base px-8 py-3.5 font-bold">
              <Play className="w-5 h-5" />
              Watch Demo
            </a>
          </motion.div>

          {/* Grenade type indicators */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex items-center justify-center gap-6 sm:gap-10 mb-16"
          >
            {GRENADE_TYPES.map((g) => (
              <div key={g.type} className="flex items-center gap-2">
                <GrenadeIcon type={g.type} size={24} glow />
                <span className="text-sm font-medium" style={{ color: g.color }}>
                  {g.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats row at bottom of hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="absolute bottom-0 left-0 right-0 border-t border-[#2a2a3e]/60"
        >
          <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
            {STATS.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && (
                  <div className="hidden sm:block w-px h-8 bg-[#2a2a3e] mr-3" />
                )}
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-gradient-gold">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#6b6b8a] uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ================================================================
          3. GRENADE SHOWCASE SECTION
          ================================================================ */}
      <section className="relative py-28 md:py-32">
        {/* Top separator line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#2a2a3e] to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Every Grenade Type, <span className="text-gradient-gold">Perfected</span>
            </h2>
            <p className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
              Four grenade categories, each with dedicated tools for mastering every lineup.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {GRENADE_TYPES.map((g, i) => (
              <motion.div
                key={g.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-xl overflow-hidden card-hover group"
              >
                {/* Colored top border */}
                <div className="h-1" style={{ background: g.color }} />

                <div className="p-6 flex flex-col items-center text-center">
                  <div
                    className="mb-5 transition-transform duration-300 group-hover:scale-110"
                  >
                    <GrenadeIcon type={g.type} size={56} glow />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: g.color }}>
                    {g.name}
                  </h3>
                  <p className="text-[#6b6b8a] text-sm leading-relaxed">
                    {g.description}
                  </p>
                </div>

                {/* Hover glow at bottom */}
                <div
                  className="h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${g.color}80, transparent)`,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          4. FEATURES SECTION
          ================================================================ */}
      <section id="features" className="relative py-28 md:py-32 bg-[#0c0c14]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#2a2a3e] to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why <span className="text-gradient-gold">NadePro</span>?
            </h2>
            <p className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
              Everything you need to perfect your utility game
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="glass rounded-xl p-6 card-hover group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#f0a500]/10 flex items-center justify-center mb-5 group-hover:bg-[#f0a500]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#f0a500]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#e8e8e8] mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-[#6b6b8a] text-sm leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
          5. MAP SHOWCASE SECTION
          ================================================================ */}
      <section id="maps" className="relative py-28 md:py-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#2a2a3e] to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Dominate <span className="text-gradient-gold">Every Map</span>
            </h2>
            <p className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
              Full lineup coverage across the entire Active Duty competitive map pool.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {MAPS.map((map, i) => (
              <motion.div
                key={map.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass rounded-xl overflow-hidden card-hover group"
              >
                {/* Gradient top strip */}
                <div
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${map.color}, ${map.color}66)`,
                  }}
                />

                <div className="p-6">
                  <h3
                    className="text-xl font-bold mb-1 group-hover:text-[#f0a500] transition-colors"
                  >
                    {map.display}
                  </h3>
                  <p className="text-[#6b6b8a] text-sm font-mono mb-4">
                    {map.name}
                  </p>
                  <Link
                    href={`/dashboard/maps/${map.name}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#f0a500] hover:text-[#ffd700] transition-colors"
                  >
                    Explore Lineups
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          6. PRICING SECTION
          ================================================================ */}
      <section id="pricing" className="relative py-28 md:py-32 bg-[#0c0c14]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#2a2a3e] to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple, <span className="text-gradient-gold">Transparent</span> Pricing
            </h2>
            <p className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass rounded-2xl p-7 flex flex-col"
            >
              <h3 className="text-xl font-bold text-[#e8e8e8] mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-[#e8e8e8]">$0</span>
                <span className="text-[#6b6b8a] ml-1">/forever</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm text-[#e8e8e8]">
                    <Check className="w-4 h-4 text-[#00c850] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href={steamLoginUrl}
                className="btn-secondary w-full text-center py-3 font-semibold"
              >
                Get Started Free
              </a>
            </motion.div>

            {/* Pro Tier (highlighted) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-2xl p-7 flex flex-col border border-[#f0a500]/40 glow-gold bg-[#12121a]"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#f0a500] to-[#d4920a] text-[#0a0a0f] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                Most Popular
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-[#f0a500]" />
                <h3 className="text-xl font-bold text-[#f0a500]">Pro</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gradient-gold">&euro;6.99</span>
                <span className="text-[#6b6b8a] ml-1">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm text-[#e8e8e8]">
                    <Check className="w-4 h-4 text-[#f0a500] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="btn-primary w-full text-center py-3 font-semibold opacity-60 cursor-not-allowed"
              >
                Coming Soon
              </button>
              <p className="text-[#6b6b8a] text-xs text-center mt-3">
                Coming Soon
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          7. CTA SECTION
          ================================================================ */}
      <section className="relative py-28 md:py-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#2a2a3e] to-transparent" />

        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(240,165,0,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-5">
              Ready to <span className="text-gradient-gold">Level Up</span> Your Game?
            </h2>
            <p className="text-[#6b6b8a] text-lg mb-10 max-w-xl mx-auto">
              Join thousands of players perfecting their utility. It&apos;s free to start.
            </p>
            <a
              href={steamLoginUrl}
              className="btn-primary text-lg px-10 py-4 font-bold inline-flex items-center gap-2"
            >
              Login with Steam
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-[#6b6b8a] text-sm mt-6">
              No credit card required &bull; Free forever &bull; Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          8. FOOTER
          ================================================================ */}
      <Footer />
    </div>
  );
}
