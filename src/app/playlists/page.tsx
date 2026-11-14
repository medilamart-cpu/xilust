"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderHeart,
  Plus,
  Play,
  Shuffle,
  Trash2,
  Film,
  Sparkles,
  Clock,
  ChevronRight,
  X,
  ExternalLink,
  Heart,
  Star,
  Globe,
  Lock,
  ChevronUp,
  ChevronDown,
  ListVideo,
  Share2,
} from "lucide-react";
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  removeFromPlaylist,
  reorderPlaylistItems,
  setPlaylistVisibility,
  Playlist,
  PlaylistItem,
} from "@/lib/playlists";

const THEME_ICONS = [
  { id: "fav", label: "Favorites", icon: Heart },
  { id: "film", label: "Cinema Hits", icon: Film },
  { id: "star", label: "VIP Vault", icon: Star },
  { id: "clock", label: "Watch Later", icon: Clock },
  { id: "sparkles", label: "Spotlight", icon: Sparkles },
  { id: "folder", label: "Collection", icon: FolderHeart },
];

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("fav");
  const [isPublic, setIsPublic] = useState(false);
  const [authorHandle, setAuthorHandle] = useState("");

  const sync = () => {
    const list = getPlaylists();
    setPlaylists(list);
    if (!selectedPlaylistId && list.length > 0) {
      setSelectedPlaylistId(list[0].id);
    }
  };

  useEffect(() => {
    sync();
    const handleSync = () => sync();
    window.addEventListener("playlists-change", handleSync);
    return () => window.removeEventListener("playlists-change", handleSync);
  }, []);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = createPlaylist(
      newTitle.trim(),
      selectedTheme,
      newDesc.trim(),
      isPublic ? "public" : "private",
      authorHandle.trim() || "You"
    );
    sync();
    setSelectedPlaylistId(created.id);
    setNewTitle("");
    setNewDesc("");
    setIsPublic(false);
    setShowCreateModal(false);
  };

  const confirmDelete = () => {
    if (!playlistToDelete) return;
    deletePlaylist(playlistToDelete.id);
    sync();
    if (selectedPlaylistId === playlistToDelete.id) {
      setSelectedPlaylistId(null);
    }
    setPlaylistToDelete(null);
  };

  const handleRemoveItem = (plId: string, itemId: string) => {
    removeFromPlaylist(plId, itemId);
    sync();
  };

  const handleMoveItem = (plId: string, fromIdx: number, toIdx: number) => {
    reorderPlaylistItems(plId, fromIdx, toIdx);
    sync();
  };

  const handleTogglePrivacy = (plId: string, current: "public" | "private") => {
    const next = current === "public" ? "private" : "public";
    setPlaylistVisibility(plId, next);
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
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/15 text-white">
              <ListVideo className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white">
                My Playlists
              </h1>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black shadow-md hover:bg-zinc-200 transition-all active:scale-95"
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
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
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
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white">
                        {getPlaylistThemeIcon(pl.emoji)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className={`text-xs sm:text-sm font-bold truncate ${isActive ? "text-white" : "text-zinc-200"}`}>
                            {pl.name}
                          </h3>
                          {pl.visibility === "public" ? (
                            <span title="Public Playlist" className="inline-flex">
                              <Globe className="h-3 w-3 text-cyan-400 shrink-0" />
                            </span>
                          ) : (
                            <span title="Private Playlist" className="inline-flex">
                              <Lock className="h-3 w-3 text-zinc-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 tabular-nums">
                          {pl.items.length} {pl.items.length === 1 ? "video" : "videos"}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "text-white translate-x-0.5" : "text-zinc-600"}`} />
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
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1017] p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      {/* 2x2 Mosaic or Theme Icon */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center">
                        {selectedPlaylist.items.length >= 4 ? (
                          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
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
                          <div className="text-zinc-400">
                            {getPlaylistThemeIcon(selectedPlaylist.emoji)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {selectedPlaylist.name}
                          </h2>
                          <button
                            type="button"
                            onClick={() => handleTogglePrivacy(selectedPlaylist.id, selectedPlaylist.visibility || "private")}
                            className="flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-white/20 transition-colors"
                          >
                            {selectedPlaylist.visibility === "public" ? (
                              <>
                                <Globe className="h-2.5 w-2.5 text-cyan-400" />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-2.5 w-2.5 text-zinc-400" />
                                <span>Private</span>
                              </>
                            )}
                          </button>
                        </div>

                        {selectedPlaylist.description && (
                          <p className="mt-1 text-xs text-zinc-400 max-w-md">
                            {selectedPlaylist.description}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400 tabular-nums">
                          <span>{selectedPlaylist.items.length} titles</span>
                          <span>•</span>
                          <span>Updated {new Date(selectedPlaylist.updatedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <Link
                            href={`/playlists/${selectedPlaylist.id}`}
                            className="text-white hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>Public Page</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedPlaylist.items.length > 0 && (
                        <>
                          <Link
                            href={`/title/${selectedPlaylist.items[0].section || "lust"}/${selectedPlaylist.items[0].slug || selectedPlaylist.items[0].id}?playlist=${encodeURIComponent(selectedPlaylist.id)}&index=0`}
                            className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-bold text-black shadow-md hover:bg-zinc-200 transition-all active:scale-95"
                          >
                            <Play className="h-3.5 w-3.5 fill-black" />
                            <span>Play All</span>
                          </Link>

                          <Link
                            href={`/title/${selectedPlaylist.items[0].section || "lust"}/${selectedPlaylist.items[0].slug || selectedPlaylist.items[0].id}?playlist=${encodeURIComponent(selectedPlaylist.id)}&index=0&shuffle=1`}
                            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all active:scale-95"
                            title="Shuffle play"
                          >
                            <Shuffle className="h-3.5 w-3.5 text-zinc-300" />
                            <span className="hidden sm:inline">Shuffle</span>
                          </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setPlaylistToDelete({ id: selectedPlaylist.id, name: selectedPlaylist.name })}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95"
                        title="Delete playlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Videos Tracklist */}
                {selectedPlaylist.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPlaylist.items.map((item, idx) => {
                      const watchLink = `/title/${item.section || "lust"}/${item.slug || item.id}?playlist=${encodeURIComponent(selectedPlaylist.id)}&index=${idx}`;

                      return (
                        <div
                          key={item.id + idx}
                          className="group flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-white/5 bg-[#0e121a] hover:bg-white/[0.04] hover:border-white/15 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Number */}
                            <span className="w-5 text-center text-xs font-bold text-zinc-500 tabular-nums">
                              {idx + 1}
                            </span>

                            {/* Thumbnail */}
                            <div className="relative h-12 w-20 sm:h-14 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-black/60 border border-white/10">
                              {item.thumbnailUrl || item.coverUrl ? (
                                <img
                                  src={item.thumbnailUrl || item.coverUrl}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                  <Film className="h-4 w-4" />
                                </div>
                              )}

                              <Link
                                href={watchLink}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Play className="h-3.5 w-3.5 fill-white text-white" />
                              </Link>
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <Link
                                href={watchLink}
                                className="font-bold text-xs sm:text-sm text-white hover:text-zinc-200 line-clamp-1 transition-colors"
                              >
                                {item.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-bold uppercase text-zinc-300">
                                  {item.section || "lust"}
                                </span>
                                <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reorder and Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(selectedPlaylist.id, idx, idx - 1)}
                              disabled={idx === 0}
                              title="Move up"
                              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(selectedPlaylist.id, idx, idx + 1)}
                              disabled={idx === selectedPlaylist.items.length - 1}
                              title="Move down"
                              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(selectedPlaylist.id, item.id || item.slug)}
                              title="Remove video"
                              className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-400 mb-3 border border-white/10">
                      <Film className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">This playlist is empty</h3>
                    <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
                      Click the &quot;Playlist&quot; button beneath any video to save titles here.
                    </p>
                    <Link
                      href="/"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-black"
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

      {/* Delete Confirmation Modal (Sleek custom dialog replacing window.confirm) */}
      {playlistToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0e121a] border border-white/10 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Delete Playlist?</h3>
            <p className="mt-2 text-xs text-zinc-400">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{playlistToDelete.name}&quot;</span>? This collection cannot be recovered.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlaylistToDelete(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c1017] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderHeart className="h-4 w-4" />
                <span>Create New Playlist</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Select Theme Icon
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
                            : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="new-playlist-title" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Playlist Title
                </label>
                <input
                  id="new-playlist-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Late Night Favorites, Top 10 POV..."
                  autoFocus
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label htmlFor="new-playlist-desc" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  id="new-playlist-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What kind of videos are in this playlist?"
                  rows={2}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2.5">
                  {isPublic ? <Globe className="h-4 w-4 text-cyan-400" /> : <Lock className="h-4 w-4 text-zinc-400" />}
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isPublic ? "Public Playlist" : "Private Playlist"}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {isPublic ? "Discoverable by everyone in community" : "Only visible to you"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isPublic
                      ? "bg-white text-black shadow-sm"
                      : "bg-white/10 text-zinc-300 hover:text-white"
                  }`}
                >
                  {isPublic ? "Public" : "Private"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold shadow-md hover:bg-zinc-200 transition-all active:scale-95"
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
