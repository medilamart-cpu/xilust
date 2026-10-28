"use client";

import { Star, Plus, Check, Play, Film } from "lucide-react";
import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { GeneratedArt } from "./GeneratedArt";

/* ---------- unified card model ---------- */

export interface CardModel {
  key: string;
  id?: number;
  section?: "lust" | "jax";
  slug?: string;
  code?: string;
  name: string;
  kind: "FILM" | "SERIES";
  year: number;
  rating: number;
  posterUrl: string | null;
  backdropUrl?: string | null;
  overview?: string;
  popularity?: number;
  studios?: string[];
  actors?: string[];
  categories?: string[];
  sourcesCount?: number;
  uploadedAt?: string;
}

export function cardOfItem(item: any): CardModel {
  return {
    key: String(item.id || item.key),
    id: item.id,
    name: item.title || item.name || "",
    kind: item.media_type === "tv" ? "SERIES" : "FILM",
    year: parseInt((item.release_date || item.first_air_date || "2026").slice(0, 4), 10) || 2026,
    rating: item.vote_average || 0,
    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
    popularity: item.popularity || 0,
  };
}

/* ---------- My List (localStorage-backed) ---------- */

export interface ListItem {
  id: number;
  section: "lust" | "jax";
  slug: string;
  name: string;
  posterUrl: string | null;
  year: number;
  rating: number;
  kind: "FILM" | "SERIES";
  code?: string;
  uploadedAt?: string;
  key?: string;
}

const LS_KEY = "xilust-mylist-v1";

export function readList(): ListItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as ListItem[];
  } catch {
    return [];
  }
}

function writeList(l: ListItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(l));
  window.dispatchEvent(new Event("mylist-change"));
}

const ListCtx = createContext<{
  has: (key: string) => boolean;
  toggle: (c: CardModel) => void;
}>({ has: () => false, toggle: () => {} });

export function MyListProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      try {
        setKeys(JSON.parse(localStorage.getItem("xilust-mylist-keys") ?? "[]") as string[]);
      } catch {
        setKeys([]);
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

  const has = (key: string) => keys.includes(key);

  const toggle = (c: CardModel) => {
    const current: string[] = (() => {
      try {
        return JSON.parse(localStorage.getItem("xilust-mylist-keys") ?? "[]");
      } catch {
        return [];
      }
    })();
    const list = readList();
    if (current.includes(c.key)) {
      localStorage.setItem(
        "xilust-mylist-keys",
        JSON.stringify(current.filter((k) => k !== c.key)),
      );
      writeList(list.filter((x) => x.key !== c.key));
    } else {
      const item: ListItem = {
        id: c.id ?? 0,
        section: c.section || "lust",
        slug: c.slug || "",
        name: c.name,
        posterUrl: c.posterUrl,
        year: c.year,
        rating: c.rating,
        kind: c.kind,
        code: c.code,
        uploadedAt: c.uploadedAt,
        key: c.key,
      };
      localStorage.setItem("xilust-mylist-keys", JSON.stringify([c.key, ...current]));
      writeList([item, ...list]);
    }
  };

  return <ListCtx.Provider value={{ has, toggle }}>{children}</ListCtx.Provider>;
}

export const useMyList = () => useContext(ListCtx);

export function viewsLabel(pop?: number): string | null {
  if (!pop || pop <= 0) return null;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${Math.round(pop / 1_000)}K`;
  return String(pop);
}

export function TileCard({ item }: { item: CardModel }) {
  const { has, toggle } = useMyList();
  const saved = has(item.key);
  const [imgError, setImgError] = useState(false);

  const sec = item.section || "lust";
  const slug = item.slug || String(item.id || "");
  const href = `/title/${sec}/${encodeURIComponent(slug)}`;
  const views = viewsLabel(item.popularity);
  const art = !imgError ? (item.backdropUrl ?? item.posterUrl) : null;

  const isJax = item.section === "jax";
  const primaryStudio = item.studios?.[0] || "";
  const studioLabel = primaryStudio.toLowerCase() === "teamskeet" ? "Team Skeet" : primaryStudio;
  const uploadDate = item.uploadedAt && !Number.isNaN(Date.parse(item.uploadedAt))
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.uploadedAt))
    : null;

  return (
    <div className="group block shrink-0 rounded-xl text-left">
      <Link
        href={href}
        className="block focusable rounded-xl"
        aria-label={`${item.name}, ${item.year}`}
      >
        <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0d1017] shadow-[0_8px_28px_rgba(0,0,0,0.55)] transition-[transform,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/40">
          {art ? (
            <img
              src={art}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              loading="lazy"
              onError={() => setImgError(true)}
              draggable={false}
            />
          ) : (
            <div className="relative h-full w-full">
              <GeneratedArt name={item.name} kind={item.kind} wide />
              {item.code && (
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <span className="self-start rounded-md bg-pink-500/80 px-2 py-0.5 text-xs font-black tracking-wider text-white shadow-lg backdrop-blur-md">
                    {item.code}
                  </span>
                  <div className="space-y-1">
                    <p className={`${isJax ? "line-clamp-2" : "break-words"} text-xs font-semibold text-white/95`}>{item.name}</p>
                    {item.actors && item.actors.length > 0 && (
                      <p className="text-[10px] text-pink-300 font-medium">🌸 {item.actors[0]}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* hover veil + play button */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/85 via-black/20 to-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.6)] backdrop-blur-md transition-transform duration-300 group-hover:scale-100">
              <Play className="ml-0.5 h-5 w-5 fill-cyan-300 text-cyan-300" />
            </span>
          </div>

          {/* Badge: HD / CleanStream */}
          <span className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 flex items-center gap-1 rounded bg-black/75 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-[0.14em] text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
            HD
          </span>

          {/* Code badge if present on top left */}
          {item.code && art && (
            <span className="absolute left-1.5 sm:left-2 top-1.5 sm:top-2 rounded bg-pink-600/90 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black tracking-wider text-white shadow-md backdrop-blur-md">
              {item.code}
            </span>
          )}

          {/* Lust studio badge; JAX keeps its code badge in this position. */}
          {!isJax && primaryStudio && (
            <span
              title={primaryStudio}
              className="absolute left-1.5 sm:left-2 top-1.5 sm:top-2 max-w-[48%] truncate rounded bg-purple-950/85 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide text-white shadow-md ring-1 ring-white/15 backdrop-blur-md"
            >
              {studioLabel}
            </span>
          )}

          {/* Section pill on bottom left */}
          <span className={`absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-[0.12em] text-white shadow backdrop-blur-md ${
            isJax ? "bg-pink-500/80" : "bg-purple-600/80"
          }`}>
            {isJax ? "JAX" : "LUST"}
          </span>

          {/* Rating pill on bottom right */}
          <span className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 flex items-center gap-0.5 sm:gap-1 rounded-md bg-black/75 px-1 sm:px-1.5 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold text-cyan-200 border border-white/10 backdrop-blur-md">
            <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-cyan-300 text-cyan-300" />
            {item.rating > 0 ? item.rating.toFixed(1) : "—"}
          </span>
        </div>
      </Link>

      {/* Info footer */}
      <div className="mt-2 sm:mt-2.5 flex items-start justify-between gap-1.5 sm:gap-2">
        <Link href={href} className="flex-1 min-w-0">
          <p className={`${isJax ? "line-clamp-1 sm:truncate" : "break-words"} text-xs sm:text-[13.5px] font-semibold leading-snug text-white/90 transition-colors group-hover:text-cyan-300`}>
            {item.name}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-white/50">
            <span>{item.year || "2026"}</span>
            {item.studios && item.studios.length > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{item.studios[0]}</span>
              </>
            )}
            {item.sourcesCount && item.sourcesCount > 0 && (
              <>
                <span className="text-white/20 hidden xs:inline">·</span>
                <span className="text-cyan-400 font-medium hidden xs:inline">{item.sourcesCount} Mirrors</span>
              </>
            )}
            {uploadDate && (
              <span className="basis-full text-[10px] text-white/40 sm:text-[11px]">
                Uploaded {uploadDate}
              </span>
            )}
          </p>
        </Link>

        {/* My List bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle(item);
          }}
          aria-label={saved ? `Remove from my list` : `Add to my list`}
          className="flex h-8 w-8 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 active:scale-90 text-white/70 hover:text-white transition-all"
        >
          {saved ? (
            <Check className="h-3.5 w-3.5 text-cyan-300" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
