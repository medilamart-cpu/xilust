"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CardModel } from "./PosterCard";
import { GeneratedArt } from "./GeneratedArt";

export function Hero({ section }: { section: "lust" | "jax" }) {
  const [slides, setSlides] = useState<CardModel[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/catalog?section=${section}&tab=top&limit=6`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setSlides(data.items || []);
        setIdx(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      alive = false;
    };
  }, [section]);

  const count = Math.max(slides.length, 1);

  const go = useCallback(
    (n: number) => setIdx(((n % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((v) => (v + 1) % count), 6500);
    return () => clearInterval(t);
  }, [count, slides.length]);

  if (loading || slides.length === 0) {
    return (
      <div className="relative mx-auto mt-2 h-[420px] max-w-7xl animate-pulse rounded-3xl bg-white/[0.03] border border-white/5" />
    );
  }

  const cur = slides[idx];
  const href = `/title/${cur.section || section}/${encodeURIComponent(cur.slug || String(cur.id))}`;

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative h-[440px] sm:h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d14] shadow-2xl">
        {/* Background Artwork */}
        {cur.backdropUrl ? (
          <img
            src={cur.backdropUrl}
            alt={cur.name}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-700 brightness-[0.7] filter"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full">
            <GeneratedArt name={cur.name} kind={cur.kind} wide />
          </div>
        )}

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0f] via-[#080a0f]/70 to-transparent" />

        {/* Content Box */}
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-10 md:p-14 max-w-3xl">
          {/* Eyebrow badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 px-3 py-1 text-[11px] font-bold tracking-wider text-pink-300 backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              FEATURED IN {section.toUpperCase()}
            </span>

            {cur.code && (
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-3 py-1 text-[11px] font-black tracking-widest text-cyan-300 backdrop-blur-md">
                {cur.code}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight line-clamp-2 drop-shadow-md">
            {cur.name}
          </h1>

          {/* Meta Line */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/70">
            <span className="flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-cyan-300 font-semibold border border-white/10">
              <Star className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
              {cur.rating.toFixed(1)}
            </span>
            <span>{cur.year || "2026"}</span>
            <span className="text-white/30">•</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase">1080p HD</span>
            {cur.actors && cur.actors.length > 0 && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-pink-300 font-medium">✨ {cur.actors.slice(0, 2).join(", ")}</span>
              </>
            )}
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex items-center gap-4">
            <Link
              href={href}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-6 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
            >
              <Play className="h-4 w-4 fill-black" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={href}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all"
            >
              <Info className="h-4 w-4" />
              <span>Details & Mirrors</span>
            </Link>
          </div>
        </div>

        {/* Carousel controls */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 flex items-center gap-2">
            <button
              onClick={() => go(idx - 1)}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i ? "w-6 bg-cyan-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(idx + 1)}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
