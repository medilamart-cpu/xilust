"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Flame, Bookmark, X } from "lucide-react";
import { Wordmark, LogoMark } from "./Logo";

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
  const [focus, setFocus] = useState(false);
  const [listCount, setListCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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
              <div className="flex items-center gap-2.5 sm:gap-6 min-w-0">
                <a
                  href="/xilust"
                  className="shrink-0 flex items-center"
                >
                  <span className="hidden sm:inline-block">
                    <Wordmark size={28} />
                  </span>
                  <span className="sm:hidden flex items-center gap-1.5">
                    <LogoMark size={26} />
                    <span className="text-base font-black tracking-wider text-white">
                      Xi<span className="bg-gradient-to-r from-pink-400 to-cyan-300 bg-clip-text text-transparent">Lust</span>
                    </span>
                  </span>
                </a>

                {/* Section Switcher Tabs */}
                <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => onSectionChange("lust")}
                    className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all ${section === "lust"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-pink-500/20"
                        : "text-white/60 hover:text-white/90"
                      }`}
                  >
                    <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-pink-300" />
                    <span>LUST</span>
                    <span className="hidden md:inline-block text-[10px] opacity-75 font-normal">(Western)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSectionChange("jax")}
                    className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all ${section === "jax"
                        ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg shadow-rose-500/20"
                        : "text-white/60 hover:text-white/90"
                      }`}
                  >
                    <span className="text-xs sm:text-sm leading-none">🌸</span>
                    <span>JAX</span>
                    <span className="hidden md:inline-block text-[10px] opacity-75 font-normal">(JAV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSectionChange("fans")}
                    className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all ${section === "fans"
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                        : "text-white/60 hover:text-white/90"
                      }`}
                  >
                    <span className="text-xs sm:text-sm leading-none">⭐</span>
                    <span>FANS</span>
                    <span className="hidden md:inline-block text-[10px] opacity-75 font-normal">(Leaks)</span>
                  </button>
                </div>
              </div>

              {/* Search bar & My list */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Desktop Search bar */}
                <div className="hidden sm:block relative">
                  <div
                    className={`flex h-10 items-center gap-2.5 rounded-full border bg-white/[0.05] px-3.5 transition-all duration-300 ${focus || query
                        ? "w-64 lg:w-80 border-cyan-400/50 bg-[#121622] shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                        : "w-44 lg:w-64 border-white/10 hover:border-white/20"
                      }`}
                  >
                    <Search className="h-4 w-4 shrink-0 text-white/40" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => onQueryChange(e.target.value)}
                      onFocus={() => setFocus(true)}
                      onBlur={() => setFocus(false)}
                      placeholder={section === "jax" ? "Search JAV code (e.g. KNMB-134), title, actress..." : "Search title, pornstar, studio (e.g. Team Skeet)..."}
                      className="w-full bg-transparent text-base sm:text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => onQueryChange("")}
                        className="rounded-full p-0.5 hover:bg-white/10 text-white/50 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
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
                  aria-label="View saved list"
                  className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-white/[0.05] border border-white/10 hover:border-white/20 text-xs font-medium text-white/80 hover:text-white transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5 text-cyan-300" />
                  <span className="hidden md:inline">My List</span>
                  {listCount > 0 && (
                    <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300">
                      {listCount}
                    </span>
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
              onSectionChange("lust");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${section === "lust" ? "text-pink-400 font-bold" : "text-white/50 hover:text-white/80"
              }`}
          >
            <Flame className={`h-4 w-4 ${section === "lust" ? "text-pink-400" : "text-white/40"}`} />
            <span className="text-[10px]">Lust</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSectionChange("jax");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${section === "jax" ? "text-rose-400 font-bold" : "text-white/50 hover:text-white/80"
              }`}
          >
            <span className="text-sm leading-none">🌸</span>
            <span className="text-[10px]">Jax (JAV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSectionChange("fans");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${section === "fans" ? "text-cyan-400 font-bold" : "text-white/50 hover:text-white/80"
              }`}
          >
            <span className="text-sm leading-none">⭐</span>
            <span className="text-[10px]">Fans</span>
          </button>

          <button
            type="button"
            onClick={openMobileSearch}
            className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${query || mobileSearchOpen ? "text-cyan-400 font-bold" : "text-white/50 hover:text-white/80"
              }`}
          >
            <Search className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px]">Search</span>
          </button>

          <a
            href="/#mylist"
            className="flex flex-col items-center gap-1 min-w-[56px] py-1 text-white/50 hover:text-white/80 transition-all relative"
          >
            <Bookmark className="h-4 w-4 text-cyan-300" />
            <span className="text-[10px]">My List</span>
            {listCount > 0 && (
              <span className="absolute top-0 right-3 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-black text-black">
                {listCount}
              </span>
            )}
          </a>
        </div>
      </nav>
    </>
  );
}
