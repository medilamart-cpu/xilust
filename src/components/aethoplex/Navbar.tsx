"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Flame, Bookmark, X, User as UserIcon, FolderHeart, Sparkles, Star } from "lucide-react";
import { Wordmark, LogoMark } from "./Logo";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

export type Section = "lust" | "jax" | "fans";
export type View = string;

export function Navbar({
  section = "lust",
  onSectionChange = () => { },
  query = "",
  onQueryChange = () => { },
}: {
  section?: Section;
  onSectionChange?: (s: Section) => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  view?: string;
  onNavigate?: (v: any) => void;
  deferNavigate?: boolean;
  onSelectCategory?: (cat: string) => void;
  activeCategory?: string;
}) {
  const { user } = useAuth();
  const [focus, setFocus] = useState(false);
  const [listCount, setListCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        desktopInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mylist-change", sync);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 100);
  };

  // Close search automatically as soon as search is cleared or section/menu changes
  useEffect(() => {
    if (!query) {
      setMobileSearchOpen(false);
    }
  }, [query]);

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [section]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)] ${scrolled
            ? "border-b border-white/10 bg-[#080a0f]/95 backdrop-blur-2xl shadow-xl"
            : "border-b border-white/5 bg-[#080a0f]/80 backdrop-blur-md"
          }`}
      >
        <nav className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
          {/* Mobile Search Overlay when opened */}
          {mobileSearchOpen ? (
            <div className="flex w-full items-center gap-2 animate-in fade-in duration-200">
              <div className="relative flex-1 flex h-10 items-center gap-2 rounded-full border border-cyan-400/50 bg-[#121622] px-3 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <Search className="h-4 w-4 shrink-0 text-cyan-400" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder={section === "jax" ? "Search JAV code (e.g. KNMB-134), title, actress..." : "Search title, pornstar, studio (e.g. Team Skeet)..."}
                  className="w-full bg-transparent text-base sm:text-xs text-white placeholder-white/40 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    className="rounded-full p-1 text-white/50 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="shrink-0 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white active:scale-95"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Brand and Section Tabs */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none sm:gap-6">
                <a
                  href="/xilust"
                  className="shrink-0 flex items-center"
                >
                  <span className="hidden sm:inline-block">
                    <Wordmark size={28} />
                  </span>
                  <span className="sm:hidden flex items-center gap-1.5">
                    <LogoMark size={26} />
                    <span className="text-base font-black tracking-tight text-white">
                      Xi<span className="text-rose-500">Lust</span>
                    </span>
                  </span>
                </a>

                {/* Section Switcher Tabs */}
                <div className="flex min-w-0 flex-1 items-center justify-between p-1 sm:flex-none sm:justify-start rounded-full bg-[#0e121a] border border-white/[0.08]">
                  {(
                    [
                      { id: "lust" as const, label: "LUST", sub: "(Western)", icon: <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-400" /> },
                      { id: "jax" as const, label: "JAX", sub: "(JAV)", icon: <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-pink-400" /> },
                      { id: "fans" as const, label: "FANS", sub: "(Leaks)", icon: <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" /> },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onSectionChange(t.id);
                        if (query) onQueryChange("");
                      }}
                      className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide transition-colors z-[1] active:scale-95 ${
                        section === t.id ? "text-white" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {section === t.id && (
                        <motion.span
                          layoutId="section-pill"
                          className="absolute inset-0 rounded-full bg-white/15 border border-white/20 shadow-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      {t.icon}
                      <span>{t.label}</span>
                      <span className="hidden md:inline-block text-[10px] opacity-60 font-normal">{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search bar & My list */}
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex sm:gap-3">
                {/* Desktop Search bar */}
                <div className="hidden sm:block relative">
                  <div
                    className={`flex h-10 items-center gap-2.5 rounded-full border bg-[#0e121a] px-3.5 transition-all duration-200 ${
                      focus || query
                        ? "w-64 lg:w-80 border-white/30 bg-[#121622] shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                        : "w-44 lg:w-64 border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <Search className="h-4 w-4 shrink-0 text-white/40" />
                    <input
                      ref={desktopInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => onQueryChange(e.target.value)}
                      onFocus={() => setFocus(true)}
                      onBlur={() => setFocus(false)}
                      placeholder={section === "jax" ? "Search JAV code (e.g. KNMB-134), actress..." : "Search title, pornstar, studio..."}
                      className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => onQueryChange("")}
                        className="rounded-full p-0.5 hover:bg-white/10 text-white/50 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <kbd className="hidden lg:inline-flex items-center rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/40">
                        /
                      </kbd>
                    )}
                  </div>
                </div>

                {/* Mobile Search Button */}
                <button
                  type="button"
                  onClick={openMobileSearch}
                  aria-label="Open search"
                  className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 text-white/80 hover:text-white active:scale-95"
                >
                  <Search className="h-4 w-4 text-cyan-300" />
                </button>

                {/* My list shortcut */}
                <a
                  href="/#mylist"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    if (query) onQueryChange("");
                  }}
                  aria-label="View saved list"
                  className="flex h-9 w-9 items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] px-0 text-xs font-medium text-white/80 transition-colors hover:border-white/20 sm:h-10 sm:w-auto sm:justify-start sm:px-3"
                >
                  <Bookmark className="h-3.5 w-3.5 text-cyan-300" />
                  <span className="hidden md:inline">My List</span>
                  {listCount > 0 && (
                    <span className="hidden rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300 sm:inline">
                      {listCount}
                    </span>
                  )}
                </a>

                {/* Playlists shortcut */}
                <a
                  href="/playlists"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    if (query) onQueryChange("");
                  }}
                  aria-label="View playlists"
                  className="hidden md:flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/5 px-2.5 sm:px-3 text-xs font-medium text-white/80 transition-colors hover:border-purple-500/30 hover:bg-white/[0.08]"
                >
                  <FolderHeart className="h-3.5 w-3.5 text-purple-400" />
                  <span className="hidden lg:inline">Playlists</span>
                </a>

                {/* Profile / Sign In shortcut */}
                <a
                  href={user ? "/profile" : "/login"}
                  onClick={() => {
                    setMobileSearchOpen(false);
                    if (query) onQueryChange("");
                  }}
                  aria-label={user ? "Profile" : "Sign In"}
                  className="flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/10 px-2.5 sm:px-3 text-xs font-semibold text-white/90 transition-colors hover:border-pink-500/40 hover:bg-white/[0.08]"
                >
                  {user ? (
                    <>
                      <span className="text-sm leading-none">{user.avatar || "👤"}</span>
                      <span className="hidden md:inline max-w-[80px] truncate text-white">
                        {user.username}
                      </span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="h-3.5 w-3.5 text-pink-400" />
                      <span className="hidden md:inline text-white/90">Sign In</span>
                    </>
                  )}
                </a>
              </div>
            </>
          )}
        </nav>
      </header>

      {/* Sleek Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#080a0f]/95 backdrop-blur-2xl px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(false);
              onSectionChange("lust");
              if (query) onQueryChange("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all active:scale-95 ${
              section === "lust" ? "text-rose-400 font-bold" : "text-white/50 hover:text-white/80"
            }`}
          >
            <Flame className={`h-4 w-4 ${section === "lust" ? "text-rose-400" : "text-white/40"}`} />
            <span className="text-[10px]">Lust</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(false);
              onSectionChange("jax");
              if (query) onQueryChange("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all active:scale-95 ${
              section === "jax" ? "text-pink-400 font-bold" : "text-white/50 hover:text-white/80"
            }`}
          >
            <Sparkles className={`h-4 w-4 ${section === "jax" ? "text-pink-400" : "text-white/40"}`} />
            <span className="text-[10px]">Jax (JAV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(false);
              onSectionChange("fans");
              if (query) onQueryChange("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all active:scale-95 ${
              section === "fans" ? "text-amber-400 font-bold" : "text-white/50 hover:text-white/80"
            }`}
          >
            <Star className={`h-4 w-4 ${section === "fans" ? "text-amber-400" : "text-white/40"}`} />
            <span className="text-[10px]">Fans</span>
          </button>

          <button
            type="button"
            onClick={openMobileSearch}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all active:scale-95 ${
              query || mobileSearchOpen ? "text-white font-bold" : "text-white/50 hover:text-white/80"
            }`}
          >
            <Search className="h-4 w-4 text-white/70" />
            <span className="text-[10px]">Search</span>
          </button>

          <a
            href="/#mylist"
            onClick={() => {
              setMobileSearchOpen(false);
              if (query) onQueryChange("");
            }}
            className="flex flex-col items-center gap-1 min-w-[50px] py-1 text-white/50 hover:text-white/80 transition-all active:scale-95 relative"
          >
            <Bookmark className="h-4 w-4 text-white/60" />
            <span className="text-[10px]">My List</span>
            {listCount > 0 && (
              <span className="absolute top-0 right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white tabular-nums">
                {listCount}
              </span>
            )}
          </a>

          <a
            href={user ? "/profile" : "/login"}
            onClick={() => {
              setMobileSearchOpen(false);
              if (query) onQueryChange("");
            }}
            className="flex flex-col items-center gap-1 min-w-[50px] py-1 text-white/50 hover:text-white/80 transition-all"
          >
            {user ? (
              <span className="text-sm leading-none">{user.avatar || "👤"}</span>
            ) : (
              <UserIcon className="h-4 w-4 text-pink-400" />
            )}
            <span className="text-[10px]">{user ? "Profile" : "Sign In"}</span>
          </a>
        </div>
      </nav>
    </>
  );
}
