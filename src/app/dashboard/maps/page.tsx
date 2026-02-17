'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, FolderOpen, Share2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MAPS, MAP_COLORS } from '@/lib/constants';
import { collectionsApi, userCollectionsApi, communityApi } from '@/lib/api';
import type { LineupCollection } from '@/lib/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function MapsPage() {
  const [allCollections, setAllCollections] = useState<LineupCollection[]>([]);
  const [userCollections, setUserCollections] = useState<LineupCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handlePublish = async (collectionId: string) => {
    setPublishingId(collectionId);
    try {
      await communityApi.publish(collectionId, true);
      setUserCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, isPublished: true } : c)),
      );
      toast.success('Published to Community!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishingId(null);
    }
  };

  useEffect(() => {
    Promise.all([
      collectionsApi.getAllWithStatus().catch(() => []),
      userCollectionsApi.getMy().catch(() => []),
    ]).then(([cols, myCols]) => {
      setAllCollections(cols);
      setUserCollections(myCols);
      setLoading(false);
    });
  }, []);

  const mapData = useMemo(() => {
    const data: Record<string, { totalCollections: number }> = {};
    for (const map of MAPS) {
      const seen = new Set<string>();
      for (const c of allCollections) {
        if (c.mapName === map.name && c.isSubscribed) seen.add(c.id);
      }
      for (const c of userCollections) {
        if (c.mapName === map.name) seen.add(c.id);
      }
      data[map.name] = { totalCollections: seen.size };
    }
    return data;
  }, [allCollections, userCollections]);

  const unpublishedCollections = useMemo(
    () => userCollections.filter((c) => !c.isPublished),
    [userCollections],
  );

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#e8e8e8]">Maps</h1>
        <p className="text-[#6b6b8a] mt-1">
          Choose a map to manage your lineups
        </p>
      </div>

      {/* Publish Collections */}
      {!loading && unpublishedCollections.length > 0 && (
        <div className="mb-8 rounded-xl border border-[#6c5ce7]/20 bg-gradient-to-r from-[#6c5ce7]/5 to-[#12121a] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6c5ce7]/15">
              <Share2 className="h-4 w-4 text-[#6c5ce7]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#e8e8e8]">Publish Your Collections</h2>
              <p className="text-xs text-[#6b6b8a]">Share your collections with the community</p>
            </div>
          </div>
          <div className="space-y-2">
            {unpublishedCollections.map((c) => {
              const mapInfo = MAPS.find((m) => m.name === c.mapName);
              const mapColor = MAP_COLORS[c.mapName] || '#f0a500';
              const canPublish = c.lineupCount >= 5;
              const remaining = 5 - c.lineupCount;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg bg-[#0a0a0f]/50 border border-[#2a2a3e]/30 px-4 py-3"
                >
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: mapColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e8e8e8] truncate">{c.name}</p>
                    <p className="text-xs text-[#6b6b8a]">
                      {mapInfo?.displayName} · {c.lineupCount} lineup{c.lineupCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {canPublish ? (
                    <button
                      onClick={() => handlePublish(c.id)}
                      disabled={publishingId === c.id}
                      className="shrink-0 flex items-center gap-2 rounded-lg bg-[#6c5ce7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7c6df7] transition-colors disabled:opacity-50"
                    >
                      {publishingId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                      Publish
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs text-[#6b6b8a]">
                      {remaining} more lineup{remaining !== 1 ? 's' : ''} needed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50">
              <div className="h-44 bg-[#1a1a2e] animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-28 bg-[#1a1a2e] rounded animate-pulse" />
                <div className="h-3 w-48 bg-[#1a1a2e] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {MAPS.map((map) => {
            const color = MAP_COLORS[map.name] || '#f0a500';
            const stats = mapData[map.name];
            const collectionCount = stats?.totalCollections ?? 0;

            return (
              <motion.div key={map.name} variants={item}>
                <Link
                  href={`/dashboard/maps/${map.name}`}
                  className="group block rounded-2xl overflow-hidden bg-[#12121a] border border-[#2a2a3e]/50 transition-all duration-300 hover:border-[#2a2a3e] hover:shadow-lg hover:shadow-black/20"
                >
                  {/* Map Screenshot */}
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={map.screenshot}
                      alt={map.displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/40 to-transparent" />

                    {/* Map name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white tracking-tight">
                            {map.displayName}
                          </h2>
                          <p className="text-sm text-[#a0a0b0] mt-0.5">{map.name}</p>
                        </div>
                        <div
                          className="flex items-center gap-1.5 text-sm font-semibold opacity-0 translate-x-[-4px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                          style={{ color }}
                        >
                          Open
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Map color accent line */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-[#6b6b8a]" />
                      <span className="text-sm font-semibold text-[#e8e8e8]">
                        {collectionCount} {collectionCount === 1 ? 'Collection' : 'Collections'}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
