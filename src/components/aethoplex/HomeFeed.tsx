"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Loader2, Sparkles, Trophy, Shuffle, Filter, Star, Film, Tag, X, Clock, LayoutGrid, Grid2X2, Eye, Heart, Languages, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { TileCard, type CardModel } from "./PosterCard";
import { CommunityPlaylistsSection } from "./CommunityPlaylistsSection";
import type { TaxonomyItem } from "@/lib/catalog-db";
import { formatStudioLabel } from "@/lib/studio-label";
import { SPRING_GENTLE } from "@/lib/motion";

const PAGE_SIZE = 20;

const feedCache = new Map<string, { items: CardModel[]; totalPages: number; time: number }>();
const taxCache = new Map<string, TaxonomyItem[]>();

type TabId = "trending" | "monthly" | "likes" | "new" | "top" | "random" | "movies" | "longform";
type TaxonomyType = "category" | "actor" | "studio" | "tag";
type FilterType = TaxonomyType | "code" | "premium";

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "new", label: "Newly Released", icon: Sparkles },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "monthly", label: "Monthly Top", icon: Eye },
  { id: "likes", label: "Most Liked", icon: Heart },
  { id: "top", label: "All-Time", icon: Trophy },
  { id: "movies", label: "Feature Films", icon: Film },
  { id: "longform", label: "Longform", icon: Clock },
  { id: "random", label: "Discover", icon: Shuffle },
];

const JAV_FORMAT_FILTERS: { label: string; type: "category" | "tag"; name: string }[] = [
  { label: "Decensored Subbed", type: "category", name: "decnsoredsubbed" },
  { label: "Uncensored", type: "category", name: "UNCENSORED" },
  { label: "English Subbed", type: "category", name: "English subbed JAV" },
  { label: "4K", type: "category", name: "4K" },
];

export function HomeFeed({
  section,
  query,
  filter,
  onFilterChange,
  onQueryChange,
  onSectionChange,
}: {
  section: "lust" | "jax" | "fans";
  query: string;
  filter?: { type: FilterType; name: string } | null;
  onFilterChange?: (f: { type: FilterType; name: string } | null) => void;
  onQueryChange?: (query: string) => void;
  onSectionChange?: (section: "lust" | "jax" | "fans") => void;
}) {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tab") as TabId | null;
      if (t && TABS.some((tabObj) => tabObj.id === t)) return t;
      try {
        const storedTab = sessionStorage.getItem(`xilust_tab_${section}`) as TabId | null;
        if (storedTab && TABS.some((tabObj) => tabObj.id === storedTab)) return storedTab;
      } catch {}
    }
    return "new";
  });
  const [jaxSubFilter, setJaxSubFilter] = useState<"Subbed" | "Uncensored" | "4K" | null>(null);

  // Taxonomy navigation
  const [taxType, setTaxType] = useState<TaxonomyType>("category");
  const [taxItems, setTaxItems] = useState<TaxonomyItem[]>([]);
  const [taxSearch, setTaxSearch] = useState("");
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState(false);
  const [taxReload, setTaxReload] = useState(0);
  const [codeInput, setCodeInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<{ type: FilterType; name: string } | null>(
    filter || null
  );
  const [showFilters, setShowFilters] = useState(false);

  // View Density: Cinematic (large 3-column HD) vs Compact (4-column grid)
  const [viewDensity, setViewDensity] = useState<"cinematic" | "compact">(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("xilust_view_density");
        if (stored === "compact" || stored === "cinematic") return stored;
      } catch {}
    }
    return "cinematic";
  });

  const handleDensityChange = (density: "cinematic" | "compact") => {
    setViewDensity(density);
    try {
      localStorage.setItem("xilust_view_density", density);
    } catch {}
  };

  const handleTabClick = (nextTab: TabId) => {
    if (query) onQueryChange?.("");
    setTab(nextTab);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`xilust_tab_${section}`, nextTab);
        sessionStorage.setItem(`xilust_page_${section}`, "1");
        sessionStorage.removeItem(`xilust_scroll_${section}`);
      } catch {}
      const url = new URL(window.location.href);
      if (nextTab === "new") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", nextTab);
      }
      url.searchParams.delete("page");
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Sync tab and page when navigating with browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const sp = new URLSearchParams(window.location.search);
      const urlTab = sp.get("tab") as TabId | null;
      if (urlTab && TABS.some((t) => t.id === urlTab)) {
        setTab(urlTab);
      } else if (!urlTab) {
        setTab("new");
      }
      const urlPage = parseInt(sp.get("page") || "1", 10);
      if (!isNaN(urlPage) && urlPage >= 1) {
        setPage(urlPage);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync when filter prop changes (e.g. from URL redirect)
  useEffect(() => {
    if (filter !== undefined) {
      setActiveFilter(filter);
      if (filter?.type === "code") {
        setCodeInput(filter.name);
      } else if (filter) {
        setTaxType(filter.type === "premium" ? "category" : filter.type);
        setCodeInput("");
      } else {
        setCodeInput("");
      }
    }
  }, [filter]);

  useEffect(() => {
    if (section === "fans") {
      setActiveFilter(null);
      setJaxSubFilter(null);
      setCodeInput("");
    }
    if (section === "fans" && taxType === "studio") setTaxType("category");
    if (section !== "jax" && activeFilter?.name === "decnsoredsubbed") {
      setActiveFilter(null);
    }
  }, [section, taxType, activeFilter]);

  // Movie Feed items & pagination
  const [items, setItems] = useState<CardModel[]>([]);
  const premiumPoolRef = useRef<CardModel[] | null>(null);
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const isInitialMountRef = useRef(true);
  const hasRestoredScrollRef = useRef(false);

  // Initialize page from URL query param or sessionStorage so returning from a video preserves the exact page
  const [page, setPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlPage = parseInt(sp.get("page") || "", 10);
      if (!isNaN(urlPage) && urlPage >= 1) return urlPage;
      try {
        const storedPage = parseInt(sessionStorage.getItem(`xilust_page_${section}`) || "", 10);
        if (!isNaN(storedPage) && storedPage >= 1) return storedPage;
      } catch {}
    }
    return 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Load taxonomy list whenever section or taxType changes
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const cacheKey = `${section}:${taxType}:${taxSearch.trim()}`;
    if (taxCache.has(cacheKey)) {
      setTaxItems(taxCache.get(cacheKey)!);
      setTaxLoading(false);
      setTaxError(false);
    } else {
      setTaxLoading(true);
      setTaxError(false);
      setTaxItems([]);
    }
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ section, type: taxType, limit: "8" });
      if (taxSearch.trim()) params.set("q", taxSearch.trim());
      fetch(`/api/taxonomies?${params.toString()}`, { signal: controller.signal })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || `Taxonomy request failed (${r.status})`);
          return data;
        })
        .then((d) => {
          if (alive) {
            const list = d.items || [];
            taxCache.set(cacheKey, list);
            setTaxItems(list);
            setTaxLoading(false);
          }
        })
        .catch((e) => {
          if (e.name !== "AbortError") {
            console.error(e);
            if (alive) {
              setTaxLoading(false);
              setTaxError(true);
            }
          }
        });
    }, taxCache.has(cacheKey) ? 500 : 120);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [section, taxType, taxSearch, taxReload]);

  // Keep track of active section & abort controller to avoid race conditions
  const abortRef = useRef<AbortController | null>(null);
  const activeSectionRef = useRef(section);
  activeSectionRef.current = section;

  const handleSetFilter = (newFilter: { type: FilterType; name: string } | null) => {
    if (query) onQueryChange?.("");
    setActiveFilter(newFilter);
    setJaxSubFilter(null);
    if (newFilter && (newFilter.type === 'actor' || newFilter.type === 'studio')) {
      if (tab === 'random') {
        setTab('new');
      }
    }
    if (newFilter?.type === "code") setCodeInput(newFilter.name);
    else setCodeInput("");
    onFilterChange?.(newFilter);
  };

  const applyCodeFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = codeInput.trim().replace(/\s+/g, "").toUpperCase();
    if (!code) return;
    onQueryChange?.("");
    handleSetFilter({ type: "code", name: code });
  };

  const changeTaxType = (type: TaxonomyType) => {
    if (query) onQueryChange?.("");
    setTaxType(type);
    setTaxSearch("");
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

      // SWR Cache Key for standard browsing
      const isCacheable = !query && tab !== "random" && activeFilter?.type !== "premium";
      const cacheKey = isCacheable
        ? `${section}:${p}:${tab}:${activeFilter?.type || ""}:${activeFilter?.name || ""}:${jaxSubFilter || ""}`
        : null;

      if (cacheKey && feedCache.has(cacheKey)) {
        const cached = feedCache.get(cacheKey)!;
        setItems(cached.items);
        setTotalPages(cached.totalPages);
        setBusy(false);
      } else {
        setBusy(true);
      }
      setFeedError(null);
      try {
        if (activeFilter?.type === "premium" && premiumPoolRef.current) {
          const pool = premiumPoolRef.current;
          setTotalPages(Math.max(1, Math.ceil(pool.length / PAGE_SIZE)));
          const pageItems = pool.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
          setItems(pageItems);
          return;
        }

        const params = new URLSearchParams({
          section,
          page: String(p),
          limit: String(PAGE_SIZE),
          tab: tab === "movies" || tab === "longform" ? "new" : tab,
        });

        if (tab === "movies") {
          params.set("movies", "1");
        }
        if (tab === "longform") params.set("longform", "1");

        if (activeFilter) {
          if (activeFilter.type === "premium") params.set("premium", "1");
          else if (activeFilter.type === "category") params.set("category", activeFilter.name);
          else if (activeFilter.type === "actor") params.set("actor", activeFilter.name);
          else if (activeFilter.type === "studio") {
            if (section === "jax") params.set("query", activeFilter.name);
            else params.set("studio", activeFilter.name);
          }
          else if (activeFilter.type === "tag") params.set("tag", activeFilter.name);
          else if (activeFilter.type === "code") params.set("code", activeFilter.name);
        }

        if (section === "jax" && jaxSubFilter) {
          params.set("subfilter", jaxSubFilter.toLowerCase());
        }

        if (query && activeFilter?.type !== "studio" && activeFilter?.type !== "premium") {
          params.set("query", query);
        }

        const res = await fetch(`/api/catalog?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Catalog request failed (${res.status})`);
        }

        // Discard if aborted or if section switched while fetching
        if (controller.signal.aborted || activeSectionRef.current !== section) {
          return;
        }
        if (data.section && data.section !== activeSectionRef.current) {
          return;
        }

        setTotalPages(data.totalPages || 1);
        let pageItems = data.items || [];
        if (activeFilter?.type === "premium") {
          premiumPoolRef.current = pageItems;
          setTotalPages(Math.max(1, Math.ceil(pageItems.length / PAGE_SIZE)));
          pageItems = pageItems.slice(0, PAGE_SIZE);
        }
        setItems(pageItems);
        if (cacheKey) {
          feedCache.set(cacheKey, {
            items: pageItems,
            totalPages: data.totalPages || 1,
            time: Date.now(),
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Error fetching feed:", err);
        setFeedError("The catalog could not be reached. Check the connection and try again.");
        setTotalPages(1);
        setPage(1);
      } finally {
        if (abortRef.current === controller) {
          setBusy(false);
        }
      }
    },
    [section, query, tab, activeFilter, jaxSubFilter],
  );

  // Fetch feed on dependency change, preserving saved page on initial mount
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    premiumPoolRef.current = null;
    setItems([]);

    let targetPage = 1;
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      targetPage = page;
    } else {
      setPage(1);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`xilust_page_${section}`, "1");
        } catch {}
        const url = new URL(window.location.href);
        url.searchParams.delete("page");
        window.history.replaceState({}, "", url.toString());
      }
    }

    fetchPage(targetPage);
  }, [section, query, tab, activeFilter, jaxSubFilter, fetchPage]);

  // Restore scroll position when returning from video details
  useEffect(() => {
    if (items.length > 0 && !hasRestoredScrollRef.current) {
      hasRestoredScrollRef.current = true;
      if (typeof window !== "undefined") {
        try {
          const savedScroll = sessionStorage.getItem(`xilust_scroll_${section}`);
          if (savedScroll) {
            const scrollY = parseInt(savedScroll, 10);
            if (!isNaN(scrollY) && scrollY > 0) {
              window.setTimeout(() => {
                window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
              }, 50);
            }
          }
        } catch {}
      }
    }
  }, [items, section]);

  const goToPage = (nextPage: number) => {
    if (busy || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`xilust_page_${section}`, String(nextPage));
      } catch {}
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(nextPage));
      window.history.replaceState({}, "", url.toString());
    }

    // Smooth scroll directly to the top of the posts grid with generous navbar clearance
    // Ensures the entire top card (thumbnail, title, badge) is completely in view, not cut in half
    if (gridTopRef.current) {
      const rect = gridTopRef.current.getBoundingClientRect();
      const navbarOffset = window.innerWidth < 640 ? 85 : 105;
      const targetY = Math.max(0, rect.top + window.scrollY - navbarOffset);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }

    void fetchPage(nextPage);
  };

  const actorLabel = section === "jax" ? "Actresses" : section === "fans" ? "Creators" : "Pornstars";
  const showTeamSkeetSuggestion = section === "jax" && taxType === "studio";
  const browseTaxType = section === "fans" && taxType === "studio" ? "actor" : taxType;

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 sm:pb-12">
      {/* Feed Controls Header */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-4 sm:pb-5">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar scrollbar-none touch-scroll max-w-full">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id)}
                  className={`relative shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold tracking-normal transition-colors duration-150 active:scale-95 z-[1] ${
                    active
                      ? "text-black font-bold"
                      : "bg-[#0e121a] text-neutral-200 hover:text-white hover:bg-[#151c27] border border-white/[0.08]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="feed-active-pill"
                      className="absolute inset-0 rounded-full bg-white ring-1 ring-white/90 shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors ${active ? "text-black" : "text-cyan-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Controls: Filter Drawer Toggle & Density Toggle */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {section !== "fans" && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${
                  showFilters || activeFilter || jaxSubFilter
                    ? "bg-white text-black font-bold border-white shadow-sm"
                    : "bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] border-white/10"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {(activeFilter || jaxSubFilter) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            )}

            {/* Density Toggle (Cinematic 3-col HD vs Compact 4-col) */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                title="Cinematic HD View (Large 3-Column)"
                onClick={() => handleDensityChange("cinematic")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewDensity === "cinematic"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cinematic</span>
              </button>
              <button
                type="button"
                title="Compact View (4-Column Grid)"
                onClick={() => handleDensityChange("compact")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewDensity === "compact"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compact</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Active Filter Banner (Shown when filters panel is closed) */}
        {activeFilter && !showFilters && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#0e121a] border border-white/[0.08] animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-zinc-400 shrink-0">Filtered by {activeFilter.type}:</span>
              <span className="font-bold text-xs sm:text-sm text-white truncate">
                {activeFilter.name === "decnsoredsubbed" ? "Decensored Subbed" : activeFilter.type === "studio" ? formatStudioLabel(activeFilter.name) : activeFilter.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setJaxSubFilter(null);
                handleSetFilter(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors active:scale-95"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Active search query banner with one-click dismiss */}
        {query && (
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-cyan-500/[0.08] border border-cyan-400/25 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-white/50 shrink-0">Search query:</span>
              <span className="font-bold text-sm text-cyan-300 truncate">"{query}"</span>
            </div>
            <button
              type="button"
              onClick={() => onQueryChange?.("")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-cyan-300" />
              <span>Clear Search</span>
            </button>
          </div>
        )}

        {/* Collapsible Filter & Taxonomy Drawer */}
        <AnimatePresence>
          {section !== "fans" && showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={SPRING_GENTLE}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[#0e121a] border border-white/10">
            {/* Row 1: Mode Switcher & View All */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-bold overflow-x-auto no-scrollbar scrollbar-none touch-scroll max-w-full">
                <button
                  type="button"
                  onClick={() => changeTaxType("category")}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                    taxType === "category" ? "bg-white text-black font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Categories</span>
                </button>

                <button
                  type="button"
                  onClick={() => changeTaxType("actor")}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                    taxType === "actor" ? "bg-white text-black font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>{actorLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => changeTaxType("studio")}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                    taxType === "studio" ? "bg-white text-black font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Film className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Studios</span>
                </button>

                <button
                  type="button"
                  onClick={() => changeTaxType("tag")}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                    taxType === "tag" ? "bg-white text-black font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Tags</span>
                </button>
              </div>

              <Link href={`/browse/${browseTaxType}?section=${section}`} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white">
                View all <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Row 2: Active filter details (if active) */}
            {activeFilter && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Viewing {activeFilter.type === "code" ? "JAV code" : activeFilter.type === "premium" ? "studio collection" : activeFilter.type}:</span>
                  <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    {activeFilter.type === "actor" && <Star className="h-3.5 w-3.5 text-pink-400" />}
                    {activeFilter.type === "studio" && <Film className="h-3.5 w-3.5 text-purple-400" />}
                    {activeFilter.type === "code" && <Filter className="h-3.5 w-3.5 text-cyan-400" />}
                    {activeFilter.type === "premium" && <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
                    {activeFilter.type === "category" && <Tag className="h-3.5 w-3.5 text-emerald-400" />}
                    {activeFilter.type === "tag" && <Tag className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>{activeFilter.name === "decnsoredsubbed" ? "Decensored Subbed" : activeFilter.type === "studio" ? formatStudioLabel(activeFilter.name) : activeFilter.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setJaxSubFilter(null);
                      handleSetFilter(null);
                    }}
                    className="ml-1 rounded-full p-1 bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors active:scale-95"
                    title="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {section === "jax" && (activeFilter.type === "actor" || activeFilter.type === "studio") && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
                    <span className="text-[11px] font-semibold text-zinc-400 mr-1 shrink-0">Filter:</span>
                    {(["Subbed", "Uncensored", "4K"] as const).map((fmt) => {
                      const active = jaxSubFilter === fmt;
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setJaxSubFilter(active ? null : fmt)}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                            active
                              ? "bg-white text-black font-bold ring-1 ring-white/90 shadow-sm"
                              : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/5"
                          }`}
                        >
                          <span>{fmt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Row 3: JAX Formats + JAV Code Search */}
            {section === "jax" && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Featured JAV formats">
                  <span className="text-xs font-medium text-zinc-400 mr-1">Format:</span>
                  {JAV_FORMAT_FILTERS.map((preset) => {
                    const active = activeFilter?.type === preset.type && activeFilter.name === preset.name;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          const nextFilter = active ? null : { type: preset.type, name: preset.name };
                          onQueryChange?.("");
                          setTaxType("category");
                          setTaxSearch("");
                          handleSetFilter(nextFilter);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          active
                            ? "bg-white text-black font-bold ring-1 ring-white/90 shadow-sm"
                            : "bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={applyCodeFilter} className="flex items-center gap-2">
                  <label htmlFor="jax-code-filter" className="sr-only">Filter by JAV code</label>
                  <input
                    id="jax-code-filter"
                    type="search"
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value)}
                    placeholder="Code, e.g. KNMB-134"
                    className="h-8 min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none w-36 sm:w-44"
                  />
                  <button type="submit" className="h-8 rounded-lg bg-white/10 hover:bg-white/20 px-3 text-xs font-semibold text-white transition">
                    Find
                  </button>
                </form>
              </div>
            )}

            {/* Row 4: Search input for taxonomy */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-1 border-t border-white/5">
              <label htmlFor="taxonomy-search" className="shrink-0 text-xs font-medium text-zinc-400">
                Find {taxType === "category" ? "categories" : taxType === "actor" ? actorLabel.toLowerCase() : `${taxType}s`}:
              </label>
              <input
                id="taxonomy-search"
                type="search"
                value={taxSearch}
                onChange={(event) => setTaxSearch(event.target.value)}
                placeholder={taxType === "studio" ? "Search a studio, e.g. Team Skeet" : `Search ${taxType}...`}
                className="h-8 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none sm:max-w-xs"
              />
            </div>

            {taxLoading && <p role="status" className="text-xs text-zinc-400">Loading filters…</p>}
            {taxError && (
              <div role="alert" className="flex flex-wrap items-center gap-3 text-xs text-amber-200">
                <span>Filters could not be loaded.</span>
                <button type="button" onClick={() => setTaxReload((value) => value + 1)} className="rounded-lg border border-white/10 px-3 py-1 font-semibold text-white hover:bg-white/10">
                  Retry
                </button>
              </div>
            )}
            {!taxLoading && !taxError && taxSearch.trim() && taxItems.length === 0 && !showTeamSkeetSuggestion && (
              <p role="status" className="text-xs text-zinc-400">No matching {taxType}s found.</p>
            )}

            {/* Interactive Taxonomy Pills Slider */}
            {(taxItems.length > 0 || showTeamSkeetSuggestion) && (
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none touch-scroll max-w-full">
                <button
                  type="button"
                  onClick={() => handleSetFilter(null)}
                  className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
                    !activeFilter
                      ? "bg-white text-black font-bold ring-1 ring-white/90 shadow-sm"
                      : "bg-[#080a0f] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  All
                </button>

                {section === "lust" && taxType === "category" && (
                  <button
                    type="button"
                    aria-pressed={activeFilter?.type === "premium"}
                    onClick={() => {
                      onQueryChange?.("");
                      const nextFilter = activeFilter?.type === "premium"
                        ? null
                        : { type: "premium" as const, name: "Premium Studios" };
                      handleSetFilter(nextFilter);
                    }}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                      activeFilter?.type === "premium"
                        ? "border-amber-400/60 bg-amber-500/20 text-amber-200 font-bold ring-1 ring-amber-400/30"
                        : "border-amber-400/30 bg-[#12100a] text-amber-200/90 hover:border-amber-300/50 hover:bg-amber-500/[0.12] hover:text-amber-100"
                    }`}
                  >
                    <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
                    <span>Premium Studios</span>
                  </button>
                )}

                {section === "jax" && taxType === "category" && (
                  <button
                    type="button"
                    aria-pressed={activeFilter?.type === "category" && activeFilter.name === "decnsoredsubbed"}
                    onClick={() => {
                      onQueryChange?.("");
                      const nextFilter = activeFilter?.type === "category" && activeFilter.name === "decnsoredsubbed"
                        ? null
                        : { type: "category" as const, name: "decnsoredsubbed" };
                      handleSetFilter(nextFilter);
                    }}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                      activeFilter?.type === "category" && activeFilter.name === "decnsoredsubbed"
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200 font-bold ring-1 ring-emerald-400/30"
                        : "border-emerald-400/30 bg-[#0a120e] text-emerald-200/90 hover:border-emerald-300/50 hover:bg-emerald-500/[0.12] hover:text-emerald-100"
                    }`}
                  >
                    <Sparkles className="h-3 w-3 text-emerald-300 shrink-0" />
                    <span>Decensored Subbed</span>
                  </button>
                )}

                {showTeamSkeetSuggestion && (
                  <button
                    type="button"
                    onClick={() => {
                      onQueryChange?.("");
                      onSectionChange?.("lust");
                      handleSetFilter({ type: "studio", name: "Teamskeet" });
                    }}
                    className="h-7 shrink-0 rounded-lg border border-cyan-300/25 bg-cyan-400/[0.08] px-2.5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
                  >
                    Team Skeet <span className="ml-1 text-[10px] text-zinc-400">Lust studio</span>
                  </button>
                )}

                {taxItems.map((item) => {
                  const active = activeFilter?.type === taxType && activeFilter?.name === item.name;
                  const itemLabel = taxType === "studio" ? formatStudioLabel(item.name) : item.name;
                  return (
                    <Link
                      key={item.id}
                      href={`/browse/${taxType}/${encodeURIComponent(item.slug)}?section=${section}&name=${encodeURIComponent(item.name)}`}
                      className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        active
                          ? "bg-white text-black font-bold ring-1 ring-white/90 shadow-sm"
                          : "bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      <span>{itemLabel}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {feedError && (
        <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-100/90">{feedError}</p>
          <button
            type="button"
            onClick={() => fetchPage(1)}
            disabled={busy}
            className="min-h-11 shrink-0 rounded-lg border border-amber-200/20 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* Dedicated persistent scroll anchor positioned immediately above the post catalog grid */}
      <div ref={gridTopRef} className="scroll-mt-28 sm:scroll-mt-32 pointer-events-none -mt-4 h-0" />

      {/* Catalog cards reflow to two columns on phones and expand on larger screens. */}
      {items.length === 0 && !busy && !feedError ? (
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
      ) : items.length > 0 ? (
        <div
          className={`mt-6 sm:mt-8 grid gap-4 sm:gap-6 transition-all duration-300 ${
            busy ? "opacity-60 transition-opacity" : "opacity-100"
          } ${
            viewDensity === "cinematic"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {items.filter(Boolean).map((item, idx) => (
            <div
              key={item.key || item.id || String(Math.random())}
              className="card-stagger-item"
              style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
            >
              <TileCard item={item} />
            </div>
          ))}
        </div>
      ) : null}

      {/* Catalog Pagination — positioned immediately below video posts */}
      {items.length > 0 && totalPages > 1 && (
        <nav aria-label="Catalog pagination" className="mt-8 flex items-center justify-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={busy || page <= 1}
            className="min-h-11 min-w-24 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span aria-live="polite" className="min-w-16 text-center text-sm font-medium text-white/60">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={busy || page >= totalPages}
            className="min-h-11 min-w-24 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}

      {/* Community Curated Collections (Chikari.moe-style discovery) */}
      {!query && !activeFilter && page === 1 && (
        <CommunityPlaylistsSection currentSection={section} />
      )}

      <div className="mt-8 flex min-h-11 justify-center py-2" aria-live="polite">
        {busy && (
          <div className="flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-5 py-2.5 backdrop-blur-md">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold text-white/80">Loading titles...</span>
          </div>
        )}
      </div>
    </section>
  );
}
