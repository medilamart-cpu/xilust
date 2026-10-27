"use client";

import { Search, Loader2 } from "lucide-react";
import {
  useTmdb, useDebounced,
  type Paged, type TmdbItem,
} from "@/lib/tmdb";
import { TileCard, cardOfItem, type CardModel } from "./PosterCard";

export function SearchView({
  query,
  onQueryChange,
  onOpen,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onOpen: (c: CardModel) => void;
}) {
  const dq = useDebounced(query.trim(), 400);
  const go = dq.length >= 2;

  const { data, loading } = useTmdb<Paged<TmdbItem>>(
    go ? "search/multi" : null,
    { query: dq, include_adult: "false" },
  );

  const items = (data?.results ?? [])
    .filter((r) => r.media_type !== "person" && r.poster_path)
    .map((r) => cardOfItem(r));
  const people = (data?.results ?? []).filter((r) => r.media_type === "person" && r.profile_path).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6 lg:px-8">
      <span className="eyebrow">Search</span>
      <div className="glass mt-4 flex h-14 max-w-2xl items-center gap-4 rounded-2xl px-6">
        <Search className="h-5 w-5 shrink-0 text-white/50" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search films, series, people…"
          aria-label="Search films, series, people"
          autoFocus
          className="w-full bg-transparent text-[15px] text-white placeholder:text-white/40 focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />}
      </div>

      {go && items.length === 0 && !loading && (
        <div className="glass mt-10 rounded-2xl px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white/85">No results for “{dq}”</p>
          <p className="mt-2 text-[13px] text-white/55">Check the spelling or try a broader term.</p>
        </div>
      )}

      {people.length > 0 && (
        <div className="mt-10">
          <h3 className="text-[13px] font-semibold tracking-[0.14em] text-white/55">PEOPLE</h3>
          <div className="mt-4 flex flex-wrap gap-4">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                { }
                <img
                  src={`https://image.tmdb.org/t/p/w185${p.profile_path}`}
                  alt={p.name ?? ""}
                  className="h-12 w-12 rounded-full border border-white/15 object-cover"
                  loading="lazy"
                />
                <span className="text-[13px] text-white/85">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((it) => (
            <TileCard key={it.key} item={it} />
          ))}
        </div>
      )}

      {!go && (
        <p className="mt-10 text-[13px] text-white/45">
          Type at least 2 characters — results come live from TMDB.
        </p>
      )}
    </div>
  );
}
