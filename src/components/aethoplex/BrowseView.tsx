"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, Loader2 } from "lucide-react";
import { useTmdb, tmdb, type Paged, type TmdbItem, type Genre } from "@/lib/tmdb";
import { TileCard, cardOfItem, type CardModel } from "./PosterCard";
import { site } from "@/lib/catalog";

export type BrowseKind = "films" | "series" | "anime" | "live";

const CONFIG: Record<
  BrowseKind,
  { title: string; sub: string; base: "movie" | "tv"; extra: Record<string, string | number>; badge?: string }
> = {
  films: {
    title: "Films",
    sub: "Every movie worth your evening, sorted your way.",
    base: "movie",
    extra: { "vote_count.gte": 200 },
  },
  series: {
    title: "Series",
    sub: "Long-form stories for the long haul.",
    base: "tv",
    extra: { "vote_count.gte": 200 },
  },
  anime: {
    title: "Anime",
    sub: "Animation from Japan — series and films, hand-picked.",
    base: "tv",
    extra: { with_genres: 16, with_original_language: "ja" },
  },
  live: {
    title: "Live",
    sub: "On air right now — episodes landing this week.",
    base: "tv",
    extra: { "vote_count.gte": 50 },
    badge: "LIVE",
  },
};

export function BrowseView({
  kind,
  onOpen,
}: {
  kind: BrowseKind;
  onOpen: (c: CardModel) => void;
}) {
  const cfg = CONFIG[kind];
  const [genre, setGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [items, setItems] = useState<CardModel[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(9999);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const { data: genreData } = useTmdb<{ genres: Genre[] }>(`genre/${cfg.base}/list`);

  /* everything that resets pagination */
  const resetKey = `${kind}|${genre ?? 0}|${sortBy}`;

  const fetchPage = useCallback(
    async (p: number) => {
      setBusy(true);
      try {
        const data = await tmdb<Paged<TmdbItem>>(
          kind === "live" ? "tv/on_the_air" : `discover/${cfg.base}`,
          {
            ...cfg.extra,
            sort_by: sortBy,
            page: p,
            ...(genre ? { with_genres: genre } : {}),
          },
        );
        setTotal(Math.min(data.total_pages, 500));
        setItems((prev) => {
          const fresh = data.results
            .filter((r) => r.poster_path && r.media_type !== "person")
            .map((r) => cardOfItem(r));
          if (p === 1) return fresh;
          const seen = new Set(prev.map((x) => x.key));
          return [...prev, ...fresh.filter((f) => !seen.has(f.key))];
        });
        setPage(p);
      } catch {
        /* keep prior items on error */
      } finally {
        setBusy(false);
      }
    },
    [kind, cfg.base, cfg.extra, sortBy, genre],
  );

  /* load page 1 whenever filters change — async callback keeps hooks rule happy */
  const currentKey = useRef("");
  useEffect(() => {
    if (currentKey.current === resetKey) return;
    currentKey.current = resetKey;
    const t = setTimeout(() => {
      setItems([]);
      setDone(false);
      fetchPage(1);
    }, 0);
    return () => clearTimeout(t);
  }, [resetKey, fetchPage]);

  /* page 2+ — triggered by load-more (event) or sentinel (subscription) */
  const loadMore = useCallback(() => {
    if (busy || page >= total || items.length === 0) return;
    fetchPage(page + 1);
  }, [busy, page, total, items.length, fetchPage]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const firstLoad = items.length === 0 && busy;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6 lg:px-8">
      {/* heading */}
      <div className="flex items-center gap-2.5">
        <span className="eyebrow">{site.name}</span>
        <span className="h-px w-6 bg-white/25" />
        {cfg.badge && (
          <span className="rounded-full border border-[#b09bff]/50 bg-[#b09bff]/10 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em] text-[#cdbcff]">
            ● {cfg.badge}
          </span>
        )}
      </div>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-[#f5f6fb] md:text-5xl">
        {cfg.title}
      </h1>
      <p className="mt-2 text-[13.5px] text-white/60">{cfg.sub}</p>

      {/* filter bar */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-5">
        <div className="glass-soft flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-white/60">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="no-scrollbar flex max-w-[60%] flex-nowrap items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setGenre(null)}
            className={`focusable shrink-0 rounded-lg px-3 py-1.5 text-[12px] transition ${
              genre === null
                ? "border border-white/80 bg-[#c5e0fa]/15 font-semibold text-white"
                : "border border-white/[0.09] bg-white/[0.04] text-white/60 hover:text-white/90"
            }`}
          >
            All genres
          </button>
          {(genreData?.genres ?? []).map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`focusable shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] transition ${
                genre === g.id
                  ? "border border-white/80 bg-[#c5e0fa]/15 font-semibold text-white"
                  : "border border-white/[0.09] bg-white/[0.04] text-white/60 hover:text-white/90"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort results"
            className="glass focusable appearance-none rounded-lg py-2 pl-4 pr-10 text-[12.5px] text-white/85 focus:outline-none"
          >
            <option value="popularity.desc" className="bg-[#10131b]">Most popular</option>
            <option value="vote_average.desc" className="bg-[#10131b]">Highest rated</option>
            <option
              value={cfg.base === "movie" ? "release_date.desc" : "first_air_date.desc"}
              className="bg-[#10131b]"
            >
              Newest first
            </option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
        </div>
      </div>

      {/* grid */}
      {firstLoad ? (
        <div className="mt-10 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-xl bg-white/[0.05]" />
              <div className="mt-2 h-3.5 w-3/4 rounded bg-white/[0.05]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 && !busy ? (
        <div className="glass mt-10 rounded-2xl px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white/85">Nothing found</p>
          <p className="mt-2 text-[13px] text-white/55">
            Try a different genre or sort order.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((it) => (
            <TileCard key={it.key} item={it} />
          ))}
        </div>
      )}

      {/* load more */}
      <div ref={sentinel} className="mt-10 flex justify-center">
        {busy && items.length > 0 && (
          <Loader2 className="h-5 w-5 animate-spin text-white/50" />
        )}
        {!busy && page >= total && items.length > 0 && (
          <p className="text-[12px] text-white/40">You've reached the end.</p>
        )}
        {!busy && page < total && items.length > 0 && (
          <button
            onClick={loadMore}
            className="glass-soft focusable flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-medium text-white/85 transition hover:bg-white/15"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
