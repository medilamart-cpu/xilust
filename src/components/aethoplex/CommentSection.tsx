"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Heart, Send, Sparkles, UserCheck, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { CommentItem } from "@/app/api/comments/route";

interface CommentSectionProps {
  postSlug: string;
  section: "lust" | "jax" | "fans";
  postTitle: string;
}

function timeAgo(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

const EMOJI_SHORTCUTS = ["🔥", "💋", "👑", "⚡", "🌸", "❤️", "💎"];

export function CommentSection({ postSlug, section, postTitle }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const localKey = `xilust_comments_${postSlug}`;

  // Fetch comments
  useEffect(() => {
    let alive = true;

    // 1. Instant load from local storage
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        setComments(JSON.parse(cached));
      }
    } catch {}

    // 2. Fetch from API
    fetch(`/api/comments?post_slug=${encodeURIComponent(postSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (alive && data.comments) {
          // Merge local comments with server comments
          setComments((prev) => {
            const merged = [...data.comments];
            for (const p of prev) {
              if (!merged.some((m) => m.id === p.id)) {
                merged.unshift(p);
              }
            }
            try {
              localStorage.setItem(localKey, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [postSlug, localKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const authorName = user ? user.username : guestName.trim() || "Anonymous VIP";
    const authorAvatar = user ? user.avatar : "💋";

    setSubmitting(true);

    const optimisticComment: CommentItem = {
      id: "cmt_" + Date.now().toString(36),
      post_slug: postSlug,
      section,
      username: authorName,
      avatar: authorAvatar,
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    // Update locally immediately
    const updated = [optimisticComment, ...comments];
    setComments(updated);
    setInputText("");
    try {
      localStorage.setItem(localKey, JSON.stringify(updated));
      // Track in user comment count
      const myCommentsKey = "xilust_my_comments_history";
      const existingHistory = JSON.parse(localStorage.getItem(myCommentsKey) || "[]");
      existingHistory.unshift({
        ...optimisticComment,
        postTitle,
      });
      localStorage.setItem(myCommentsKey, JSON.stringify(existingHistory.slice(0, 100)));
    } catch {}

    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_slug: postSlug,
          section,
          username: authorName,
          avatar: authorAvatar,
          text,
        }),
      });
    } catch (err) {
      console.warn("Server comments sync pending:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = (commentId: string) => {
    if (likedMap[commentId]) return;

    setLikedMap((prev) => ({ ...prev, [commentId]: true }));
    setComments((prev) => {
      const next = prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
      try {
        localStorage.setItem(localKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch("/api/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_slug: postSlug,
        comment_id: commentId,
        action: "like",
      }),
    }).catch(() => {});
  };

  const badgeColor =
    section === "jax"
      ? "text-pink-400 border-pink-500/30 bg-pink-500/10"
      : section === "fans"
        ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
        : "text-purple-400 border-purple-500/30 bg-purple-500/10";

  return (
    <section className="mt-8 sm:mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-7 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Discussion & Comments
            </h3>
            <span className="text-xs text-white/50">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>

        {!user ? (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5 text-cyan-400" />
            <span>Sign in to save profile</span>
          </Link>
        ) : (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
          >
            <span>{user.avatar}</span>
            <span>{user.username}</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-200">
              VIP
            </span>
          </Link>
        )}
      </div>

      {/* Comment Input Box */}
      <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg shadow-inner">
            {user?.avatar || "💋"}
          </div>

          <div className="flex-1 min-w-0">
            {!user && (
              <input
                type="text"
                placeholder="Your display name (optional guest name)..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={25}
                className="w-full mb-2 px-3 py-1.5 rounded-lg border border-white/10 bg-black/40 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
              />
            )}
            <textarea
              rows={2}
              placeholder={user ? `Comment as ${user.username}...` : "Write your thoughts on this scene..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>
        </div>

        {/* Action bar below textarea */}
        <div className="flex flex-wrap items-center justify-between gap-2 pl-12 sm:pl-13">
          {/* Quick emojis */}
          <div className="flex items-center gap-1">
            {EMOJI_SHORTCUTS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputText((prev) => prev + " " + emoji)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-xs transition-transform active:scale-90"
                title={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || !inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="group relative rounded-xl border border-white/5 bg-black/30 p-3.5 sm:p-4 transition-all hover:border-white/15 hover:bg-white/[0.02]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-base">
                  {comment.avatar}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-white/90">
                      {comment.username}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                      VIP
                    </span>
                  </div>
                  <span className="text-[11px] text-white/40">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
              </div>

              {/* Like Button */}
              <button
                type="button"
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-90 ${
                  likedMap[comment.id]
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
                title="Like comment"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    likedMap[comment.id] ? "fill-pink-400 text-pink-400" : "text-white/60"
                  }`}
                />
                <span>{comment.likes}</span>
              </button>
            </div>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-white/80 whitespace-pre-wrap pl-10.5">
              {comment.text}
            </p>
          </div>
        ))}

        {comments.length === 0 && !loading && (
          <div className="py-8 text-center text-xs text-white/40">
            No comments yet. Be the first to start the discussion!
          </div>
        )}
      </div>
    </section>
  );
}
