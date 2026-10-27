"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles, Flame, Bookmark, X } from "lucide-react";
import { Wordmark } from "./Logo";
import { searchPlaceholder } from "@/lib/catalog";

export type Section = "lust" | "jax";

export function Navbar({
  section,
  onSectionChange,
  query,
  onQueryChange,
  onSelectCategory,
  activeCategory,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
  query: string;
  onQueryChange: (q: string) => void;
  onSelectCategory?: (cat: string) => void;
  activeCategory?: string;
}) {
  const [focus, setFocus] = useState(false);
  const [listCount, setListCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-2xl shadow-xl"
          : "border-b border-white/5 bg-[#080a0f]/60 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <a
            href="/"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                onQueryChange("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="shrink-0"
          >
            <Wordmark />
          </a>

          {/* Section Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => onSectionChange("lust")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                section === "lust"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-pink-500/20"
                  : "text-white/60 hover:text-white/90"
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-pink-300" />
              <span>LUST</span>
              <span className="hidden sm:inline-block text-[10px] opacity-75 font-normal">(Western)</span>
            </button>

            <button
              type="button"
              onClick={() => onSectionChange("jax")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                section === "jax"
                  ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg shadow-rose-500/20"
                  : "text-white/60 hover:text-white/90"
              }`}
            >
              <span className="text-sm leading-none">🌸</span>
              <span>JAX</span>
              <span className="hidden sm:inline-block text-[10px] opacity-75 font-normal">(JAV)</span>
            </button>
          </div>
        </div>

        {/* Search bar & My list */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`flex h-10 items-center gap-2.5 rounded-full border bg-white/[0.05] px-3.5 transition-all duration-300 ${
                focus || query
                  ? "w-48 sm:w-80 border-cyan-400/50 bg-[#121622] shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  : "w-36 sm:w-64 border-white/10 hover:border-white/20"
              }`}
            >
              <Search className="h-4 w-4 shrink-0 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                placeholder={section === "jax" ? "Search JAV code (e.g. SSIS), actress..." : "Search title, model, studio..."}
                className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
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

          {/* My list shortcut */}
          <a
            href="/#mylist"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:border-white/20 text-xs font-medium text-white/80 hover:text-white transition-colors"
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
      </nav>
    </header>
  );
}
