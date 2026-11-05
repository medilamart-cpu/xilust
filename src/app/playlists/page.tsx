"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderHeart,
  Plus,
  Play,
  Trash2,
  Film,
  Sparkles,
  Clock,
  ChevronRight,
  X,
  ExternalLink,
  Heart,
  Star,
  Bookmark,
} from "lucide-react";
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  removeFromPlaylist,
  Playlist,
  PlaylistItem,
} from "@/lib/playlists";

const THEME_ICONS = [
  { id: "fav", label: "Favorites", icon: Heart },
  { id: "film", label: "Feature Films", icon: Film },
  { id: "star", label: "VIP Vault", icon: Star },
  { id: "clock", label: "Watch Later", icon: Clock },
  { id: "sparkles", label: "Spotlight", icon: Sparkles },
  { id: "folder", label: "Collection", icon: FolderHeart },
];

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("fav");

  const sync = () => {
    const list = getPlaylists();
    setPlaylists(list);
    if (!selectedPlaylistId && list.length > 0) {
      setSelectedPlaylistId(list[0].id);
    }
  };

  useEffect(() => {
    sync();
    window.addEventListener("playlists-change", sync);
    return () => window.removeEventListener("playlists-change", sync);
  }, []);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = createPlaylist(newTitle.trim(), selectedTheme, newDesc.trim());
    sync();
    setSelectedPlaylistId(created.id);
    setNewTitle("");
    setNewDesc("");
    setShowCreateModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deletePlaylist(id);
      sync();
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
      }
    }
  };

  const handleRemoveItem = (plId: string, itemId: string) => {
    removeFromPlaylist(plId, itemId);
    sync();
  };

  const getPlaylistThemeIcon = (emojiOrTheme?: string) => {
    const found = THEME_ICONS.find((t) => t.id === emojiOrTheme);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FolderHeart className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8] pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-xl px-4 sm:px-8 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/15 text-white">
              <FolderHeart className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                My Playlists
              </h1>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black shadow-md hover:bg-neutral-200 transition-all active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Playlist</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Sidebar: Playlists List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                Playlists ({playlists.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {playlists.map((pl) => {
                const isActive = pl.id === selectedPlaylist?.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] ${
                      isActive
                        ? "bg-[#0e121a] border-white/20 ring-1 ring-white/10 text-white shadow-md"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80">
                        {getPlaylistThemeIcon(pl.emoji)}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-xs sm:text-sm font-bold truncate ${isActive ? "text-white" : "text-white/80"}`}>
                          {pl.name}
                        </h3>
                        <p className="text-[11px] text-white/40 tabular-nums">
                          {pl.items.length} {pl.items.length === 1 ? "video" : "videos"}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "text-white translate-x-0.5" : "text-white/30"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content: Active Playlist Viewer */}
          <div className="lg:col-span-3">
            {selectedPlaylist ? (
              <div className="space-y-6">
                {/* Playlist Banner Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1017] p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* 2x2 Mosaic or Theme Icon */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center">
                        {selectedPlaylist.items.length >= 4 ? (
                          <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                            {selectedPlaylist.items.slice(0, 4).map((vid, vIdx) => (
                              <img
                                key={vIdx}
                                src={vid.thumbnailUrl || vid.coverUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ))}
                          </div>
                        ) : selectedPlaylist.items.length > 0 ? (
                          <img
                            src={selectedPlaylist.items[0].thumbnailUrl || selectedPlaylist.items[0].coverUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-white/40">
                            {getPlaylistThemeIcon(selectedPlaylist.emoji)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {selectedPlaylist.name}
                          </h2>
                          <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white/80">
                            Custom Playlist
                          </span>
                        </div>
                        {selectedPlaylist.description && (
                          <p className="mt-1 text-xs text-white/60">
                            {selectedPlaylist.description}
                          </p>
                        )}
                        <p className="mt-1.5 text-[11px] text-white/40 flex items-center gap-2 tabular-nums">
                          <span>{selectedPlaylist.items.length} titles</span>
                          <span>•</span>
                          <span>Updated {new Date(selectedPlaylist.updatedAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedPlaylist.items.length > 0 && (
                        <Link
                          href={`/title/${selectedPlaylist.items[0].section || "lust"}/${selectedPlaylist.items[0].slug || selectedPlaylist.items[0].id}`}
                          className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-bold text-black shadow-md hover:bg-neutral-200 transition-all active:scale-95"
                        >
                          <Play className="h-3.5 w-3.5 fill-black" />
                          <span>Play All</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(selectedPlaylist.id, selectedPlaylist.name)}
                        className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95"
                        title="Delete playlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Videos Grid */}
                {selectedPlaylist.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPlaylist.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#121622]/60 overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/20"
                      >
                        {/* Video Thumbnail Preview */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                          {item.thumbnailUrl || item.coverUrl ? (
                            <img
                              src={item.thumbnailUrl || item.coverUrl}
                              alt={item.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/30">
                              <Film className="h-8 w-8" />
                            </div>
                          )}

                          {/* Section Badge */}
                          <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                            {item.section || "lust"}
                          </span>

                          {/* Play overlay button */}
                          <Link
                            href={`/title/${item.section || "lust"}/${item.slug || item.id}`}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-black shadow-lg shadow-cyan-400/40">
                              <Play className="h-5 w-5 fill-black translate-x-0.5" />
                            </div>
                          </Link>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(selectedPlaylist.id, item.id || item.slug)}
                            className="absolute top-2 right-2 rounded-lg bg-black/70 p-1.5 text-white/60 hover:text-rose-400 hover:bg-black/90 backdrop-blur-md transition-all active:scale-95"
                            title="Remove from playlist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title and details */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <Link
                            href={`/title/${item.section || "lust"}/${item.slug || item.id}`}
                            className="font-display text-[13.5px] sm:text-[14.5px] font-bold text-white hover:text-cyan-300 line-clamp-2 transition-colors leading-[1.35]"
                          >
                            {item.title}
                          </Link>

                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/40 border-t border-white/5 pt-2">
                            <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                            <Link
                              href={`/title/${item.section || "lust"}/${item.slug || item.id}`}
                              className="text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>Watch</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 mb-3">
                      <Film className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">This playlist is empty</h3>
                    <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
                      Browse any video and click the <span className="text-purple-300 font-semibold">&quot;Playlist&quot;</span> button under the player to add videos here.
                    </p>
                    <Link
                      href="/"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white transition-all"
                    >
                      Browse Videos
                    </Link>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c1017] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Create New Playlist</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Select Theme
                </label>
                <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  {THEME_ICONS.map((t) => {
                    const Icon = t.icon;
                    const isSel = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          isSel
                            ? "bg-white text-black font-bold ring-1 ring-white/90 shadow-sm"
                            : "bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${isSel ? "text-black" : "text-white/60"}`} />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Playlist Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Late Night Favorites, Top 10 POV..."
                  autoFocus
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What kind of videos are in this playlist?"
                  rows={2}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white/60 hover:text-white transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold shadow-md hover:bg-neutral-200 transition-all active:scale-95"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
