"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Sparkles,
  Star,
  ListVideo,
  Bookmark,
  Film,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
} from "lucide-react";
import { LogoMark } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { SPRING_SNAPPY, SPRING_GENTLE } from "@/lib/motion";

export interface CinemaSidebarProps {
  section: "lust" | "jax" | "fans";
  onSectionChange: (sec: "lust" | "jax" | "fans") => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectStudio?: (studio: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onGoHome?: () => void;
}

// Curated studios with distinctive colourful aesthetic styling matching live badges
const CURATED_STUDIOS = {
  lust: [
    {
      name: "Brazzers",
      label: "Brazzers",
      themeClass: "bg-amber-950/60 border-amber-400/40 text-amber-200 hover:border-amber-300 hover:bg-amber-900/60",
      dot: "bg-amber-400",
    },
    {
      name: "Blacked",
      label: "Blacked",
      themeClass: "bg-purple-950/60 border-purple-400/40 text-purple-200 hover:border-purple-300 hover:bg-purple-900/60",
      dot: "bg-purple-400",
    },
    {
      name: "Vixen",
      label: "Vixen",
      themeClass: "bg-fuchsia-950/60 border-fuchsia-400/40 text-fuchsia-200 hover:border-fuchsia-300 hover:bg-fuchsia-900/60",
      dot: "bg-fuchsia-400",
    },
    {
      name: "Naughty America",
      label: "Naughty America",
      themeClass: "bg-orange-950/60 border-orange-400/40 text-orange-200 hover:border-orange-300 hover:bg-orange-900/60",
      dot: "bg-orange-400",
    },
    {
      name: "TeamSkeet",
      label: "Team Skeet",
      themeClass: "bg-cyan-950/60 border-cyan-400/40 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-900/60",
      dot: "bg-cyan-400",
    },
  ],
  jax: [
    {
      name: "S1",
      label: "S1 No.1 Style",
      themeClass: "bg-pink-950/60 border-pink-400/40 text-pink-200 hover:border-pink-300 hover:bg-pink-900/60",
      dot: "bg-pink-400",
    },
    {
      name: "Moodyz",
      label: "Moodyz",
      themeClass: "bg-emerald-950/60 border-emerald-400/40 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-900/60",
      dot: "bg-emerald-400",
    },
    {
      name: "SOD",
      label: "SOD Create",
      themeClass: "bg-orange-950/60 border-orange-400/40 text-orange-200 hover:border-orange-300 hover:bg-orange-900/60",
      dot: "bg-orange-400",
    },
    {
      name: "IdeaPocket",
      label: "Idea Pocket",
      themeClass: "bg-purple-950/60 border-purple-400/40 text-purple-200 hover:border-purple-300 hover:bg-purple-900/60",
      dot: "bg-purple-400",
    },
    {
      name: "Prestige",
      label: "Prestige",
      themeClass: "bg-cyan-950/60 border-cyan-400/40 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-900/60",
      dot: "bg-cyan-400",
    },
  ],
  fans: [
    {
      name: "OnlyFans",
      label: "OnlyFans VIP",
      themeClass: "bg-sky-950/60 border-sky-400/40 text-sky-200 hover:border-sky-300 hover:bg-sky-900/60",
      dot: "bg-sky-400",
    },
    {
      name: "Fansly",
      label: "Fansly Exclusive",
      themeClass: "bg-rose-950/60 border-rose-400/40 text-rose-200 hover:border-rose-300 hover:bg-rose-900/60",
      dot: "bg-rose-400",
    },
  ],
};

export function CinemaSidebar({
  section,
  onSectionChange,
  collapsed,
  onToggleCollapse,
  onSelectStudio,
  mobileOpen = false,
  onMobileClose,
  onGoHome,
}: CinemaSidebarProps) {
  const { user } = useAuth();
  const [listCount, setListCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      try {
        setListCount(JSON.parse(localStorage.getItem("xilust-mylist-keys") ?? "[]").length);
      } catch {
        setListCount(0);
      }
    };
    sync();
    window.addEventListener("mylist-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mylist-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Keyboard Escape listener to dismiss mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  const navSections = [
    {
      id: "lust" as const,
      label: "Lust",
      sublabel: "Western Studios",
      icon: Flame,
      color: "text-rose-400",
      glowBg: "bg-rose-500/10 text-rose-200 border-rose-500/25",
      dotColor: "bg-rose-500",
      barGradient: "from-rose-500 to-red-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]",
    },
    {
      id: "jax" as const,
      label: "JAX",
      sublabel: "Japanese Adult Video",
      icon: Sparkles,
      color: "text-pink-400",
      glowBg: "bg-pink-500/10 text-pink-200 border-pink-500/25",
      dotColor: "bg-pink-500",
      barGradient: "from-pink-500 to-rose-400 shadow-[0_0_12px_rgba(244,114,182,0.6)]",
    },
    {
      id: "fans" as const,
      label: "Fans",
      sublabel: "Creator Leaks",
      icon: Star,
      color: "text-amber-400",
      glowBg: "bg-amber-500/10 text-amber-200 border-amber-500/25",
      dotColor: "bg-amber-400",
      barGradient: "from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]",
    },
  ];

  const currentStudios = CURATED_STUDIOS[section] || [];

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay (Elevated to z-[70] to cover mobile bottom bar) */}
      {mobileOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onMobileClose}
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Cinema Navigation Rail & Drawer */}
      <aside
        role="navigation"
        aria-label="Cinema Navigation"
        aria-expanded={!collapsed}
        className={`fixed top-0 bottom-0 left-0 z-[70] lg:z-50 flex flex-col justify-between border-r border-white/[0.08] bg-[#07090e]/95 backdrop-blur-2xl transition-[width,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[width,transform] ${
          // Desktop sizing: collapsed w-16, expanded w-60
          collapsed ? "lg:w-16" : "lg:w-60"
        } ${
          // Mobile responsive: slide in from left when mobileOpen is true, else hidden offscreen
          mobileOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header / Logo / Collapse Trigger */}
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between px-3.5 border-b border-white/[0.06]">
            <Link
              href="/"
              onClick={(e) => {
                if (onGoHome) {
                  e.preventDefault();
                  onGoHome();
                } else if (typeof window !== "undefined" && window.location.hash) {
                  window.location.hash = "";
                }
                if (mobileOpen) onMobileClose?.();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-label="XiLust Cinema Home"
              className="group flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg p-1"
            >
              <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                <LogoMark size={28} />
              </div>
              <AnimatePresence initial={false}>
                {(!collapsed || mobileOpen) && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-base font-black tracking-tight text-white">
                      Xi<span className="text-rose-500">Lust</span>
                    </span>
                    <span className="rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.2 text-[9px] font-black tracking-wider text-rose-300">
                      CINEMA
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand cinema navigation" : "Collapse to mini rail"}
              aria-controls="cinema-nav-content"
              className={`hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                collapsed ? "mx-auto" : ""
              }`}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            {/* Mobile Close Button (Touch target min 44x44px) */}
            {mobileOpen && (
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close cinema navigation"
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/10 active:scale-95 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation Items Container */}
          <div id="cinema-nav-content" className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-none">
            {/* Core Section Switcher */}
            <div className="space-y-1">
              {(!collapsed || mobileOpen) && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Channels
                </div>
              )}

              {navSections.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;

                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        onSectionChange(item.id);
                        if (mobileOpen) onMobileClose?.();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      aria-label={`${item.label} channel (${item.sublabel})`}
                      className={`relative w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98] ${
                        active
                          ? "text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                      } ${collapsed && !mobileOpen ? "justify-center" : ""}`}
                    >
                      {/* Fluid Active Sliding Glow Pill */}
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-channel-bg"
                          className={`absolute inset-0 rounded-xl ${item.glowBg} border shadow-sm`}
                          transition={SPRING_SNAPPY}
                          style={{ zIndex: 0 }}
                        />
                      )}

                      {/* Fluid Active Left Vertical Accent Pill */}
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-channel-bar"
                          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b ${item.barGradient}`}
                          transition={SPRING_SNAPPY}
                          style={{ zIndex: 1 }}
                        />
                      )}

                      <div
                        className={`relative z-[1] shrink-0 flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${
                          active
                            ? "bg-black/60 border-white/20 shadow-md"
                            : "bg-black/40 border-white/5 group-hover:border-white/15"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? item.color : "text-zinc-400 group-hover:text-white"}`} />
                        {active && (
                          <span
                            className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${item.dotColor} ring-2 ring-[#07090e]`}
                          />
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {(!collapsed || mobileOpen) && (
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="relative z-[1] min-w-0 text-left"
                          >
                            <span className="block truncate font-bold text-[13px]">{item.label}</span>
                            <span className="block text-[10px] text-zinc-500 font-normal truncate">
                              {item.sublabel}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* Instant Hover Micro-Tooltip with Smooth Physics */}
                    {collapsed && !mobileOpen && (
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 invisible group-hover:visible flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-[#121622]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl opacity-0 scale-95 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.dotColor}`} />
                        <span>{item.label}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">({item.sublabel})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Curated Studio Badges (Expanded Mode Only - Themed Studio Styling) */}
            {(!collapsed || mobileOpen) && currentStudios.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between px-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Featured Studios
                  </span>
                  <Link
                    href={`/browse/studio?section=${section}`}
                    onClick={() => {
                      if (mobileOpen) onMobileClose?.();
                    }}
                    className="text-[10px] font-medium text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    View All
                  </Link>
                </div>

                <div className="flex flex-wrap gap-1.5 px-2">
                  {currentStudios.map((st) => (
                    <button
                      key={st.name}
                      type="button"
                      onClick={() => {
                        if (onSelectStudio) {
                          onSelectStudio(st.name);
                        } else {
                          window.location.href = `/?section=${section}&studio=${encodeURIComponent(st.name)}`;
                        }
                        if (mobileOpen) onMobileClose?.();
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide transition-all shadow-sm active:scale-95 ${st.themeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Library & Curations Cluster */}
            <div className="pt-2 border-t border-white/[0.06] space-y-1">
              <AnimatePresence initial={false}>
                {(!collapsed || mobileOpen) && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.16 }}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                  >
                    Discover & Library
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Community Playlists */}
              <div className="relative group">
                <Link
                  href="/playlists"
                  onClick={() => {
                    if (mobileOpen) onMobileClose?.();
                  }}
                  aria-label="Playlists and Curated Collections"
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98] ${
                    collapsed && !mobileOpen ? "justify-center" : ""
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-black/40 border border-white/5 text-zinc-400 group-hover:text-rose-400 group-hover:border-rose-500/30 transition-colors">
                    <ListVideo className="h-4 w-4" />
                  </div>
                  <AnimatePresence initial={false}>
                    {(!collapsed || mobileOpen) && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="min-w-0 text-left"
                      >
                        <span className="block truncate font-semibold text-zinc-200">Playlists</span>
                        <span className="block text-[10px] text-zinc-500 truncate">Curated & Community</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>

                {collapsed && !mobileOpen && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 invisible group-hover:visible flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-[#121622]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl opacity-0 scale-95 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <span>Playlists & Collections</span>
                  </div>
                )}
              </div>

              {/* My List Bookmark */}
              <div className="relative group">
                <Link
                  href="/#mylist"
                  onClick={() => {
                    if (mobileOpen) onMobileClose?.();
                  }}
                  aria-label={`My Saved List (${listCount} items)`}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98] ${
                    collapsed && !mobileOpen ? "justify-center" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-black/40 border border-white/5 text-cyan-400 group-hover:border-cyan-400/30 transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </div>
                    <AnimatePresence initial={false}>
                      {(!collapsed || mobileOpen) && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="truncate font-semibold text-zinc-200"
                        >
                          My Saved List
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {listCount > 0 && (!collapsed || mobileOpen) && (
                    <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300 tabular-nums">
                      {listCount}
                    </span>
                  )}
                </Link>

                {collapsed && !mobileOpen && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 invisible group-hover:visible flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-[#121622]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl opacity-0 scale-95 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <span>My Saved List</span>
                    {listCount > 0 && (
                      <span className="rounded-full bg-cyan-500/30 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300">
                        {listCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Studios Explorer */}
              <div className="relative group">
                <Link
                  href={`/browse/studio?section=${section}`}
                  onClick={() => {
                    if (mobileOpen) onMobileClose?.();
                  }}
                  aria-label="Browse all production studios"
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98] ${
                    collapsed && !mobileOpen ? "justify-center" : ""
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-black/40 border border-white/5 text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-colors">
                    <Film className="h-4 w-4" />
                  </div>
                  <AnimatePresence initial={false}>
                    {(!collapsed || mobileOpen) && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="min-w-0 text-left"
                      >
                        <span className="block truncate font-semibold text-zinc-200">Studios</span>
                        <span className="block text-[10px] text-zinc-500 truncate">Full Production Index</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>

                {collapsed && !mobileOpen && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 invisible group-hover:visible flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-[#121622]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl opacity-0 scale-95 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <span>Browse All Studios</span>
                  </div>
                )}
              </div>

              {/* Actresses / Performers Explorer */}
              <div className="relative group">
                <Link
                  href={`/browse/actor?section=${section}`}
                  onClick={() => {
                    if (mobileOpen) onMobileClose?.();
                  }}
                  aria-label={section === "jax" ? "Browse AV Actresses" : "Browse Pornstars and Models"}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98] ${
                    collapsed && !mobileOpen ? "justify-center" : ""
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-black/40 border border-white/5 text-zinc-400 group-hover:text-pink-400 group-hover:border-pink-500/30 transition-colors">
                    <Compass className="h-4 w-4" />
                  </div>
                  <AnimatePresence initial={false}>
                    {(!collapsed || mobileOpen) && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="min-w-0 text-left"
                      >
                        <span className="block truncate font-semibold text-zinc-200">
                          {section === "jax" ? "AV Actresses" : "Pornstars & Models"}
                        </span>
                        <span className="block text-[10px] text-zinc-500 truncate">Alphabetical Index</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>

                {collapsed && !mobileOpen && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 invisible group-hover:visible flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-[#121622]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl opacity-0 scale-95 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <span>{section === "jax" ? "Browse AV Actresses" : "Browse Pornstars"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Profile / Account */}
        <div className="p-2 border-t border-white/[0.06] space-y-1">
          <div className="relative group">
            <Link
              href={user ? "/profile" : "/login"}
              onClick={() => {
                if (mobileOpen) onMobileClose?.();
              }}
              aria-label={user ? `@${user.username || "user"} Profile` : "Sign In to account"}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98] ${
                collapsed && !mobileOpen ? "justify-center" : ""
              }`}
            >
              <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-black/40 border border-white/5 text-zinc-400 group-hover:text-white">
                {user?.avatar ? (
                  <span className="text-sm leading-none">{user.avatar}</span>
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <AnimatePresence initial={false}>
                {(!collapsed || mobileOpen) && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="min-w-0 text-left"
                  >
                    <span className="block truncate font-semibold text-zinc-200">
                      {user ? (user.username ? `@${user.username}` : "My Profile") : "Sign In"}
                    </span>
                    <span className="block text-[10px] text-zinc-500 truncate">
                      {user ? "Account Settings" : "Save Favorites & Sync"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {collapsed && !mobileOpen && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 invisible group-hover:visible flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-[#121622]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl opacity-0 scale-95 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <span>{user ? (user.username ? `@${user.username}` : "My Profile") : "Sign In"}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
