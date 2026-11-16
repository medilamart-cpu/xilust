"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Shuffle,
  Share2,
  BookmarkPlus,
  Star,
  Globe,
  Lock,
  Clock,
  Film,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkles,
  ListVideo,
  ListPlus,
  Copy,
} from "lucide-react";
import {
  Playlist,
  getPlaylistById,
  ratePlaylist,
  getUserPlaylistRating,
  duplicatePlaylistToPersonal,
  removeFromPlaylist,
  reorderPlaylistItems,
  setPlaylistVisibility,
} from "@/lib/playlists";

interface PlaylistDetailClientProps {
  id: string;
}

export function PlaylistDetailClient({ id }: PlaylistDetailClientProps) {
  const router = useRouter();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadPlaylist = () => {
    const pl = getPlaylistById(id);
    if (pl) {
      setPlaylist(pl);
      setIsOwner(pl.authorId === "user_me" || pl.id.startsWith("pl_"));
      setUserRating(getUserPlaylistRating(pl.id));
    }
  };

  useEffect(() => {
    loadPlaylist();
    const handleSync = () => loadPlaylist();
    window.addEventListener("playlists-change", handleSync);
    window.addEventListener("playlist-rated", handleSync);
    return () => {
      window.removeEventListener("playlists-change", handleSync);
      window.removeEventListener("playlist-rated", handleSync);
    };
  }, [id]);

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-white flex flex-col items-center justify-center p-4">
        <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
          🔍
        </div>
        <h2 className="text-xl font-bold text-white">Playlist not found</h2>
        <p className="mt-1 text-xs text-zinc-400">This playlist may have been deleted or is set to private.</p>
        <Link
          href="/playlists"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Browse Playlists</span>
        </Link>
      </div>
    );
  }

  const handleRate = (stars: number) => {
    const res = ratePlaylist(playlist.id, stars);
    if (res.success) {
      setUserRating(stars);
      showToast(`Rated ${stars} stars! Thank you for supporting community curation.`);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      showToast("Playlist share link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleDuplicate = () => {
    const cloned = duplicatePlaylistToPersonal(playlist);
    showToast(`Saved "${cloned.name}" to your library!`);
    router.push("/playlists");
  };

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (!isOwner) return;
    reorderPlaylistItems(playlist.id, fromIdx, toIdx);
  };

  const handleRemove = (itemId: string) => {
    if (!isOwner) return;
    removeFromPlaylist(playlist.id, itemId);
    showToast("Removed video from playlist.");
  };

  const handleTogglePrivacy = () => {
    if (!isOwner) return;
    const next = playlist.visibility === "public" ? "private" : "public";
    setPlaylistVisibility(playlist.id, next);
    showToast(`Playlist is now ${next.toUpperCase()}`);
  };

  const firstVideo = playlist.items[0];
  const playAllHref = firstVideo
    ? `/title/${firstVideo.section || "lust"}/${firstVideo.slug || firstVideo.id}?playlist=${encodeURIComponent(playlist.id)}&index=0`
    : "#";

  const shuffleHref = firstVideo
    ? `/title/${firstVideo.section || "lust"}/${firstVideo.slug || firstVideo.id}?playlist=${encodeURIComponent(playlist.id)}&index=0&shuffle=1`
    : "#";

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8] pb-24">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-xl px-4 sm:px-8 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/playlists"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Playlists</span>
          </Link>
          <span className="text-zinc-600 text-xs hidden sm:inline">/</span>
          <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs hidden sm:inline">
            {playlist.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-all active:scale-95"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isCopied ? "Copied" : "Share"}</span>
          </button>

          {!isOwner && (
            <button
              type="button"
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Banner Section */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#111724] to-[#080a0f] px-4 sm:px-8 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Cover Collage (2x2 Mosaic or Large Cover) */}
          <div className="relative h-48 w-48 sm:h-56 sm:w-56 shrink-0 overflow-hidden rounded-2xl bg-black/60 border border-white/15 shadow-2xl">
            {playlist.items.length >= 4 ? (
              <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
                {playlist.items.slice(0, 4).map((vid, idx) => (
                  <img
                    key={idx}
                    src={vid.thumbnailUrl || vid.coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ))}
              </div>
            ) : playlist.items.length > 0 ? (
              <img
                src={playlist.items[0].thumbnailUrl || playlist.items[0].coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                {playlist.emoji || "🎬"}
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 min-w-0 flex flex-col justify-between text-center md:text-left">
            <div>
              {/* Badges Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2.5">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                  {playlist.visibility === "public" ? (
                    <>
                      <Globe className="h-3 w-3 text-cyan-400" />
                      <span>Public Collection</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 text-amber-300" />
                      <span>Private Playlist</span>
                    </>
                  )}
                </span>

                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-zinc-400">
                  {playlist.items.length} titles
                </span>

                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-zinc-400">
                  {playlist.views.toLocaleString()} plays
                </span>

                {isOwner && (
                  <button
                    type="button"
                    onClick={handleTogglePrivacy}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition-all active:scale-95"
                  >
                    Switch to {playlist.visibility === "public" ? "Private" : "Public"}
                  </button>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {playlist.name}
              </h1>

              {/* Creator & Date */}
              <div className="mt-2.5 flex items-center justify-center md:justify-start gap-2 text-xs text-zinc-400">
                <span>Curated by</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  {playlist.authorAvatar && (
                    <img src={playlist.authorAvatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                  )}
                  @{playlist.authorName}
                </span>
                <span>•</span>
                <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
              </div>

              {/* Description */}
              {playlist.description && (
                <p className="mt-3 text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                  {playlist.description}
                </p>
              )}
            </div>

            {/* Ratings & Action Buttons Cluster */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Interactive Star Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-300">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => handleRate(star)}
                      title={`Rate ${star} stars`}
                      className="p-0.5 hover:scale-125 transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          (hoverRating !== null ? star <= hoverRating : star <= Math.round(playlist.rating))
                            ? "fill-amber-300 text-amber-300"
                            : "text-zinc-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="text-xs">
                  <span className="font-bold text-white text-sm tabular-nums mr-1">
                    {playlist.rating.toFixed(2)}
                  </span>
                  <span className="text-zinc-400">({playlist.ratingCount} ratings)</span>
                  {userRating && (
                    <span className="ml-2 text-emerald-400 font-semibold">• Rated {userRating}★</span>
                  )}
                </div>
              </div>

              {/* Primary Transport Actions */}
              <div className="flex items-center gap-2.5">
                {playlist.items.length > 0 && (
                  <>
                    <Link
                      href={playAllHref}
                      className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black shadow-xl hover:bg-zinc-200 transition-all active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-black" />
                      <span>Play All</span>
                    </Link>

                    <Link
                      href={shuffleHref}
                      className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                      title="Shuffle playback"
                    >
                      <Shuffle className="h-4 w-4 text-zinc-300" />
                      <span className="hidden sm:inline">Shuffle</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos List / Tracklist Table */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <ListVideo className="h-4 w-4 text-zinc-400" />
            <span>Playlist Tracklist ({playlist.items.length})</span>
          </h2>

          {isOwner && (
            <span className="text-xs text-zinc-500">
              Drag or use arrows to reorder
            </span>
          )}
        </div>

        {playlist.items.length > 0 ? (
          <div className="space-y-2">
            {playlist.items.map((item, idx) => {
              const watchLink = `/title/${item.section || "lust"}/${item.slug || item.id}?playlist=${encodeURIComponent(playlist.id)}&index=${idx}`;

              return (
                <div
                  key={item.id + idx}
                  className="group flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-white/5 bg-[#0e121a] hover:bg-white/[0.04] hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Index Number */}
                    <span className="w-6 text-center text-xs font-bold text-zinc-500 tabular-nums">
                      {idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="relative h-14 w-24 sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-black/60 border border-white/10">
                      {item.thumbnailUrl || item.coverUrl ? (
                        <img
                          src={item.thumbnailUrl || item.coverUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                          <Film className="h-5 w-5" />
                        </div>
                      )}

                      {item.duration && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white">
                          {item.duration}
                        </span>
                      )}

                      <Link
                        href={watchLink}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="h-4 w-4 fill-white text-white" />
                      </Link>
                    </div>

                    {/* Title & Section */}
                    <div className="min-w-0">
                      <Link
                        href={watchLink}
                        className="font-bold text-xs sm:text-sm text-white hover:text-zinc-200 line-clamp-1 transition-colors"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
                          {item.section || "lust"}
                        </span>
                        <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isOwner && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, idx - 1)}
                          disabled={idx === 0}
                          title="Move up"
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, idx + 1)}
                          disabled={idx === playlist.items.length - 1}
                          title="Move down"
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id || item.slug)}
                          title="Remove video"
                          className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <Link
                      href={watchLink}
                      className="hidden sm:flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      <span>Watch</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <ListPlus className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">This playlist has no videos</h3>
            <p className="mt-1 text-xs text-zinc-400">Add videos while watching or browsing the catalog.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-black"
            >
              Browse Catalog
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
