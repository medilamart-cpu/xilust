"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Star, Sparkles } from "lucide-react";
import type { CardModel } from "./PosterCard";
import { GeneratedArt } from "./GeneratedArt";

export function Hero({ section }: { section: "lust" | "jax" }) {
  const [slides, setSlides] = useState<CardModel[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

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

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) setCarouselPaused(true);
    const handleMotionPreference = (event: MediaQueryListEvent) => {
      if (event.matches) setCarouselPaused(true);
    };
    reducedMotion.addEventListener("change", handleMotionPreference);
    return () => reducedMotion.removeEventListener("change", handleMotionPreference);
  }, []);

  const count = Math.max(slides.length, 1);
  const cur = slides[idx];

  useEffect(() => {
    if (!cur) {
      setImgSrc(null);
      setImgError(false);
      setImageLoaded(false);
      return;
    }

    setImgSrc(cur.backdropUrl ?? cur.posterUrl ?? cur.fallbackUrl ?? null);
    setImgError(false);
    setImageLoaded(false);
  }, [cur?.id, cur?.key, cur?.backdropUrl, cur?.posterUrl, cur?.fallbackUrl]);

  const go = useCallback(
    (n: number) => {
      setImgError(false);
      setImageLoaded(false);
      setIdx(((n % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (slides.length <= 1 || carouselPaused) return;
    const t = setInterval(() => {
      setImgError(false);
      setImageLoaded(false);
      setIdx((v) => (v + 1) % count);
    }, 6500);
    return () => clearInterval(t);
  }, [count, slides.length, carouselPaused]);

  useEffect(() => {
    setImageLoaded(false);
  }, [slides[idx]?.backdropUrl]);

  if (loading || slides.length === 0) {
    return (
      <div className="relative mx-auto mt-2 h-[360px] sm:h-[420px] max-w-7xl animate-pulse rounded-3xl bg-white/[0.03] border border-white/5" />
    );
  }

  const handleHeroImgError = () => {
    if (imgSrc && imgSrc !== cur?.fallbackUrl && cur?.fallbackUrl) {
      setImgSrc(cur.fallbackUrl);
    } else {
      setImageLoaded(false);
      setImgError(true);
    }
  };

  const isJax = (cur?.section || section) === "jax";
  const uploadDate = cur?.uploadedAt && !Number.isNaN(Date.parse(cur.uploadedAt))
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

  if (!cur) return null;

  return (
    <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative min-h-[340px] sm:min-h-[460px] ${isJax ? "h-[360px] sm:h-[480px]" : "h-auto"} overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0a0d14] shadow-2xl`}
      >
        {/* Background Artwork - mobile optimized object-top and vivid brightness */}
        {imgSrc && !imgError ? (
          <>
            {!imageLoaded && (
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-violet-950/70 via-slate-900 to-[#0a0d14] animate-pulse motion-reduce:animate-none">
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
              </div>
            )}
            <img
              src={imgSrc}
              alt={cur.name}
              onLoad={() => setImageLoaded(true)}
              onError={handleHeroImgError}
              className={`absolute inset-0 h-full w-full object-cover object-top sm:object-center transition-[opacity,transform,filter] duration-700 brightness-100 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 h-full w-full">
            <GeneratedArt name={cur.name} kind={cur.kind} wide />
          </div>
        )}

        {/* Cinematic Gradient Overlays: lightened on mobile so cover thumbnail is clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f]/95 via-[#080a0f]/25 sm:via-[#080a0f]/40 to-transparent" />
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#080a0f]/50 via-[#080a0f]/35 to-transparent" />

        {/* Content Box */}
        <div className="relative flex min-h-[340px] sm:min-h-[460px] flex-col justify-end p-4 sm:p-8 md:p-10 max-w-2xl">
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
          <h1 className="line-clamp-2 break-words text-lg sm:text-3xl md:text-4xl font-black leading-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
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

        </div>

        {/* Carousel controls: Top Right on mobile, Bottom Right on desktop */}
        {slides.length > 1 && (
          <div className="absolute top-4 right-4 sm:top-auto sm:bottom-10 sm:right-10 flex items-center gap-1.5 sm:gap-2 z-10">
            <button
              type="button"
              onClick={() => go(idx - 1)}
              aria-label="Previous slide"
              className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/85 shadow-lg backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2 py-1 sm:flex sm:gap-1.5 sm:px-2.5 sm:py-1.5" role="group" aria-label="Featured slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show featured slide ${i + 1}`}
                  aria-current={idx === i ? "true" : undefined}
                  className="group flex h-8 w-5 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:w-6"
                >
                  <span className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-gradient-to-r from-cyan-300 to-violet-300 shadow-[0_0_10px_rgba(103,232,249,0.55)]" : "w-2.5 bg-white/30 group-hover:bg-white/65"}`} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCarouselPaused((paused) => !paused)}
              aria-label={carouselPaused ? "Resume featured carousel" : "Pause featured carousel"}
              aria-pressed={carouselPaused}
              title={carouselPaused ? "Resume featured carousel" : "Pause featured carousel"}
              className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/85 shadow-lg backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 active:scale-95"
            >
              {carouselPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => go(idx + 1)}
              aria-label="Next slide"
              className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/85 shadow-lg backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 active:scale-95"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
