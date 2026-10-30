"use client";

import { Star, Plus, Check, Play, Film, Clock, Sparkles } from "lucide-react";
import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import Link from "next/link";
import { GeneratedArt } from "./GeneratedArt";
import { formatStudioLabel } from "@/lib/studio-label";

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
  fallbackUrl?: string | null;
  overview?: string;
  popularity?: number;
  studios?: string[];
  actors?: string[];
  categories?: string[];
  sourcesCount?: number;
  uploadedAt?: string;
  durationSeconds?: number | null;
}

export { formatVideoDuration, extractCleanTitleAndDate } from "@/lib/video-utils";

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

/* ---------- Tile Card with Hover Video Preview & Timeline Scrubber ---------- */

export function TileCard({ item }: { item: CardModel }) {
  const { has, toggle } = useMyList();
  const saved = has(item.key);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(item.backdropUrl ?? item.posterUrl ?? item.fallbackUrl ?? null);

  // Video Preview & Timeline scrubber states
  const [isHovered, setIsHovered] = useState(false);
  const [scrubPercent, setScrubPercent] = useState<number | null>(null);
  const [previewSec, setPreviewSec] = useState<number>(0);
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setImgSrc(item.backdropUrl ?? item.posterUrl ?? item.fallbackUrl ?? null);
    setImgError(false);
    setImageLoaded(false);
  }, [item.backdropUrl, item.posterUrl, item.fallbackUrl]);

  const handleImgError = () => {
    if (imgSrc && imgSrc !== item.fallbackUrl && item.fallbackUrl) {
      setImgSrc(item.fallbackUrl);
    } else {
      setImageLoaded(false);
      setImgError(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    let sec = 0;
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    previewTimerRef.current = window.setInterval(() => {
      sec += 1;
      setPreviewSec(sec);
    }, 450);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setScrubPercent(null);
    setPreviewSec(0);
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = Math.round((x / rect.width) * 100);
    setScrubPercent(pct);
  };

  const sec = item.section || "lust";
  const slug = item.slug || String(item.id || "");
  const href = `/title/${sec}/${encodeURIComponent(slug)}`;
  const art = !imgError ? imgSrc : null;

  const isJax = item.section === "jax";
  const primaryStudio = item.studios?.[0] || "";
  const studioLabel = formatStudioLabel(primaryStudio);
  const durationLabel = formatVideoDuration(item.durationSeconds, item.name, item.id, item.section);

  const { cleanTitle, originalYear } = extractCleanTitleAndDate(item.name, item.year);

  // Active timeline progress calculation: mouse scrub or auto-advancing preview loop
  const activeProgress = scrubPercent !== null ? scrubPercent : ((previewSec * 7) % 100);

  return (
    <div className="group block shrink-0 rounded-xl text-left">
      <Link
        href={href}
        className="block focusable rounded-xl"
        aria-label={`${cleanTitle}, ${originalYear || ""}`}
      >
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0d1017] shadow-[0_8px_28px_rgba(0,0,0,0.55)] transition-[transform,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/50"
        >
          {art ? (
            <>
              {!imageLoaded && (
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-violet-950/70 via-slate-900 to-[#0d1017] animate-pulse motion-reduce:animate-none">
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
                </div>
              )}
              <img
                src={art}
                alt={cleanTitle}
                className={`h-full w-full object-cover transition-all duration-500 ${
                  isHovered ? "scale-[1.08] brightness-105" : "scale-100"
                } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                style={{
                  transformOrigin: scrubPercent !== null ? `${scrubPercent}% 50%` : "50% 50%",
                }}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={handleImgError}
                draggable={false}
              />
            </>
          ) : (
            <div className="relative h-full w-full">
              <GeneratedArt name={cleanTitle} kind={item.kind} wide />
              {item.code && (
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <span className="self-start rounded-md bg-pink-500/80 px-2 py-0.5 text-xs font-black tracking-wider text-white shadow-lg backdrop-blur-md">
                    {item.code}
                  </span>
                  <div className="space-y-1">
                    <p className="line-clamp-2 text-xs font-semibold text-white/95">{cleanTitle}</p>
                    {item.actors && item.actors.length > 0 && (
                      <p className="text-[10px] text-pink-300 font-medium">🌸 {item.actors[0]}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Hover Veil + Play Button */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/85 via-black/20 to-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
            <span className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.6)] backdrop-blur-md transition-transform duration-300 group-hover:scale-100">
              <Play className="ml-0.5 h-5 w-5 fill-cyan-300 text-cyan-300" />
            </span>
          </div>

          {/* Live Video Preview Indicator on Hover */}
          {isHovered && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-full bg-black/85 px-2 py-0.5 text-[9px] font-black tracking-wider text-cyan-300 border border-cyan-400/40 shadow-lg backdrop-blur-md animate-in fade-in duration-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
              </span>
              <span>PREVIEW</span>
              {scrubPercent !== null && (
                <span className="text-white/60 font-mono text-[8.5px] border-l border-white/20 pl-1">
                  {Math.round((scrubPercent / 100) * 100)}%
                </span>
              )}
            </div>
          )}

          {/* Video Timeline Scrubber Bar at Bottom (Visual Progress Preview) */}
          <div
            className={`absolute bottom-0 inset-x-0 z-20 transition-all duration-200 ${
              isHovered ? "h-1.5 bg-black/60 opacity-100" : "h-1 bg-black/30 opacity-60 group-hover:opacity-100"
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, activeProgress))}%` }}
            />
            {/* Timeline chapter markers */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
              <span className="w-0.5 h-full bg-white/20" />
              <span className="w-0.5 h-full bg-white/20" />
              <span className="w-0.5 h-full bg-white/20" />
            </div>
          </div>

          {/* Badge: 4K / HD */}
          <span className={`absolute right-1.5 sm:right-2 top-1.5 sm:top-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-[0.14em] backdrop-blur-md ${
            item.categories?.some(c => c.toLowerCase() === "4k") || item.name.toLowerCase().includes("4k")
              ? "bg-amber-500/80 text-black border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.5)] font-black"
              : "bg-black/75 text-cyan-300 border border-cyan-500/30"
          }`}>
            {item.categories?.some(c => c.toLowerCase() === "4k") || item.name.toLowerCase().includes("4k") ? "4K UHD" : "HD"}
          </span>

          {/* Actual Video Duration Badge on Card (e.g. 45:32, 1:25:10) */}
          <span className="absolute right-1.5 sm:right-2 bottom-3 inline-flex items-center gap-1 rounded bg-black/85 px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-white tracking-wide border border-white/10 shadow-lg backdrop-blur-md z-10">
            <Clock aria-hidden="true" className="h-2.5 w-2.5 text-cyan-300" />
            <span>{durationLabel}</span>
          </span>

          {/* Code badge if present on top left (when not hovered) */}
          {item.code && art && !isHovered && (
            <span className="absolute left-1.5 sm:left-2 top-1.5 sm:top-2 rounded bg-pink-600/90 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black tracking-wider text-white shadow-md backdrop-blur-md">
              {item.code}
            </span>
          )}

          {/* Lust studio badge; JAX keeps its code badge in this position. */}
          {!isJax && primaryStudio && !isHovered && (
            <span
              title={studioLabel}
              className="absolute left-2 top-2 inline-flex min-h-6 max-w-[58%] min-w-0 items-center gap-1.5 rounded-full border border-violet-200/25 bg-slate-950/70 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white/95 shadow-[0_3px_12px_rgba(2,6,23,0.45)] backdrop-blur-md sm:text-[10px]"
            >
              <Film aria-hidden="true" className="h-3 w-3 shrink-0 text-fuchsia-300" />
              <span className="min-w-0 truncate">{studioLabel}</span>
            </span>
          )}

          {/* Section pill on bottom left */}
          <span className={`absolute bottom-3 left-1.5 sm:left-2 rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-[0.12em] text-white shadow backdrop-blur-md z-10 ${
            isJax ? "bg-pink-500/80" : "bg-purple-600/80"
          }`}>
            {isJax ? "JAX" : "LUST"}
          </span>

          {/* Rating pill: shown only for JAX; hidden on Lust */}
          {isJax && item.rating > 0 && (
            <span className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 sm:left-auto sm:right-16 flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9.5px] font-semibold text-cyan-200 border border-white/10 backdrop-blur-md">
              <Star className="h-2 w-2 fill-cyan-300 text-cyan-300" />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </Link>

      {/* Info footer with guaranteed 2-Line Titles & clean dates */}
      <div className="mt-2 sm:mt-2.5 flex items-start justify-between gap-1.5 sm:gap-2">
        <Link href={href} className="flex-1 min-w-0">
          <div className="min-h-[2.6rem] sm:min-h-[2.85rem] flex items-start">
            <p
              title={cleanTitle}
              className="line-clamp-2 text-xs sm:text-[13.5px] font-semibold leading-snug text-white/90 transition-colors group-hover:text-cyan-300"
            >
              {cleanTitle}
            </p>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-white/50">
            {originalYear && (
              <span>{originalYear}</span>
            )}
            {item.studios && item.studios.length > 0 && (
              <>
                {originalYear && <span className="text-white/20">·</span>}
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{formatStudioLabel(item.studios[0])}</span>
              </>
            )}
            {item.sourcesCount && item.sourcesCount > 0 && (
              <>
                <span className="text-white/20 hidden xs:inline">·</span>
                <span className="text-cyan-400 font-medium hidden xs:inline">{item.sourcesCount} Mirrors</span>
              </>
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
          className="flex h-8 w-8 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 active:scale-90 text-white/70 hover:text-white transition-all mt-0.5"
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
