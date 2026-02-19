'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  Monitor,
  Crosshair,
  Save,
  Ghost,
  FolderOpen,
  Terminal,
  Keyboard,
  Settings,
  MousePointer,
  Eye,
  Lightbulb,
  Search,
  Play,
  Plug,
  MapPin,
  Target,
  FolderPlus,
  Share2,
  ArrowDown,
  Flame,
  Users,
  Swords,
} from 'lucide-react';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.04 } } };

/* ─── optimal workflow steps ─── */
const WORKFLOW_STEPS = [
  {
    icon: Search,
    title: 'Browse',
    desc: 'Explore pro & community collections',
    example: 'Find "Vitality vs G2" pro match',
    color: '#22c55e',
  },
  {
    icon: Play,
    title: 'Launch',
    desc: 'Start your private practice server',
    example: 'Click "Practice" on Inferno',
    color: '#22c55e',
  },
  {
    icon: Plug,
    title: 'Connect',
    desc: 'Paste connect command in CS2',
    example: 'connect 123.45.67.89:27015',
    color: '#22c55e',
  },
  {
    icon: MapPin,
    title: 'Explore',
    desc: 'Teleport to markers on the map',
    example: 'Browse B site smokes & flashes',
    color: '#3b82f6',
  },
  {
    icon: Target,
    title: 'Practice',
    desc: 'Follow ghost replays & throw',
    example: 'Learn the CT smoke from banana',
    color: '#3b82f6',
  },
  {
    icon: FolderPlus,
    title: 'Curate',
    desc: 'Add the best nades to your collection',
    example: 'Hold E → "Add to my B Execute"',
    color: '#f0a500',
  },
  {
    icon: Save,
    title: 'Discover',
    desc: 'Find your own throws & save them',
    example: '!savelast "New Coffin Molly"',
    color: '#f0a500',
  },
  {
    icon: Share2,
    title: 'Share',
    desc: 'Practice with mates or publish',
    example: 'Share collection with your team',
    color: '#a855f7',
  },
];

/* icon float animation — each step gets a slightly different timing */
const iconFloat = (i: number) => ({
  y: [0, -3, 0],
  transition: {
    duration: 2.5 + i * 0.3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
});

/* ─── example workflow scenarios ─── */
type ExampleStep = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  label: string;
  text: string;
};

type ExampleWorkflow = {
  title: string;
  subtitle: string;
  accent: string;
  result: string;
  steps: ExampleStep[];
};

const EXAMPLE_WORKFLOWS: ExampleWorkflow[] = [
  {
    title: 'Inferno B Execute',
    subtitle: 'Build a complete B take from pro lineups',
    accent: '#f0a500',
    result: 'A complete B execute collection with pro-quality smokes, flashes, and molotovs — ready to practice with your team.',
    steps: [
      { icon: Search, color: '#22c55e', label: 'Browse', text: 'Open "Vitality vs G2" pro collection on Inferno' },
      { icon: Target, color: '#3b82f6', label: 'Practice', text: 'Teleport to the CT smoke from banana — follow the ghost replay' },
      { icon: FolderPlus, color: '#f0a500', label: 'Add', text: 'Hold E → Add to your "Inferno B Execute" collection' },
      { icon: Swords, color: '#3b82f6', label: 'Repeat', text: 'Pick the coffin molly, site smoke, and entry flash the same way' },
      { icon: Save, color: '#f0a500', label: 'Create', text: 'Find your own deep banana molly → !savelast and add it too' },
      { icon: Users, color: '#a855f7', label: 'Share', text: 'Share the collection with your team or publish to community' },
    ],
  },
  {
    title: 'Mirage Mid-to-A',
    subtitle: 'Combine pro & community setups for a mid control take',
    accent: '#3b82f6',
    result: 'Your personal mid-to-A playbook with window smoke, connector flash, and jungle molly — picked from the best sources.',
    steps: [
      { icon: Search, color: '#22c55e', label: 'Browse', text: 'Check "NAVI vs FaZe" pro collection on Mirage' },
      { icon: Target, color: '#3b82f6', label: 'Learn', text: 'Practice the window smoke from T-spawn with ghost replay' },
      { icon: FolderPlus, color: '#f0a500', label: 'Collect', text: 'Add the window smoke + connector flash to "My Mirage A"' },
      { icon: Search, color: '#22c55e', label: 'Explore', text: 'Browse community collections for a creative jungle molly' },
      { icon: Save, color: '#f0a500', label: 'Discover', text: 'Experiment with a short flash from underpass → !savelast' },
      { icon: Users, color: '#a855f7', label: 'Team up', text: 'Share the collection — assign nades to teammates for the execute' },
    ],
  },
  {
    title: 'Dust2 Retake Kit',
    subtitle: 'Prepare post-plant utility for clutch situations',
    accent: '#22c55e',
    result: 'A focused retake collection with site-clearing mollies, pop flashes, and post-plant smokes for both sites.',
    steps: [
      { icon: Search, color: '#22c55e', label: 'Browse', text: 'Filter pro collections by "dust2" — look for retake setups' },
      { icon: MapPin, color: '#3b82f6', label: 'Explore', text: 'Use !filter molotov to see only molotov markers on the map' },
      { icon: Target, color: '#3b82f6', label: 'Practice', text: 'Learn the A-site platform molly from CT — repeat with !rethrow' },
      { icon: FolderPlus, color: '#f0a500', label: 'Curate', text: 'Add retake utility for both A and B into "D2 Retakes"' },
      { icon: Save, color: '#f0a500', label: 'Innovate', text: 'Discover a fast B door pop flash → !save "Quick B Flash"' },
      { icon: Target, color: '#3b82f6', label: 'Drill', text: 'Practice the full retake sequence — smokes, then mollies, then flash & peek' },
    ],
  },
  {
    title: 'Anubis Default Setup',
    subtitle: 'Learn the fundamentals of a newer map from pros',
    accent: '#a855f7',
    result: 'A solid default collection covering both sites — learn Anubis utility faster than anyone by standing on the shoulders of pros.',
    steps: [
      { icon: Search, color: '#22c55e', label: 'Browse', text: 'Find recent pro matches on Anubis in pro collections' },
      { icon: Target, color: '#3b82f6', label: 'Study', text: 'Go through each lineup — use ghost replays to understand movement' },
      { icon: FolderPlus, color: '#f0a500', label: 'Organize', text: 'Create "Anubis A Default" and "Anubis B Default" collections' },
      { icon: Search, color: '#22c55e', label: 'Cross-ref', text: 'Compare setups from different pro teams — keep the most consistent ones' },
      { icon: Save, color: '#f0a500', label: 'Adapt', text: 'Find variations that fit your style → !save with descriptive names' },
      { icon: Share2, color: '#a855f7', label: 'Publish', text: 'Publish to community — help others learn this map too' },
    ],
  },
];

const ROTATE_INTERVAL = 8000; // ms between auto-rotations

/* ─── guide section data ─── */
const GUIDE_SECTIONS = [
  {
    id: 'tips',
    icon: Lightbulb,
    title: 'Tips & Workflows',
    subtitle: 'Get the most out of NadePro',
    items: [
      {
        q: 'Build your ultimate collection',
        a: <>Create your own collection for each map and fill it with the best lineups from every source:{'\n\n'}1. Browse pro collections on the <Link href="/dashboard/maps" className="text-[#22c55e] hover:underline">Nades page</Link> to find proven lineups from professional matches{'\n'}2. Check <Link href="/dashboard/community" className="text-[#22c55e] hover:underline">community collections</Link> for creative setups from other players{'\n'}3. Add the ones you like to your own collection — in-game via the nade menu or on the website{'\n'}4. Discover your own throws in-game and save them with !save or !savelast{'\n\n'}Over time you&#39;ll have a personal collection of only the lineups that work best for your playstyle.</>,
      },
      {
        q: 'Practice with purpose',
        a: `Instead of randomly throwing nades, try focused practice sessions:\n\n• Pick a specific map side (e.g., T-side Mirage) and practice all your executes\n• Use !filter smoke to focus only on smokes, then switch to flashes\n• Practice the same lineup repeatedly until you can hit it without the ghost replay\n• Use !rethrow to instantly repeat a throw and compare your consistency`,
      },
      {
        q: 'Organize by strategy',
        a: `Create separate collections for different strategies or situations:\n\n• "Mirage A Execute" — all smokes and flashes for an A take\n• "Inferno Retakes" — post-plant molotovs and flashes\n• "Dust2 Favorites" — your go-to lineups for ranked\n\nThis way you can load exactly the set you want to practice instead of scrolling through everything.`,
      },
      {
        q: 'Learn from pro matches',
        a: <>Pro collections contain lineups extracted from actual professional matches and enhanced with AI-assisted analysis. Browse them on the <Link href="/dashboard/maps" className="text-[#22c55e] hover:underline">Nades page</Link>:{'\n\n'}• Learn the default smoke setups that pros rely on{'\n'}• Discover off-angle flashes you wouldn&#39;t think of{'\n'}• Understand how teams coordinate utility with team &amp; event collections{'\n'}• Copy the best ones into your own collection and adapt them to your playstyle</>,
      },
      {
        q: 'Share your knowledge',
        a: <>Found a great set of lineups? Publish your collection to the <Link href="/dashboard/community" className="text-[#22c55e] hover:underline">community</Link> so other players can subscribe and practice them. Building a reputation with quality lineups helps the entire NadePro community improve.</>,
      },
    ],
  },
  {
    id: 'getting-started',
    icon: Monitor,
    title: 'Getting Started',
    subtitle: 'Connect to your practice server',
    items: [
      {
        q: 'How do I start a practice session?',
        a: <>Go to the <Link href="/dashboard" className="text-[#22c55e] hover:underline">Dashboard</Link> or any map on the <Link href="/dashboard/maps" className="text-[#22c55e] hover:underline">Nades page</Link> and select a collection to practice. Click the &quot;Practice&quot; button — NadePro will spin up a private on-demand CS2 server for you. Once ready, the connect command appears automatically.</>,
      },
      {
        q: 'How do I connect to the server?',
        a: `Open the CS2 console (~) and paste the connect command shown on the website. The server will load the selected map with all your lineup markers ready to practice.`,
      },
      {
        q: 'Do I need to install anything?',
        a: `No. Just connect to the practice server via the CS2 console. There are no client-side mods or plugins required — everything runs on the server.`,
      },
      {
        q: 'Can other players join my server?',
        a: `No. Your practice server is completely private. Only you can connect to it.`,
      },
      {
        q: 'What maps are supported?',
        a: `All current Active Duty maps are always supported. When the map pool changes, NadePro updates accordingly.`,
      },
      {
        q: 'What settings are pre-configured?',
        a: `Everything is set up automatically for comfortable practice:\n\n• Infinite money & buy anywhere\n• Infinite ammo (sv_infinite_ammo 1)\n• God mode — you can't die\n• Auto-respawn on death\n• No freeze time, no bots\n• Grenade trajectory visible\n• Impact marks visible\n• Grenade preview enabled`,
      },
    ],
  },
  {
    id: 'markers',
    icon: Crosshair,
    title: 'Nade Markers & Interaction',
    subtitle: 'Teleport to lineups and practice throws',
    items: [
      {
        q: 'How do markers work?',
        a: `Each lineup is shown as a floating 3D grenade model on the map at its throw position. Markers are color-coded by grenade type:\n\n• Smoke — green\n• Flash — yellow\n• HE Grenade — red\n• Molotov — orange\n\nWalk close to a marker and look at it to highlight it.`,
      },
      {
        q: 'How do I teleport to a lineup?',
        a: `Look at a highlighted marker and press E. You'll instantly teleport to the throw position with the correct angles set. The lineup info (name, throw type, description) appears in chat.`,
      },
      {
        q: 'What is the release position beam?',
        a: `After teleporting to a lineup, you'll see a gold/yellow vertical beam at the exact spot where you need to release the grenade. As you walk closer, the beam changes from gold to green. A sound cue plays when you're at the right position.`,
      },
      {
        q: 'How do I open the edit menu on a marker?',
        a: `Hold E for about 1 second on a highlighted marker instead of tapping it. This opens the edit menu where you can rename the lineup, add a description, add it to another collection, or delete it (if you own it).`,
      },
    ],
  },
  {
    id: 'menu',
    icon: MousePointer,
    title: 'In-Game Menu Navigation',
    subtitle: 'Browse lineups and interact with menus',
    items: [
      {
        q: 'How does the in-game menu work?',
        a: `Menus appear as screen-centered text. Navigate by looking up or down with your mouse to highlight different options. Press E to select the highlighted option. A "►" indicator shows which option is currently selected.`,
      },
      {
        q: 'What menus are available?',
        a: `The main menu shows all grenade types (Smoke, Flash, HE, Molotov) plus an "All Lineups" option. Selecting a type shows all lineups of that type. Selecting a lineup shows its details including name, throw type, description, and a "Teleport here" button.\n\nYou can also open the map selection menu with !maps to switch maps and collections.`,
      },
      {
        q: 'How do I scroll through long menus?',
        a: `Menus show up to 4 options at a time. Look up or down to scroll through the list. You'll see "▲ more" at the top or "▼ more" at the bottom when there are additional options. A Cancel option is always at the bottom.`,
      },
      {
        q: 'What does "Hold E" do in menus?',
        a: `In certain menus (like the lineup detail view), holding E instead of tapping gives you edit/secondary actions. The menu footer will show "Hold E edit" when this is available.`,
      },
    ],
  },
  {
    id: 'saving',
    icon: Save,
    title: 'Saving Lineups',
    subtitle: 'Store your own nades with !save and !savelast',
    items: [
      {
        q: 'How do I save a new lineup from scratch?',
        a: `Stand at the position where you want to throw from and type !save (or !s) in chat. Optionally include a name: !save Xbox Smoke\n\n1. Your position is captured immediately\n2. The grenade type is auto-detected from your active weapon (or a menu appears if it can't detect it)\n3. A HUD message says "Throw the grenade now!" — you have 30 seconds\n4. Throw the grenade — the plugin records your exact release position, angles, movement path, and buttons pressed\n5. It waits for the grenade to land (15 second timeout)\n6. The lineup is saved with all data including landing position\n\nAfter saving, use !desc to add a description: !desc Short smoke for retake`,
      },
      {
        q: 'How do I save the last nade I just threw?',
        a: `Type !savelast (or !sl) right after throwing a grenade. Optionally include a name: !savelast CT Smoke\n\nThe plugin continuously tracks every grenade you throw, so !savelast uses the data from your most recent throw — no need to set up a position first. It saves instantly with all the recorded data (throw position, landing position, throw type, strength, movement path).`,
      },
      {
        q: 'How does throw type detection work?',
        a: `The plugin automatically detects the throw type from your movement during the throw:\n\n• Stationary — no movement\n• Jump Throw — jump without ground movement\n• Duck Throw — crouched, no jump\n• W-Jump Throw — press W on the ground, then jump\n• Run Throw — running forward without jumping (10+ units distance)\n• Walk Throw — holding walk key (shift) without jumping\n• Run + Jump Throw — running 50-200 units then jumping\n• Step + Jump Throw — short movement 5-50 units then jumping\n\nNo manual setup needed — just throw naturally.`,
      },
      {
        q: 'How does throw strength work?',
        a: `Throw strength is auto-detected from your mouse buttons during the throw:\n\n• Full throw — left click only\n• Medium throw — both left + right click\n• Short throw — right click only\n\nThe strength is saved with the lineup and shown to other players when they practice it.`,
      },
      {
        q: 'Can I add a description after saving?',
        a: `Yes. Right after saving a lineup, type !desc followed by your description:\n\n!desc Smokes off CT from short, bounce off the wall\n\nThe description is attached to your most recently saved lineup.`,
      },
    ],
  },
  {
    id: 'ghost',
    icon: Ghost,
    title: 'Ghost Replay',
    subtitle: 'Follow a ghost model through each throw',
    items: [
      {
        q: 'How do ghost replays work?',
        a: `When a lineup has a recorded movement path (most lineups saved with !save), a ghost model replays the exact movement like a real player. After teleporting to a lineup with a movement path, press E to start the ghost replay.\n\nThe ghost shows you the exact positioning, crosshair placement, movement path, and timing — just follow along and throw when the ghost throws.`,
      },
      {
        q: 'How do I start a ghost replay?',
        a: `After teleporting to a lineup (by pressing E on a marker), the chat will show "Press E to replay again" if the lineup has a movement path. Press E to start the replay. You can press E again during the replay to cancel it and stay at your current position.`,
      },
      {
        q: 'Do all lineups have ghost replays?',
        a: `Only lineups that have a recorded movement path show the ghost. Stationary throws (where you don't move) typically don't need a ghost — the release position beam is enough. Lineups that require movement (run throws, jump throws, W-jump throws) always have a ghost replay when saved with !save.`,
      },
    ],
  },
  {
    id: 'collections',
    icon: FolderOpen,
    title: 'Collection Management',
    subtitle: 'Switch collections and manage lineups in-game',
    items: [
      {
        q: 'How do I switch collections in-game?',
        a: `Type !maps in chat to open the map selection menu. Select a map, then choose which collection to load. Collections are grouped by type:\n\n• Your collections — shown first with lineup count\n• Community collections — marked with [COM]\n• Pro collections — marked with [PRO]\n\nAfter selecting a collection, the map changes and all lineup markers reload for that collection.`,
      },
      {
        q: 'How do I add a lineup to my collection from a marker?',
        a: <>Hold E on any lineup marker for about 1 second to open the edit menu. Select &quot;Add to collection&quot; to copy that lineup into one of your own collections. As a <Link href="/dashboard/premium" className="text-[#f0a500] hover:underline">Premium</Link> user, this works with any lineup from pro or community collections too.</>,
      },
      {
        q: 'Can I manage collections from the website?',
        a: <>Yes. The <Link href="/dashboard/maps" className="text-[#22c55e] hover:underline">Nades page</Link> lets you browse all lineups on the interactive radar map, add/remove lineups to collections, and switch which collection to practice. Changes sync automatically with your practice server.</>,
      },
      {
        q: 'Where do pro lineups come from?',
        a: `Pro lineups are curated from professional matches and demos, enhanced with AI-assisted analysis. They are organized into team & event collections so you can study specific pro strategies.`,
      },
      {
        q: 'Can I share my collections?',
        a: <>Yes. Publish a collection to the community and other users can subscribe to it, browse your lineups, and practice them on their own server. Visit the <Link href="/dashboard/community" className="text-[#22c55e] hover:underline">Community page</Link> to explore what others have shared.</>,
      },
    ],
  },
  {
    id: 'commands',
    icon: Terminal,
    title: 'All Chat Commands',
    subtitle: 'Complete reference of in-game commands',
    items: [
      {
        q: 'Save & Edit commands',
        a: `• !save / !s — Save current position as lineup (optionally: !save Name)\n• !savelast / !sl — Save last thrown grenade (optionally: !sl Name)\n• !desc <text> — Add description to last saved lineup\n• !rethrow / !r — Re-throw the last grenade you threw`,
      },
      {
        q: 'Navigation commands',
        a: `• !back — Teleport back to your last throw position\n• !maps — Open map & collection selection menu\n• !map <name> — Change to a specific map (e.g., !map dust2)\n• !markers — Refresh/reload all lineup markers`,
      },
      {
        q: 'Visual & Filter commands',
        a: `• !filter / !f <type> — Filter markers by grenade type (smoke, flash, he, molotov, all)\n• !show — Show all hidden lineup markers\n• !hide — Hide all lineup markers\n• !pos — Show your current position and view angles`,
      },
      {
        q: 'Practice utility commands',
        a: `• !noflash — Toggle flashbang immunity on/off\n• !clear / !c — Remove all active smoke, molotov, and decoy effects\n• !ff [seconds] — Fast-forward time (default 6 sec, max 120 sec)`,
      },
    ],
  },
  {
    id: 'keybinds',
    icon: Keyboard,
    title: 'Keybinds & Controls',
    subtitle: 'Key interactions during practice',
    items: [
      {
        q: 'E key (Use button)',
        a: `The E key is your main interaction key:\n\n• Tap E on a highlighted marker — Teleport to that lineup\n• Hold E (~1 sec) on a marker — Open the edit/detail menu\n• Tap E during ghost replay — Cancel the replay\n• Tap E in a menu — Select the highlighted option\n• Tap E during chat input — Cancel the input`,
      },
      {
        q: 'Mouse look in menus',
        a: `When a menu is open, look up or down with your mouse to navigate through options. The highlighted option has a "►" indicator. No extra keybinds needed — just your regular mouse movement and E key.`,
      },
      {
        q: 'Throw strength controls',
        a: `These are standard CS2 controls, but important for practicing:\n\n• Left click — Full throw\n• Right click — Short (underhand) throw\n• Left + Right click — Medium throw\n\nThe practice server detects which combination you used and records it when saving lineups.`,
      },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Recommended Console Settings',
    subtitle: 'Binds and settings for comfortable practice',
    items: [
      {
        q: 'Recommended keybinds',
        a: `Add these to your CS2 autoexec or type them in console:\n\n• bind "mouse5" "noclip" — Toggle noclip to fly around the map quickly\n• bind "mouse4" "say !rethrow" — Quick rethrow on mouse button\n\nNoclip is especially useful for quickly flying to different throw positions instead of walking.`,
      },
      {
        q: 'Useful console commands',
        a: `These are already enabled on the practice server, but good to know:\n\n• cl_grenadepreview 1 — Shows grenade trajectory preview while holding a nade\n• sv_grenade_trajectory_prac_picantico 1 — Shows colored trajectory lines after throwing\n• sv_showimpacts 1 — Shows bullet/grenade impact marks\n• sv_infinite_ammo 1 — Infinite grenades\n• mp_buy_anywhere 1 — Buy menu works everywhere\n\nAll of these are pre-configured on NadePro servers.`,
      },
      {
        q: 'Command prefixes',
        a: `All NadePro commands work with both ! and . prefixes. For example:\n\n• !save and .save both work\n• !rethrow and .rethrow both work\n\nUse whichever you prefer. The dot prefix is less visible in chat to other players.`,
      },
    ],
  },
];

/* ─── component ─── */
export default function GuidePage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [exampleIdx, setExampleIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextExample = useCallback(() => {
    setExampleIdx((prev) => (prev + 1) % EXAMPLE_WORKFLOWS.length);
  }, []);

  // Auto-rotate examples
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(nextExample, ROTATE_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, nextExample]);

  const goToExample = (i: number) => {
    setExampleIdx(i);
    // Reset timer on manual navigation
    if (timerRef.current) clearInterval(timerRef.current);
    if (!paused) timerRef.current = setInterval(nextExample, ROTATE_INTERVAL);
  };

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="flex gap-8"
    >
      {/* ── Left: Main guide content ── */}
      <div className="max-w-4xl flex-1 min-w-0">
        {/* Hero Header */}
        <motion.div variants={fadeUp} custom={0} className="mb-10">
          <div className="relative rounded-2xl overflow-hidden border border-[#2a2a3e]/50 bg-[#12121a]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 via-transparent to-[#22c55e]/2" />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22c55e]/40 to-transparent" />

            <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 border border-[#22c55e]/15">
                <BookOpen className="h-7 w-7 text-[#22c55e]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#e8e8e8] mb-1">In-Game Guide</h1>
                <p className="text-[#6b6b8a] text-sm sm:text-base">
                  Everything you need to know about using NadePro in CS2
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Reference Card */}
        <motion.div variants={fadeUp} custom={1} className="mb-10">
          <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-[#f0a500] via-[#f0a500]/30 to-transparent" />
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-4 w-4 text-[#f0a500]" />
                <h2 className="text-sm font-semibold text-[#e8e8e8]">Quick Reference</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { keys: 'E', desc: 'Teleport to marker / Select menu' },
                  { keys: 'Hold E', desc: 'Open edit menu on marker' },
                  { keys: '!save', desc: 'Save lineup from position' },
                  { keys: '!savelast', desc: 'Save last thrown nade' },
                  { keys: '!maps', desc: 'Switch map & collection' },
                  { keys: '!filter', desc: 'Filter by grenade type' },
                  { keys: '!rethrow', desc: 'Re-throw last grenade' },
                  { keys: '!noflash', desc: 'Toggle flash immunity' },
                  { keys: '!clear', desc: 'Remove smoke/fire effects' },
                ].map((item) => (
                  <div key={item.keys} className="flex items-center gap-3 rounded-lg bg-[#0a0a12] border border-[#2a2a3e]/20 px-3 py-2.5">
                    <code className="shrink-0 w-[4.5rem] text-center rounded-md bg-[#1a1a2e] border border-[#2a2a3e]/50 px-2 py-0.5 text-[11px] font-mono font-bold text-[#f0a500]">
                      {item.keys}
                    </code>
                    <span className="text-xs text-[#b8b8cc]">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Guide Sections */}
        <div className="space-y-6">
          {GUIDE_SECTIONS.map((section, sIdx) => (
            <motion.div key={section.id} variants={fadeUp} custom={sIdx + 2}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-3">
                <section.icon className="h-3.5 w-3.5 text-[#22c55e]/60" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e]/60">
                  {section.title}
                </span>
                <span className="text-[10px] text-[#6b6b8a]/40 ml-1">{section.subtitle}</span>
              </div>

              {/* Section card */}
              <div className="rounded-xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden divide-y divide-[#2a2a3e]/30">
                {section.items.map((item, i) => {
                  const key = `${section.id}-${i}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={i}>
                      <button
                        onClick={() => toggleItem(key)}
                        className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-all duration-200 ${
                          isOpen ? 'bg-[#1a1a2e]/60' : 'hover:bg-[#1a1a2e]/30'
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-200 ${
                            isOpen ? 'bg-[#22c55e]' : 'bg-[#2a2a3e]'
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
                            isOpen ? 'text-[#22c55e]' : 'text-[#6b6b8a]/50'
                          }`} />
                        </motion.div>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pl-[2.35rem] pt-1 pb-4 text-sm text-[#6b6b8a] leading-relaxed whitespace-pre-line">
                          {item.a}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right: Optimal Workflow (sticky, desktop only) ── */}
      <motion.aside
        variants={fadeUp}
        custom={0}
        className="hidden 2xl:block w-[340px] shrink-0"
      >
        <div className="sticky top-6 space-y-5">
          {/* ─ Workflow Timeline Card ─ */}
          <div className="rounded-2xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden">
            {/* Header glow line */}
            <div className="h-[2px] bg-gradient-to-r from-[#22c55e] via-[#3b82f6] via-[60%] to-[#a855f7]" />

            {/* Header */}
            <div className="px-6 pt-6 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b6b8a]/50 mb-1.5">
                Optimal Workflow
              </p>
              <h3 className="text-base font-bold text-[#e8e8e8]">
                From zero to pro
              </h3>
              <p className="text-[11px] text-[#6b6b8a] mt-1">
                The recommended path to master your utility game
              </p>
            </div>

            {/* Timeline */}
            <div className="px-6 py-5">
              {WORKFLOW_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isLast = i === WORKFLOW_STEPS.length - 1;
                return (
                  <div key={step.title} className="relative flex gap-4">
                    {/* Vertical line + animated icon */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={iconFloat(i)}
                        className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                          background: `linear-gradient(135deg, ${step.color}20 0%, ${step.color}08 100%)`,
                          borderColor: `${step.color}25`,
                          boxShadow: `0 0 12px ${step.color}10`,
                        }}
                      >
                        <StepIcon className="h-[18px] w-[18px]" style={{ color: step.color }} />
                      </motion.div>
                      {!isLast && (
                        <div className="relative flex flex-col items-center flex-1 min-h-[1.25rem]">
                          <div
                            className="w-px flex-1"
                            style={{
                              background: `linear-gradient(to bottom, ${step.color}30, ${WORKFLOW_STEPS[i + 1].color}15)`,
                            }}
                          />
                          <ArrowDown
                            className="h-3 w-3 -mt-0.5 -mb-0.5 shrink-0"
                            style={{ color: `${WORKFLOW_STEPS[i + 1].color}40` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pt-1 min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
                      <p className="text-[13px] font-bold" style={{ color: step.color }}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-[#8b8ba0] leading-snug mt-0.5">
                        {step.desc}
                      </p>
                      {/* Example tag */}
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[#0a0a12] border border-[#2a2a3e]/30 px-2 py-1">
                        <div className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: `${step.color}60` }} />
                        <span className="text-[10px] text-[#6b6b8a] truncate">{step.example}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Repeat hint */}
            <div className="mx-6 mb-6 rounded-lg bg-gradient-to-r from-[#a855f7]/5 via-[#22c55e]/5 to-[#f0a500]/5 border border-[#2a2a3e]/20 px-3 py-2.5 text-center">
              <p className="text-[10px] text-[#6b6b8a]">
                Repeat the cycle to keep improving
              </p>
            </div>
          </div>

          {/* ─ Rotating Example Workflows ─ */}
          <div
            className="rounded-2xl border border-[#2a2a3e]/50 bg-[#12121a] overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Accent line that matches current example */}
            <motion.div
              className="h-[2px]"
              animate={{
                background: `linear-gradient(to right, ${EXAMPLE_WORKFLOWS[exampleIdx].accent}, ${EXAMPLE_WORKFLOWS[exampleIdx].accent}50, transparent)`,
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Header with dot indicators */}
            <div className="px-6 pt-5 pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5 text-[#f0a500]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f0a500]/60">
                    Example Workflows
                  </p>
                </div>
                {/* Dot navigation */}
                <div className="flex items-center gap-1.5">
                  {EXAMPLE_WORKFLOWS.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => goToExample(i)}
                      className="relative p-0.5"
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === exampleIdx ? 'w-4' : 'w-1.5'
                        }`}
                        style={{
                          backgroundColor: i === exampleIdx ? EXAMPLE_WORKFLOWS[i].accent : '#2a2a3e',
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Animated title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={exampleIdx}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-sm font-bold text-[#e8e8e8]">
                    {EXAMPLE_WORKFLOWS[exampleIdx].title}
                  </h3>
                  <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                    {EXAMPLE_WORKFLOWS[exampleIdx].subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Auto-rotate progress bar */}
            <div className="mx-6 h-px bg-[#2a2a3e]/30 overflow-hidden">
              <motion.div
                key={`progress-${exampleIdx}-${paused}`}
                className="h-full"
                style={{ backgroundColor: `${EXAMPLE_WORKFLOWS[exampleIdx].accent}40` }}
                initial={{ width: '0%' }}
                animate={{ width: paused ? undefined : '100%' }}
                transition={paused ? {} : { duration: ROTATE_INTERVAL / 1000, ease: 'linear' }}
              />
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              <motion.div
                key={exampleIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="px-6 py-4 space-y-3"
              >
                {EXAMPLE_WORKFLOWS[exampleIdx].steps.map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="flex gap-3 items-start"
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border mt-0.5"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}05 100%)`,
                          borderColor: `${item.color}20`,
                        }}
                      >
                        <ItemIcon className="h-3.5 w-3.5" style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: item.color }}>
                          {item.label}
                        </span>
                        <p className="text-[11px] text-[#8b8ba0] leading-snug">
                          {item.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Result banner */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`result-${exampleIdx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mx-6 mb-6 rounded-lg border overflow-hidden"
                style={{ borderColor: `${EXAMPLE_WORKFLOWS[exampleIdx].accent}20` }}
              >
                <div
                  className="px-4 py-3"
                  style={{
                    background: `linear-gradient(to right, ${EXAMPLE_WORKFLOWS[exampleIdx].accent}12, ${EXAMPLE_WORKFLOWS[exampleIdx].accent}05)`,
                  }}
                >
                  <p className="text-[11px] font-semibold mb-0.5" style={{ color: EXAMPLE_WORKFLOWS[exampleIdx].accent }}>
                    Result
                  </p>
                  <p className="text-[11px] text-[#8b8ba0] leading-snug">
                    {EXAMPLE_WORKFLOWS[exampleIdx].result}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
