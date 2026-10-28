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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setLoading(true);
    setSlides([]); // Reset immediately on section switch so previous section slides don't flash
    setImgError(false);

    fetch(`/api/catalog?section=${section}&tab=top&limit=6`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!alive || controller.signal.aborted) return;
        // Verify response matches current section
        if (data.section && data.section !== section) return;
        setSlides(data.items || []);
        setIdx(0);
        setImgError(false);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [section]);

  const count = Math.max(slides.length, 1);

  const go = useCallback(
    (n: number) => {
      setImgError(false);
      setIdx(((n % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setImgError(false);
      setIdx((v) => (v + 1) % count);
    }, 6500);
    return () => clearInterval(t);
  }, [count, slides.length]);

  if (loading || slides.length === 0) {
    return (
      <div className="relative mx-auto mt-2 h-[360px] sm:h-[420px] max-w-7xl animate-pulse rounded-3xl bg-white/[0.03] border border-white/5" />
    );
  }

  const cur = slides[idx];
  const href = `/title/${cur.section || section}/${encodeURIComponent(cur.slug || String(cur.id))}`;
  const isJax = (cur.section || section) === "jax";
  const uploadDate = cur.uploadedAt && !Number.isNaN(Date.parse(cur.uploadedAt))
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(cur.uploadedAt))
    : null;

  // Mobile touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 45) {
      // swipe left -> next
      go(idx + 1);
    } else if (diff < -45) {
      // swipe right -> prev
      go(idx - 1);
    }
    setTouchStart(null);
  };

  return (
    <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative min-h-[340px] sm:min-h-[460px] ${isJax ? "h-[360px] sm:h-[480px]" : "h-auto"} overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0a0d14] shadow-2xl`}
      >
        {/* Background Artwork - mobile optimized object-top and vivid brightness */}
        {cur.backdropUrl && !imgError ? (
          <img
            src={cur.backdropUrl}
            alt={cur.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover object-top sm:object-center transition-all duration-700 brightness-95 sm:brightness-[0.75] filter"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full">
            <GeneratedArt name={cur.name} kind={cur.kind} wide />
          </div>
        )}

        {/* Cinematic Gradient Overlays: lightened on mobile so cover thumbnail is clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/45 sm:via-[#080a0f]/60 to-transparent" />
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#080a0f] via-[#080a0f]/70 to-transparent" />

        {/* Content Box */}
        <div className="relative flex min-h-[340px] sm:min-h-[460px] flex-col justify-end p-4 sm:p-10 md:p-14 max-w-3xl">
          {/* Eyebrow badge */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-wider text-pink-300 backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              FEATURED IN {section.toUpperCase()}
            </span>

            {cur.code && (
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-black tracking-widest text-cyan-300 backdrop-blur-md">
                {cur.code}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className={`${isJax ? "line-clamp-2" : "break-words"} text-xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-md`}>
            {cur.name}
          </h1>

          {/* Meta Line */}
          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/70">
            <span className="flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-cyan-300 font-semibold border border-white/10">
              <Star className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
              {cur.rating.toFixed(1)}
            </span>
            <span>{cur.year || "2026"}</span>
            {uploadDate && <span>Uploaded {uploadDate}</span>}
            <span className="text-white/30">•</span>
            <span className="rounded bg-white/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase">1080p HD</span>
            {cur.actors && cur.actors.length > 0 && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-pink-300 font-medium truncate max-w-[160px] sm:max-w-none">
                  ✨ {cur.actors.slice(0, 2).join(", ")}
                </span>
              </>
            )}
          </div>

          {/* Action CTAs */}
          <div className="mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-4">
            <Link
              href={href}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-black shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-95 sm:hover:scale-105"
            >
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-black" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={href}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all active:scale-95"
            >
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Details</span>
            </Link>
          </div>
        </div>

        {/* Carousel controls: Top Right on mobile, Bottom Right on desktop */}
        {slides.length > 1 && (
          <div className="absolute top-4 right-4 sm:top-auto sm:bottom-10 sm:right-10 flex items-center gap-1.5 sm:gap-2 z-10">
            <button
              onClick={() => go(idx - 1)}
              aria-label="Previous slide"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/50 border border-white/15 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all active:scale-90"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="flex items-center gap-1 sm:gap-1.5 px-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i ? "w-4 sm:w-6 bg-cyan-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(idx + 1)}
              aria-label="Next slide"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/50 border border-white/15 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all active:scale-90"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
