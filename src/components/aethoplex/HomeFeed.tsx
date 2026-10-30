"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Flame, Loader2, Sparkles, Trophy, Shuffle, Filter, Star, Film, Tag, X, Clock } from "lucide-react";
import { TileCard, type CardModel } from "./PosterCard";
import type { TaxonomyItem } from "@/lib/catalog-db";
import { formatStudioLabel } from "@/lib/studio-label";

const PAGE_SIZE = 20;

type TabId = "trending" | "new" | "top" | "random" | "movies" | "longform";
type TaxonomyType = "category" | "actor" | "studio" | "tag";
type FilterType = TaxonomyType | "code" | "premium";

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "new", label: "Newest Releases", icon: Sparkles },
  { id: "movies", label: "Feature Movies", icon: Film },
  { id: "longform", label: "Longform (60+ min)", icon: Clock },
  { id: "top", label: "Most Popular / Views", icon: Trophy },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "random", label: "Discover Random", icon: Shuffle },
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
  const [tab, setTab] = useState<TabId>("new");
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Load taxonomy list whenever section or taxType changes
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setTaxLoading(true);
    setTaxError(false);
    setTaxItems([]);
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
            setTaxItems(d.items || []);
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
    }, 180);

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

      setBusy(true);
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

  // Reset page & list when section, query, tab, or activeFilter changes
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    premiumPoolRef.current = null;
    setItems([]);
    setTotalPages(1);
    setPage(1);
    fetchPage(1);
  }, [section, query, tab, activeFilter, jaxSubFilter, fetchPage]);

  const goToPage = (nextPage: number) => {
    if (busy || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setItems([]);
    setPage(nextPage);
    void fetchPage(nextPage);
    // Smooth scroll directly to the first post / top of grid
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
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
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar scrollbar-none touch-scroll max-w-full">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (query) onQueryChange?.("");
                    setTab(t.id);
                  }}
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

        </div>

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

        {/* Categorization Mode Selector & Filters (Hidden in Fans) */}
        {section !== "fans" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-bold overflow-x-auto no-scrollbar scrollbar-none touch-scroll max-w-full">
              <button
                type="button"
                onClick={() => changeTaxType("category")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "category" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" />
                <span>Categories</span>
              </button>

              <button
                type="button"
                onClick={() => changeTaxType("actor")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "actor" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-pink-400" />
                <span>{actorLabel}</span>
              </button>

              {section !== "fans" && (
              <button
                type="button"
                onClick={() => changeTaxType("studio")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "studio" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Film className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-400" />
                <span>Studios</span>
              </button>
              )}

              <button
                type="button"
                onClick={() => changeTaxType("tag")}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  taxType === "tag" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                <span>Tags</span>
              </button>
            </div>
            <Link href={`/browse/${browseTaxType}?section=${section}`} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/[0.06] px-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/15">
              View all <span aria-hidden="true">→</span>
            </Link>

            {/* Active filter banner with instant sorting selector */}
            {activeFilter && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Viewing {activeFilter.type === "code" ? "JAV code" : activeFilter.type === "premium" ? "studio collection" : activeFilter.type}:</span>
                  <span className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                    <span>{activeFilter.type === "actor" ? "🌸" : activeFilter.type === "studio" ? "🎬" : activeFilter.type === "code" ? "🔎" : activeFilter.type === "premium" ? "✨" : "🏷️"}</span>
                    <span>{activeFilter.name === "decnsoredsubbed" ? "Decensored Subbed" : activeFilter.type === "studio" ? formatStudioLabel(activeFilter.name) : activeFilter.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setJaxSubFilter(null);
                      handleSetFilter(null);
                    }}
                    className="ml-1 rounded-full p-1 bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                    title="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {section === "jax" && (activeFilter.type === "actor" || activeFilter.type === "studio") && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
                    <span className="text-[11px] font-semibold text-white/40 mr-1 shrink-0">Filter:</span>
                    {(["Subbed", "Uncensored", "4K"] as const).map((fmt) => {
                      const active = jaxSubFilter === fmt;
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setJaxSubFilter(active ? null : fmt)}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            active
                              ? "bg-pink-500 text-white font-bold shadow-md shadow-pink-500/30"
                              : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5"
                          }`}
                        >
                          {fmt === "4K" ? "⚡ 4K" : fmt === "Subbed" ? "💬 Subbed" : "🔓 Uncensored"}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Sort Options for filtered page */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
                  <span className="text-[11px] font-semibold text-white/40 mr-1 shrink-0">Sort:</span>
                  <button
                    type="button"
                    onClick={() => setTab("new")}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      tab === "new"
                        ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/20"
                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Newest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("top")}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      tab === "top"
                        ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/20"
                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Trophy className="h-3 w-3" />
                    <span>Popular / Views</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("trending")}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      tab === "trending"
                        ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/20"
                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    <span>Trending</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("random")}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      tab === "random"
                        ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/20"
                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Shuffle className="h-3 w-3" />
                    <span>Random</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {section === "jax" && (
            <div className="flex flex-col gap-3">
              <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.015] p-3 sm:p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">Featured JAV formats</p>
                  <p className="mt-1 text-[11px] text-white/45">Choose a format to narrow the catalog</p>
                </div>
                <div className="flex max-w-full flex-wrap gap-2.5" role="group" aria-label="Featured JAV formats">
                  {JAV_FORMAT_FILTERS.map((preset) => {
                    const active = activeFilter?.type === preset.type && activeFilter.name === preset.name;
                    const tone = preset.label === "Decensored Subbed"
                      ? "border-emerald-300/40 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-100 shadow-emerald-500/10"
                      : preset.label === "Uncensored"
                        ? "border-fuchsia-300/35 bg-gradient-to-r from-fuchsia-500/20 to-violet-500/15 text-fuchsia-100"
                        : preset.label === "English Subbed"
                          ? "border-cyan-300/35 bg-gradient-to-r from-cyan-500/20 to-blue-500/15 text-cyan-100"
                          : "border-amber-300/35 bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-100";
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
                        className={`min-h-11 rounded-full border px-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                          active
                            ? "border-white/80 bg-white text-slate-950 shadow-lg shadow-white/10"
                            : `${tone} hover:border-white/45 hover:brightness-110`
                        }`}
                      >
                        {preset.label === "Decensored Subbed" ? "⚡ Decensored Subbed" : preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={applyCodeFilter} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="jax-code-filter" className="sr-only">Filter by JAV code</label>
                <input
                  id="jax-code-filter"
                  type="search"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  placeholder="JAV code, e.g. KNMB-134"
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:outline-none sm:max-w-xs"
                />
                <button type="submit" className="min-h-11 rounded-lg bg-cyan-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                  Find code
                </button>
              </form>

            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="taxonomy-search" className="shrink-0 text-xs font-semibold text-white/55">
              Find {taxType === "actor" ? actorLabel.toLowerCase() : `${taxType}s`}
            </label>
            <input
              id="taxonomy-search"
              type="search"
              value={taxSearch}
              onChange={(event) => setTaxSearch(event.target.value)}
              placeholder={taxType === "studio" ? "Search a studio, e.g. Team Skeet" : `Search ${taxType}...`}
              className="min-h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:outline-none sm:max-w-sm"
            />
          </div>

          {taxLoading && <p role="status" className="text-xs text-white/45">Loading filters…</p>}
          {taxError && (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-xs text-amber-100/80">
              <span>Filters could not be loaded.</span>
              <button type="button" onClick={() => setTaxReload((value) => value + 1)} className="min-h-11 rounded-lg border border-white/10 px-3 font-semibold text-white hover:bg-white/10">
                Retry filters
              </button>
            </div>
          )}
          {!taxLoading && !taxError && taxSearch.trim() && taxItems.length === 0 && !showTeamSkeetSuggestion && (
            <p role="status" className="text-xs text-white/45">No matching {taxType}s found.</p>
          )}

          {/* Interactive Taxonomy Pills Slider */}
          {(taxItems.length > 0 || showTeamSkeetSuggestion) && (
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
                  className={`min-h-11 shrink-0 rounded-lg border px-3 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                    activeFilter?.type === "premium"
                      ? "border-amber-200 bg-amber-100 text-slate-950 shadow-lg shadow-amber-400/15"
                      : "border-amber-200/25 bg-gradient-to-r from-amber-300/15 to-orange-400/10 text-amber-100 hover:border-amber-100/50 hover:from-amber-300/25"
                  }`}
                >
                  ✦ Premium Studios
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
                  className={`min-h-11 shrink-0 rounded-lg border px-3 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 ${
                    activeFilter?.type === "category" && activeFilter.name === "decnsoredsubbed"
                      ? "border-emerald-300 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20"
                      : "border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-100 hover:border-emerald-300/60 hover:from-emerald-500/30"
                  }`}
                >
                  ⚡ Decensored Subbed
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
                  className="min-h-11 shrink-0 rounded-lg border border-cyan-300/25 bg-cyan-400/[0.08] px-3 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Team Skeet <span className="ml-1 text-[10px] text-white/45">Lust studio</span>
                </button>
              )}

              {taxItems.map((item) => {
                const active = activeFilter?.type === taxType && activeFilter?.name === item.name;
                const itemLabel = taxType === "studio" ? formatStudioLabel(item.name) : item.name;
                return (
                  <Link
                    key={item.id}
                    href={`/browse/${taxType}/${encodeURIComponent(item.slug)}?section=${section}&name=${encodeURIComponent(item.name)}`}
                    className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                      active
                        ? section === "jax"
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md shadow-pink-500/25"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md shadow-purple-500/25"
                        : "bg-white/[0.03] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>{itemLabel}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        )}
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
        <div ref={gridTopRef} className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 scroll-mt-20">
          {items.map((item) => (
            <TileCard key={item.key} item={item} />
          ))}
        </div>
      ) : null}

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
