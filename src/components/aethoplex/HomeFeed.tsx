"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, Loader2, Sparkles, Trophy, Shuffle, Filter, Star, Film, Tag, X } from "lucide-react";
import { TileCard, type CardModel } from "./PosterCard";
import type { TaxonomyItem } from "@/lib/catalog-db";

type TabId = "trending" | "new" | "top" | "random";
type TaxonomyType = "category" | "actor" | "studio" | "tag";

const TABS: { id: TabId; label: string; icon: typeof Flame }[] = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "new", label: "New releases", icon: Sparkles },
  { id: "top", label: "Top rated", icon: Trophy },
  { id: "random", label: "Discover Random", icon: Shuffle },
];

export function HomeFeed({
  section,
  query,
  filter,
  onFilterChange,
}: {
  section: "lust" | "jax";
  query: string;
  filter?: { type: TaxonomyType; name: string } | null;
  onFilterChange?: (f: { type: TaxonomyType; name: string } | null) => void;
}) {
  const [tab, setTab] = useState<TabId>("trending");

  // Taxonomy navigation
  const [taxType, setTaxType] = useState<TaxonomyType>("category");
  const [taxItems, setTaxItems] = useState<TaxonomyItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<{ type: TaxonomyType; name: string } | null>(
    filter || null
  );

  // Sync when filter prop changes (e.g. from URL redirect)
  useEffect(() => {
    if (filter !== undefined) {
      setActiveFilter(filter);
      if (filter) {
        setTaxType(filter.type);
      }
    }
  }, [filter]);

  // Movie Feed items & pagination
  const [items, setItems] = useState<CardModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [busy, setBusy] = useState(false);

  // Load taxonomy list whenever section or taxType changes
  useEffect(() => {
    let alive = true;
    fetch(`/api/taxonomies?section=${section}&type=${taxType}&limit=40`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setTaxItems(d.items || []);
      })
      .catch((e) => console.error(e));

    return () => {
      alive = false;
    };
  }, [section, taxType]);

  // Keep track of active section & abort controller to avoid race conditions
  const abortRef = useRef<AbortController | null>(null);
  const activeSectionRef = useRef(section);
  activeSectionRef.current = section;

  const handleSetFilter = (newFilter: { type: TaxonomyType; name: string } | null) => {
    setActiveFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  // Fetch items
  const fetchPage = useCallback(
    async (p: number) => {
      // Abort any prior in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setBusy(true);
      try {
        const params = new URLSearchParams({
          section,
          page: String(p),
          limit: "24",
          tab,
        });

        if (activeFilter) {
          if (activeFilter.type === "category") params.set("category", activeFilter.name);
          else if (activeFilter.type === "actor") params.set("actor", activeFilter.name);
          else if (activeFilter.type === "studio") params.set("studio", activeFilter.name);
          else if (activeFilter.type === "tag") params.set("tag", activeFilter.name);
        }

        if (query) params.set("query", query);

        const res = await fetch(`/api/catalog?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        // Discard if aborted or if section switched while fetching
        if (controller.signal.aborted || activeSectionRef.current !== section) {
          return;
        }
        if (data.section && data.section !== activeSectionRef.current) {
          return;
        }

        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);

        setItems((prev) => {
          if (p === 1) return data.items || [];
          const seen = new Set(prev.map((x) => x.key));
          const newItems = (data.items || []).filter((x: CardModel) => !seen.has(x.key));
          return [...prev, ...newItems];
        });
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Error fetching feed:", err);
      } finally {
        if (activeSectionRef.current === section) {
          setBusy(false);
        }
      }
    },
    [section, query, tab, activeFilter],
  );

  // Reset page & list when section, query, tab, or activeFilter changes
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    setItems([]);
    setTotalItems(0);
    setTotalPages(1);

    if (page === 1) {
      fetchPage(1);
    } else {
      setPage(1);
    }
  }, [section, query, tab, activeFilter]);

  // Handle subsequent pagination
  useEffect(() => {
    if (page > 1) {
      fetchPage(page);
    }
  }, [page]);

  // Infinite scroll trigger
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !busy && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [busy, page, totalPages]);

  const actorLabel = section === "jax" ? "Actresses" : "Pornstars";

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 sm:pb-12">
      {/* Feed Controls Header */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-4 sm:pb-5">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar scrollbar-none touch-scroll max-w-full">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide transition-all ${
                    active
                      ? "bg-white text-black shadow-lg"
                      : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/5"
                  }`}
                >
                  <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${active ? "text-black" : "text-cyan-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Result count & current section indicator */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-white/50">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              {totalItems.toLocaleString()} {section === "jax" ? "JAV Titles" : "Western Titles"}
              {query ? ` matching "${query}"` : ""}
            </span>
          </div>
        </div>

        {/* Categorization Mode Selector */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-bold overflow-x-auto no-scrollbar scrollbar-none touch-scroll max-w-full">
              <button
                type="button"
                onClick={() => setTaxType("category")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "category" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" />
                <span>Categories</span>
              </button>

              <button
                type="button"
                onClick={() => setTaxType("actor")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "actor" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-pink-400" />
                <span>{actorLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => setTaxType("studio")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "studio" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Film className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-400" />
                <span>Studios</span>
              </button>

              <button
                type="button"
                onClick={() => setTaxType("tag")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "tag" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                <span>Tags</span>
              </button>
            </div>

            {/* Clear active filter badge */}
            {activeFilter && (
              <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 px-3 py-1.5 text-xs">
                <span className="text-white/70">Filtered by:</span>
                <span className="font-bold text-cyan-300">
                  {activeFilter.type === "actor" ? "⭐ " : activeFilter.type === "studio" ? "🎬 " : "🏷️ "}
                  {activeFilter.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleSetFilter(null)}
                  className="ml-1 rounded-full p-0.5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Taxonomy Pills Slider */}
          {taxItems.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar scrollbar-none touch-scroll max-w-full">
              <button
                type="button"
                onClick={() => handleSetFilter(null)}
                className={`shrink-0 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all ${
                  !activeFilter
                    ? "bg-white text-black font-bold shadow"
                    : "bg-white/[0.04] border border-white/10 text-white/60 hover:text-white"
                }`}
              >
                All
              </button>

              {taxItems.map((item) => {
                const active = activeFilter?.type === taxType && activeFilter?.name === item.name;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSetFilter({ type: taxType, name: item.name })}
                    className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                      active
                        ? section === "jax"
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md shadow-pink-500/25"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md shadow-purple-500/25"
                        : "bg-white/[0.03] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] sm:text-[10px] text-white/50">
                      {item.count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid of Movie Cards: 2 cols on mobile, 3 on tablet, 4 on desktop */}
      {items.length === 0 && !busy ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-3">
            {section === "jax" ? "🌸" : "🔥"}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">No titles found</h3>
          <p className="mt-1 text-xs sm:text-sm text-white/50 max-w-sm">
            Try adjusting your search query, selecting another category/star, or switching sections.
          </p>
          {activeFilter && (
            <button
              onClick={() => handleSetFilter(null)}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-white hover:bg-white/20"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((item) => (
            <TileCard key={item.key} item={item} />
          ))}
        </div>
      )}

      {/* Loading Indicator / Intersection Sentinel */}
      <div ref={sentinelRef} className="mt-12 flex justify-center py-6">
        {busy && (
          <div className="flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-5 py-2.5 backdrop-blur-md">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold text-white/80">Loading more titles...</span>
          </div>
        )}
      </div>
    </section>
  );
}
