"use client";

import { useState, useEffect } from "react";
import { ListPlus, Check, Plus, X, FolderHeart, Sparkles } from "lucide-react";
import {
  getPlaylists,
  createPlaylist,
  togglePlaylistItem,
  Playlist,
  PlaylistItem,
} from "@/lib/playlists";

const EMOJI_OPTIONS = ["🔥", "🌙", "🎬", "💋", "💎", "🌸", "⚡", "🍿", "🖤", "👑"];

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
  const [selectedEmoji, setSelectedEmoji] = useState("🔥");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync playlists from storage
  const sync = () => {
    setPlaylists(getPlaylists());
  };

  useEffect(() => {
    sync();
    window.addEventListener("playlists-change", sync);
    return () => window.removeEventListener("playlists-change", sync);
  }, []);

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

    const pl = createPlaylist(newTitle.trim(), selectedEmoji);
    // Automatically add current video to the newly created playlist
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
    setFeedback(`Created "${pl.name}" and added video!`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/15 text-xs font-semibold text-purple-200 transition-all hover:bg-purple-500/25 active:scale-95 shadow-sm ${
          compact ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
        title="Add video to custom playlist"
      >
        <ListPlus className="h-3.5 w-3.5 text-purple-400" />
        <span>Playlist</span>
      </button>

      {/* Glassmorphic Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c1017] border border-white/10 p-5 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <FolderHeart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Save to Playlist</h3>
                  <p className="text-[11px] text-white/50 truncate max-w-[240px]">
                    {item.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notification Feedback Toast */}
            {feedback && (
              <div className="mt-3 py-1.5 px-3 rounded-lg bg-purple-500/20 border border-purple-500/40 text-center text-xs font-semibold text-purple-300 animate-in fade-in duration-150">
                ✨ {feedback}
              </div>
            )}

            {/* Playlists List */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {playlists.map((pl) => {
                const isSaved = pl.items.some(
                  (i) => i.id === item.id || (i.slug && i.slug === item.slug)
                );
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => handleToggle(pl.id, pl.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      isSaved
                        ? "bg-purple-900/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none">{pl.emoji || "🎬"}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{pl.name}</div>
                        <div className="text-[10px] text-white/50">{pl.items.length} videos</div>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                        isSaved
                          ? "bg-purple-500 border-purple-400 text-white"
                          : "border-white/20 bg-transparent text-transparent"
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create New Playlist Form */}
            {creating ? (
              <form onSubmit={handleCreateNew} className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/80">New Playlist</span>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="text-[11px] text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Emoji selector */}
                  <div className="flex gap-1 overflow-x-auto py-1 max-w-full">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setSelectedEmoji(e)}
                        className={`text-base p-1 rounded-lg transition-transform ${
                          selectedEmoji === e ? "bg-white/20 scale-110" : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Playlist name (e.g. Late Night Favs)..."
                    autoFocus
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-xs font-semibold text-white/70 hover:text-white hover:border-purple-400/50 hover:bg-purple-500/10 transition-all"
              >
                <Plus className="h-3.5 w-3.5 text-purple-400" />
                <span>Create New Playlist</span>
              </button>
            )}

            {/* Footer link to full playlists manager */}
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <a
                href="/playlists"
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Manage all playlists →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
