"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Star,
  Clock,
  Play,
  FolderHeart,
  ChevronRight,
  ListVideo,
  ShieldCheck,
} from "lucide-react";
import {
  Playlist,
  getCommunityPlaylists,
} from "@/lib/playlists";

interface CommunityPlaylistsSectionProps {
  currentSection?: "lust" | "jax" | "fans";
}

export function CommunityPlaylistsSection({ currentSection }: CommunityPlaylistsSectionProps) {
  const [activeTab, setActiveTab] = useState<"trending" | "top" | "recent" | "staff">("trending");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadPlaylists = () => {
    const list = getCommunityPlaylists(activeTab, 6);
    setPlaylists(list);
  };

  useEffect(() => {
    setMounted(true);
    loadPlaylists();
  }, [activeTab]);

  useEffect(() => {
    if (!mounted) return;
    const handleSync = () => loadPlaylists();
    window.addEventListener("playlists-change", handleSync);
    window.addEventListener("playlist-rated", handleSync);
    return () => {
      window.removeEventListener("playlists-change", handleSync);
      window.removeEventListener("playlist-rated", handleSync);
    };
  }, [mounted, activeTab]);

  if (!mounted || playlists.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-14 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 border border-white/10 text-white">
              <ListVideo className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Community Curations
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Explore Playlists</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Mixtapes and continuous binge queues curated by the community
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("trending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "trending"
                ? "bg-white text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Trending</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "top"
                ? "bg-white text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Top Rated</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "recent"
                ? "bg-white text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Recent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "staff"
                ? "bg-white text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Staff Picks</span>
          </button>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {playlists.map((pl) => {
          const firstVideo = pl.items[0];
          const playLink = firstVideo
            ? `/title/${firstVideo.section || "lust"}/${firstVideo.slug || firstVideo.id}?playlist=${encodeURIComponent(pl.id)}&index=0`
            : `/playlists/${pl.id}`;

          return (
            <div
              key={pl.id}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0e121a] overflow-hidden hover:border-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60"
            >
              {/* Thumbnail Container (2x2 Mosaic or Single Cover) */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/80">
                {pl.items.length >= 4 ? (
                  <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
                    {pl.items.slice(0, 4).map((vid, idx) => (
                      <div key={idx} className="relative h-full w-full overflow-hidden bg-zinc-900">
                        <img
                          src={vid.thumbnailUrl || vid.coverUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                ) : pl.items.length > 0 ? (
                  <img
                    src={pl.items[0].thumbnailUrl || pl.items[0].coverUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    {pl.emoji || "🎬"}
                  </div>
                )}

                {/* Video Count Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
                  <ListVideo className="h-3 w-3" />
                  <span>{pl.items.length} videos</span>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md border border-white/10">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                  <span>{pl.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">({pl.ratingCount})</span>
                </div>

                {/* Instant Play Overlay */}
                <Link
                  href={playLink}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                  title="Play all sequentially"
                >
                  <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black shadow-xl hover:scale-105 active:scale-95 transition-transform">
                    <Play className="h-4 w-4 fill-black" />
                    <span>Play All</span>
                  </div>
                </Link>
              </div>

              {/* Metadata Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      {pl.authorAvatar ? (
                        <img
                          src={pl.authorAvatar}
                          alt=""
                          className="h-4 w-4 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <span className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                          👤
                        </span>
                      )}
                      <span className="font-medium truncate max-w-[140px]">
                        @{pl.authorName}
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-500 tabular-nums">
                      {pl.views.toLocaleString()} plays
                    </span>
                  </div>

                  <Link
                    href={`/playlists/${pl.id}`}
                    className="font-bold text-sm sm:text-base text-white hover:text-zinc-200 line-clamp-1 transition-colors"
                  >
                    {pl.name}
                  </Link>

                  {pl.description && (
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {pl.description}
                    </p>
                  )}
                </div>

                {/* Footer link to detail page */}
                <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {pl.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/playlists/${pl.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white transition-colors"
                  >
                    <span>View playlist</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner Link to Personal Playlists */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <FolderHeart className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Create & Share Your Own Playlists</h4>
            <p className="text-[11px] text-zinc-400">Curate any video into custom collections, set them public or private, and share with everyone.</p>
          </div>
        </div>

        <Link
          href="/playlists"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all active:scale-95 border border-white/10"
        >
          <span>My Playlists</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

