"use client";

/* TMDB client helpers — talk to the server-side proxy at /api/tmdb/*.
 * The API key never reaches the browser. */

import { useEffect, useState, useRef } from "react";

export type MediaType = "movie" | "tv";

export interface TmdbItem {
  id: number;
  media_type?: MediaType | string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  genre_ids?: number[];
  popularity?: number;
}

export interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export const img = (
  path?: string | null,
  size: "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original" = "w342",
) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);

export const titleOf = (i: TmdbItem) => i.title || i.name || i.original_title || i.original_name || "Untitled";
export const kindOf = (i: TmdbItem): "FILM" | "SERIES" =>
  i.media_type === "movie" || (!i.media_type && i.title) ? "FILM" : "SERIES";
export const yearOf = (i: TmdbItem) =>
  parseInt((i.release_date || i.first_air_date || "0").slice(0, 4), 10) || 0;
export const ratingOf = (i: TmdbItem) => Math.round((i.vote_average ?? 0) * 10) / 10;

/* ---- fetch with in-memory cache ---- */

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export async function tmdb<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const key = `${path}?${qs.toString()}`;

  if (cache.has(key)) return cache.get(key) as T;
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;

  const p = fetch(`/api/tmdb/${path}?${qs.toString()}`)
    .then(async (r) => {
      if (!r.ok) throw new Error(`TMDB ${r.status}`);
      const data = (await r.json()) as T;
      cache.set(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((e) => {
      inflight.delete(key);
      throw e;
    });

  inflight.set(key, p);
  return p;
}

/* ---- react hook ---- */

export function useTmdb<T>(
  path: string | null,
  params: Record<string, string | number | undefined> = {},
) {
  const paramKey = JSON.stringify(params);
  const reqKey = path ? `${path}?${paramKey}` : "";
  const [entry, setEntry] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  }>({ key: "", data: null, error: null });

  useEffect(() => {
    if (!path) return;
    let alive = true;
    tmdb<T>(path, JSON.parse(paramKey))
      .then((d) => {
        if (alive) setEntry({ key: reqKey, data: d, error: null });
      })
      .catch((e) => {
        if (alive) setEntry({ key: reqKey, data: null, error: String(e.message ?? e) });
      });
    return () => {
      alive = false;
    };
  }, [path, paramKey, reqKey]);

  /* derived — avoids sync setState in effects */
  const matched = entry.key === reqKey;
  const loading = !!path && !matched;
  const data = matched ? entry.data : null;
  const error = matched ? entry.error : null;

  return { data, loading, error };
}

/* ---- debounced value helper (for search) ---- */

export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setV(value), ms);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [value, ms]);
  return v;
}
