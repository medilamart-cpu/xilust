"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ListPlus, Check, Plus, X, FolderHeart, Sparkles, Heart, Film, Star, Clock } from "lucide-react";
import {
  getPlaylists,
  createPlaylist,
  togglePlaylistItem,
  Playlist,
} from "@/lib/playlists";

const THEME_ICONS: Record<string, typeof Heart> = {
  fav: Heart,
  film: Film,
  star: Star,
  clock: Clock,
  sparkles: Sparkles,
  folder: FolderHeart,
};

const THEME_OPTIONS = [
  { id: "fav", label: "Favorites", icon: Heart },
  { id: "film", label: "Cinema Hits", icon: Film },
  { id: "star", label: "VIP Vault", icon: Star },
  { id: "clock", label: "Watch Later", icon: Clock },
  { id: "sparkles", label: "Spotlight", icon: Sparkles },
  { id: "folder", label: "Collection", icon: FolderHeart },
];

interface AddToPlaylistProps {
  item: {
    id: string | number;
    title: string;
    slug: string;
    section: string;
    thumbnailUrl?: string;
    coverUrl?: string;
    duration?: string;
  };
  compact?: boolean;
}

export function AddToPlaylistModal({ item, compact = false }: AddToPlaylistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("fav");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync playlists from storage
  const sync = () => {
    setPlaylists(getPlaylists());
  };

  useEffect(() => {
    sync();
    const handleSync = () => sync();
    window.addEventListener("playlists-change", handleSync);
    return () => window.removeEventListener("playlists-change", handleSync);
  }, []);

  // Escape key listener for dialog accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = (playlistId: string, plName: string) => {
    const added = togglePlaylistItem(playlistId, {
      id: String(item.id),
      title: item.title,
      slug: item.slug,
      section: item.section,
      thumbnailUrl: item.thumbnailUrl,
      coverUrl: item.coverUrl,
      duration: item.duration,
    });

    sync();
    setFeedback(added ? `Added to "${plName}"` : `Removed from "${plName}"`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const pl = createPlaylist(newTitle.trim(), selectedTheme, "", "private", "You");
    togglePlaylistItem(pl.id, {
      id: String(item.id),
      title: item.title,
      slug: item.slug,
      section: item.section,
      thumbnailUrl: item.thumbnailUrl,
      coverUrl: item.coverUrl,
      duration: item.duration,
    });

    sync();
    setNewTitle("");
    setCreating(false);
    setFeedback(`Created "${pl.name}" and added video`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0e121a] text-xs font-semibold text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 shadow-sm ${
          compact ? "px-3 py-1.5" : "px-3.5 py-2"
        }`}
        title="Add video to custom playlist"
      >
        <ListPlus className="h-3.5 w-3.5" />
        <span>Playlist</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="playlist-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c1017] border border-white/10 p-5 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
                  <FolderHeart className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="playlist-modal-title" className="text-sm font-bold text-white">
                    Save to Playlist
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                    {item.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notification Feedback Toast */}
            {feedback && (
              <div className="mt-3 py-1.5 px-3 rounded-lg bg-white/10 border border-white/15 text-center text-xs font-semibold text-white transition-opacity">
                {feedback}
              </div>
            )}

            {/* Playlists List */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {playlists.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  No playlists yet. Create one below!
                </div>
              ) : (
                playlists.map((pl) => {
                  const isSaved = pl.items.some(
                    (i) => i.id === item.id || (i.slug && i.slug === item.slug)
                  );
                  const Icon = THEME_ICONS[pl.emoji] || FolderHeart;

                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => handleToggle(pl.id, pl.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        isSaved
                          ? "bg-white/[0.08] border-white/30 shadow-sm"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg border ${isSaved ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.03] border-white/5 text-zinc-400"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{pl.name}</div>
                          <div className="text-[10px] text-zinc-400 tabular-nums">{pl.items.length} videos</div>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                          isSaved
                            ? "bg-white border-white text-black"
                            : "border-white/20 bg-transparent text-transparent"
                        }`}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Create New Playlist Form */}
            {creating ? (
              <form onSubmit={handleCreateNew} className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">New Playlist</span>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="text-[11px] text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {/* Theme icon selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                  {THEME_OPTIONS.map((t) => {
                    const TIcon = t.icon;
                    const isSelected = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className={`p-2 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-white text-black border-white shadow-sm"
                            : "bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white hover:bg-white/[0.08]"
                        }`}
                        title={t.label}
                      >
                        <TIcon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Playlist name..."
                    autoFocus
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all active:scale-95"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/40 hover:bg-white/[0.04] transition-all active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Playlist</span>
              </button>
            )}

            {/* Footer link to full playlists manager */}
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <Link
                href="/playlists"
                className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Manage all playlists →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
