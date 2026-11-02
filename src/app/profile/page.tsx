"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, MessageSquare, Bookmark, LogOut, Settings, Sparkles, Shield, Calendar, Film, FolderHeart, Plus, Play, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getPlaylists, Playlist } from "@/lib/playlists";

const AVATAR_OPTIONS = ["💋", "👑", "⚡", "🌸", "🔥", "💎", "🐉", "🦊", "⭐", "🖤"];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateAvatar, updateUsername } = useAuth();
  const [activeTab, setActiveTab] = useState<"saved" | "playlists" | "comments" | "settings">("saved");
  const [bookmarkedItems, setBookmarkedItems] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  // Load user bookmarks, playlists & comments
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawList = localStorage.getItem("xilust_mylist");
        if (rawList) {
          setBookmarkedItems(JSON.parse(rawList));
        }
        setPlaylists(getPlaylists());
        const rawComments = localStorage.getItem("xilust_my_comments_history");
        if (rawComments) {
          setMyComments(JSON.parse(rawComments));
        }
      } catch {}
    }
  }, []);

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      updateUsername(newUsername.trim());
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl mb-4">
          👤
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">VIP Profile Portal</h1>
        <p className="mt-2 max-w-sm text-xs sm:text-sm text-white/50">
          Sign in or create a free account to track your comment history, saved videos, and personalized settings.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "October 2026";

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8] px-3 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Top Back bar */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/75 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>

          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <span className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-2 border-white/20 text-4xl sm:text-5xl shadow-[0_0_35px_rgba(168,85,247,0.3)]">
                  {user.avatar}
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400 text-black text-[10px] font-black border-2 border-[#080a0f]">
                  ✓
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{user.username}</h1>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                    VIP Member
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/50">{user.email}</p>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-white/40">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-center px-3">
                <div className="text-lg font-black text-cyan-300">{bookmarkedItems.length}</div>
                <div className="text-[10px] uppercase font-bold text-white/40">Bookmarks</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-3">
                <div className="text-lg font-black text-purple-300">{playlists.length}</div>
                <div className="text-[10px] uppercase font-bold text-white/40">Playlists</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-3">
                <div className="text-lg font-black text-pink-300">{myComments.length}</div>
                <div className="text-[10px] uppercase font-bold text-white/40">Comments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-8 flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "saved"
                ? "bg-white text-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>My Bookmarks ({bookmarkedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("playlists")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "playlists"
                ? "bg-white text-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <FolderHeart className="h-3.5 w-3.5 text-purple-400" />
            <span>My Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "comments"
                ? "bg-white text-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>My Comments ({myComments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "settings"
                ? "bg-white text-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab 1: Bookmarks */}
        {activeTab === "saved" && (
          <div className="mt-6">
            {bookmarkedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {bookmarkedItems.map((item: any, idx: number) => {
                  const sec = item.section || "lust";
                  const slug = item.slug || item.id;
                  return (
                    <Link
                      key={idx}
                      href={`/title/${sec}/${encodeURIComponent(slug)}`}
                      className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-cyan-400/50"
                    >
                      <div className="relative aspect-video overflow-hidden bg-[#121620]">
                        {item.posterUrl ? (
                          <img
                            src={item.posterUrl}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-white/20">
                            <Film className="h-6 w-6" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/80">
                          {sec}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-xs font-semibold text-white/90 group-hover:text-cyan-300">
                          {item.name || item.title || "Video"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <Bookmark className="h-8 w-8 text-white/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white/70">No saved videos yet</p>
                <p className="text-xs text-white/40 mt-1">
                  Click the &quot;+&quot; bookmark button on any video card across XiLust to save it to your VIP list.
                </p>
                <Link
                  href="/"
                  className="inline-flex mt-4 items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15"
                >
                  Explore Catalog
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Custom Playlists */}
        {activeTab === "playlists" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50">
                Organize your custom collections, late-night picks, and favorite series.
              </p>
              <Link
                href="/playlists"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-xs font-bold text-purple-200 hover:bg-purple-600/50 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create / Manage</span>
              </Link>
            </div>

            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {playlists.map((pl) => (
                  <Link
                    key={pl.id}
                    href="/playlists"
                    className="group flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-purple-500/50 hover:bg-white/[0.06] transition-all shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl border border-white/10 group-hover:scale-105 transition-transform">
                        {pl.emoji || "🎬"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                          {pl.name}
                        </h4>
                        <p className="text-xs text-white/40">
                          {pl.items.length} {pl.items.length === 1 ? "video" : "videos"}
                        </p>
                      </div>
                    </div>

                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-purple-400 group-hover:bg-purple-500/20 transition-all">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <FolderHeart className="h-8 w-8 text-purple-400/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white/70">No playlists created yet</p>
                <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                  Create custom playlists with your own emoji icons to group your favorite videos.
                </p>
                <Link
                  href="/playlists"
                  className="inline-flex mt-4 items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                >
                  Create First Playlist
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Comments History */}
        {activeTab === "comments" && (
          <div className="mt-6 space-y-3">
            {myComments.length > 0 ? (
              myComments.map((cmt: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cyan-300 truncate">
                      {cmt.postTitle || cmt.post_slug}
                    </span>
                    <span className="text-[11px] text-white/40 shrink-0">
                      {cmt.createdAt ? new Date(cmt.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 whitespace-pre-wrap">{cmt.text}</p>
                  {cmt.post_slug && (
                    <Link
                      href={`/title/${cmt.section || "lust"}/${encodeURIComponent(cmt.post_slug)}`}
                      className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 mt-1 font-semibold"
                    >
                      <span>View Video Scene →</span>
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <MessageSquare className="h-8 w-8 text-white/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white/70">No comments posted yet</p>
                <p className="text-xs text-white/40 mt-1">
                  Share your thoughts on any video post to track your discussions here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Settings */}
        {activeTab === "settings" && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Change Avatar Badge</h3>
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/10">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => updateAvatar(av)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all ${
                      user.avatar === av
                        ? "bg-cyan-500/30 border border-cyan-400 scale-110 shadow-lg shadow-cyan-500/30"
                        : "bg-white/5 hover:bg-white/10 text-white/70"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveUsername}>
              <h3 className="text-sm font-bold text-white mb-2">Display Name</h3>
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-all active:scale-95"
                >
                  Save
                </button>
              </div>
              {savedNotice && (
                <p className="text-xs text-emerald-400 mt-2">✓ Profile updated successfully!</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

