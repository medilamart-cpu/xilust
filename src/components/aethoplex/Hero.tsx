"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX, Play, Plus, Check, Info, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { useMyList, type CardModel } from "./PosterCard";
import { extractCleanTitleAndDate } from "@/lib/video-utils";
import { GeneratedArt } from "./GeneratedArt";
import { ThemedTitle, ThemedThemeBadge } from "./ThemedTitle";
import { SPRING_SNAPPY, SPRING_BOUNCY, EASE_DECEL } from "@/lib/motion";

const heroCache = new Map<string, CardModel[]>();

// High-speed, unblocked studio 720p preview clip fallback (Aylo / Project1 Content)
  "https://prog-public-ht.project1content.com/862/821/ad6/e48/4ec/da2/c3c/53b/13a/5e0/51/mediabook/mediabook_720p.mp4";

export function Hero({ section }: { section: "lust" | "jax" | "fans" }) {
  const [slides, setSlides] = useState<CardModel[]>(() => heroCache.get(section) || []);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(() => !heroCache.has(section));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Background Video Preview State (Aethoflix / Netflix style)
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const cached = heroCache.get(section);
    if (cached && cached.length > 0) {
      setSlides(cached);
      setLoading(false);
    } else {
      setLoading(true);
      setSlides([]); // Reset immediately on section switch so previous section slides don't flash
    }
    setImgError(false);

    // Feature newest releases across all sections by default
    const heroTab = "new";
    fetch(`/api/catalog?section=${section}&tab=${heroTab}&limit=10`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!alive || controller.signal.aborted) return;
        // Verify response matches current section
        if (data.section && data.section !== section) return;
        const items = data.items || [];
        heroCache.set(section, items);
        setSlides(items);
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

  useEffect(() => {
    setIdx(0);
  }, [section]);

  const count = Math.max(slides.length, 1);
  const safeIdx = slides.length > 0 ? ((idx % slides.length) + slides.length) % slides.length : 0;
  const cur = slides[safeIdx];
  const { has, toggle } = useMyList();
  const inList = cur ? has(cur.key ?? `${cur.section}-${cur.id}`) : false;

  const vpsBase = process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org";
  const resolveHeroThumb = () => {
    if (!cur) return null;
    return (
      cur.backdropUrl ||
      cur.posterUrl ||
      cur.fallbackUrl ||
      ((cur as any).thumbnail_url
        ? ((cur as any).thumbnail_url.startsWith("http")
          ? (cur as any).thumbnail_url
          : `${vpsBase}/${(cur as any).thumbnail_url.replace(/^\/+/, "")}`)
        : null) ||
      (cur as any).cover_url ||
      null
    );
  };

  // Video preview resolution (card previewVideoUrl -> preview_url -> video_sources -> studio CDN fallback)
  const resolvePreviewVideoUrl = (): string | null => {
    if (!cur) return null;
    if (cur.previewVideoUrl && cur.previewVideoUrl.startsWith("http")) {
      return cur.previewVideoUrl;
    }
    if ((cur as any).preview_url && (cur as any).preview_url.startsWith("http")) {
      return (cur as any).preview_url;
    }
    const sources = (cur as any).video_sources;
    if (Array.isArray(sources)) {
      const mp4 = sources.find(
        (s: any) =>
          s.url &&
          (s.url.endsWith(".mp4") ||
            s.url.includes("mediabook") ||
            s.url.includes("trailer") ||
            s.url.includes("preview"))
      );
      if (mp4?.url) return mp4.url;
    }
    return null;
  };

  const previewVideoUrl = resolvePreviewVideoUrl();

  // Mobile preview optimization (e.g. Naughty America _mobile10sec.mp4 under 720px)
  const resolvePreviewMobileUrl = (desktopUrl: string | null): string | null => {
    if (!desktopUrl) return null;
    if ((cur as any)?.preview_mobile_url && (cur as any).preview_mobile_url.startsWith("http")) {
      return (cur as any).preview_mobile_url;
    }
    if (desktopUrl.includes("_desktop10sec.mp4")) {
      return desktopUrl.replace("_desktop10sec.mp4", "_mobile10sec.mp4");
    }
    return null;
  };

  const previewMobileUrl = resolvePreviewMobileUrl(previewVideoUrl);

  useEffect(() => {
    if (!cur) {
      setImgSrc(null);
      setImgError(false);
      setImageLoaded(false);
      setVideoReady(false);
      setVideoError(false);
      return;
    }

    setImgSrc(resolveHeroThumb());
    setImgError(false);
    setImageLoaded(false);
    setVideoReady(false);
    setVideoError(false);
  }, [
    cur?.id,
    cur?.key,
    cur?.backdropUrl,
    cur?.posterUrl,
    cur?.fallbackUrl,
    (cur as any)?.thumbnail_url,
    (cur as any)?.cover_url,
    previewVideoUrl,
  ]);

  // Robust Auto-Play Effect (Guarantees playback starts automatically in modern browsers)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !previewVideoUrl || carouselPaused) return;

    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setVideoReady(true);
        })
        .catch(() => {
          // If browser policy blocked unmuted playback, force muted and retry immediately
          if (video) {
            video.muted = true;
            video
              .play()
              .then(() => setVideoReady(true))
              .catch(() => {});
          }
        });
    }
  }, [previewVideoUrl, safeIdx, isMuted, carouselPaused]);

  const go = useCallback(
    (n: number) => {
      setImgError(false);
      setImageLoaded(false);
      setVideoReady(false);
      setVideoError(false);
      setIdx(((n % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (slides.length <= 1 || carouselPaused) return;
    const t = setInterval(() => {
      setImgError(false);
      setImageLoaded(false);
      setVideoReady(false);
      setVideoError(false);
      setIdx((v) => (v + 1) % count);
    }, 9000); // 9-second showcase window for full appreciation of the video preview
    return () => clearInterval(t);
  }, [count, slides.length, carouselPaused]);

  useEffect(() => {
    setImageLoaded(false);
  }, [slides[idx]?.backdropUrl]);

  // Keep video muted prop synced
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (loading || slides.length === 0 || !cur) {
    return (
      <div className="relative mx-auto mt-2 h-[360px] sm:h-[420px] max-w-7xl animate-pulse rounded-3xl bg-white/[0.03] border border-white/5" />
    );
  }

  const fallbackHeroThumb = cur?.fallbackUrl || (cur as any)?.cover_url || null;

  const handleHeroImgError = () => {
    if (imgSrc && imgSrc !== fallbackHeroThumb && fallbackHeroThumb) {
      setImgSrc(fallbackHeroThumb);
    } else if (cur?.slug && imgSrc && !imgSrc.endsWith(`/${cur.slug}.webp`)) {
      setImgSrc(`https://xithumbs.duckdns.org/${cur.slug}.webp`);
    } else {
      setImageLoaded(false);
      setImgError(true);
    }
  };

  const rawHeroName = cur?.name || (cur as any)?.title || "";
  const { cleanTitle } = extractCleanTitleAndDate(rawHeroName, cur?.year, cur?.section || section);
  const titleHref = `/title/${cur?.section || section}/${encodeURIComponent(
    cur?.slug || String(cur?.id || cur?.key || "")
  )}`;

  // Smart title extraction for Studio / Performer (Scene Title) structure
  const sceneMatch = rawHeroName.match(/\((.*?)(?:\s*\/\s*\d{2}\.\d{2}\.\d{4})?\)/);
  const studioMatch = rawHeroName.match(/^\[([^\]]+)\]/);
  const studioName = studioMatch ? studioMatch[1].trim() : cur?.studios?.[0] || null;

  let heroHeadline = cleanTitle;
  let heroCast: string | null = null;

  if (sceneMatch && sceneMatch[1]) {
    const rawScene = sceneMatch[1].replace(/^["']|["']$/g, "").trim();
    if (rawScene.length > 2) {
      heroHeadline = rawScene;
      const performerPrefix = rawHeroName.replace(/^\[[^\]]+\]\s*/, "").split("(")[0].trim();
      if (performerPrefix && performerPrefix !== rawScene) {
        heroCast = performerPrefix;
      }
    }
  }

  if (
    !heroCast &&
    (cur as any)?.actors &&
    Array.isArray((cur as any).actors) &&
    (cur as any).actors.length > 0
  ) {
    heroCast = (cur as any).actors.join(" • ");
  }

  // Mobile touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 45) {
      go(idx + 1);
    } else if (diff < -45) {
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
        className="group/hero relative min-h-[380px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0a0d14] shadow-2xl"
      >
        {/* The whole featured artwork opens its title; controls stay above this link. */}
        <Link
          href={titleHref}
          aria-label={`Open ${cur?.name || "Featured video"}`}
          className="absolute inset-0 z-0 rounded-2xl sm:rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
        >
          {imgSrc && !imgError ? (
            <>
              {/* Dual-layer Ambient Backdrop for cinema glow */}
              <img
                src={imgSrc}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover blur-3xl opacity-35 scale-125 pointer-events-none"
              />
              {/* Crisp Foreground Master Image with right-weighted positioning */}
              <motion.img
                key={imgSrc || safeIdx}
                src={imgSrc || undefined}
                alt=""
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE_DECEL }}
                onError={handleHeroImgError}
                className="absolute inset-0 h-full w-full rounded-2xl sm:rounded-3xl object-cover object-[center_20%] sm:object-[right_center] will-change-transform brightness-100"
              />

              {/* Seamless Auto-Playing Background Video Preview (Aethoflix / Netflix style) */}
              {previewVideoUrl && !videoError && (
                <video
                  ref={videoRef}
                  key={previewVideoUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  onLoadedData={() => {
                    setVideoReady(true);
                    videoRef.current?.play().catch(() => {});
                  }}
                  onCanPlay={() => {
                    setVideoReady(true);
                    videoRef.current?.play().catch(() => {});
                  }}
                  onError={() => setVideoError(true)}
                  className={`pointer-events-none absolute inset-0 h-full w-full rounded-2xl sm:rounded-3xl object-cover object-[center_20%] sm:object-[right_center] transition-opacity duration-1000 ${
                    videoReady ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {previewMobileUrl && (
                    <source src={previewMobileUrl} media="(max-width: 719px)" type="video/mp4" />
                  )}
                  <source src={previewVideoUrl} type="video/mp4" />
                </video>
              )}
            </>
          ) : (
            <div className="absolute inset-0 h-full w-full">
              <GeneratedArt name={cur?.name || ""} kind={cur?.kind || "FILM"} wide />
            </div>
          )}
        </Link>

        {/* Dual-Scrim Cinematic Gradients (Netflix / Apple TV+ style) */}
        {/* Left-to-Right Scrim: Covers text area on left while leaving right video/thumbnail 100% visible */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080a0f] via-[#080a0f]/90 via-42% to-transparent w-full sm:w-[65%] z-[1]"
        />
        {/* Bottom-to-Top Fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 sm:h-52 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/80 to-transparent z-[1]"
        />

        {/* Content Box with 4-Tier Cinema Choreography */}
        <div
          key={safeIdx}
          className="pointer-events-none relative z-[2] flex min-h-[380px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] max-w-xl sm:max-w-2xl flex-col justify-end p-4 pb-16 sm:p-8 sm:pb-20 md:p-10 md:pb-20"
        >
          {/* Tier 1: Badges & Metadata (0ms delay) */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_DECEL }}
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5"
          >
            {/* Rank Ribbon Badge */}
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500/25 to-amber-500/20 border border-rose-500/40 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-wider text-rose-200 backdrop-blur-md uppercase shadow-[0_0_12px_rgba(244,63,94,0.2)]">
              <Flame className="h-3 w-3 text-rose-400 fill-rose-400/40" />
              {section === "lust" ? `TRENDING #${safeIdx + 1}` : `TOP FEATURED #${safeIdx + 1}`}
            </span>

            {/* Colourful Studio Themed Badge */}
            <ThemedThemeBadge
              title={heroHeadline}
              studio={studioName}
              section={cur?.section || section}
              code={cur?.code}
            />

            {section !== "fans" && cur?.code && (
              <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-cyan-300 backdrop-blur-md">
                {cur.code}
              </span>
            )}

            {/* Video Preview Active Indicator */}
            {previewVideoUrl && videoReady && !videoError && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider text-emerald-300 backdrop-blur-md uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Preview
              </span>
            )}
          </motion.div>

          {/* Tier 2: Pure Cinema Headline (60ms delay) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.06, ease: EASE_DECEL }}
            className="mb-2 sm:mb-2.5"
          >
            <ThemedTitle
              title={heroHeadline}
              studio={studioName}
              section={cur?.section || section}
              code={cur?.code}
              size="hero"
            />
          </motion.div>

          {/* Tier 2.5: Metadata Line (Rating, Year, Quality, Duration) */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.09, ease: EASE_DECEL }}
            className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-zinc-300 mb-2 sm:mb-2.5"
          >
            <span className="font-bold text-emerald-400">98% Match</span>
            <span className="text-zinc-600">•</span>
            <span>{cur?.year || 2026}</span>
            <span className="text-zinc-600">•</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white border border-white/15">
              4K ULTRA HD
            </span>
            {cur?.durationSeconds && (
              <>
                <span className="text-zinc-600">•</span>
                <span>{Math.floor(cur.durationSeconds / 60)}m</span>
              </>
            )}
          </motion.div>

          {/* Tier 3: Starring Cast Subline (120ms delay) */}
          {heroCast && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.12, ease: EASE_DECEL }}
              className="line-clamp-1 text-xs sm:text-sm font-medium text-zinc-300 mb-3 sm:mb-4"
            >
              <span className="text-zinc-500 text-xs font-normal">Starring: </span>
              {heroCast}
            </motion.p>
          )}

          {/* Tier 4: Primary Action CTA Deck */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.15, ease: EASE_DECEL }}
            className="pointer-events-auto flex flex-wrap items-center gap-2.5 sm:gap-3"
          >
            <Link
              href={titleHref}
              className="group inline-flex items-center gap-2 rounded-xl sm:rounded-2xl bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-[#090b10] shadow-[0_0_20px_rgba(255,255,255,0.25)] transition hover:bg-white/90 hover:scale-[1.02] active:scale-95"
            >
              <Play className="h-4 w-4 fill-current transition group-hover:scale-110" />
              <span>Watch Now</span>
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(cur);
              }}
              className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl border border-white/20 bg-white/10 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 hover:border-white/30 active:scale-95"
            >
              <motion.span
                key={inList ? "in-list" : "not-in-list"}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={SPRING_BOUNCY}
              >
                {inList ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
              </motion.span>
              <span>{inList ? "In My List" : "My List"}</span>
            </button>

            <Link
              href={titleHref}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white/70 backdrop-blur-md transition hover:bg-white/10 hover:text-white active:scale-95"
            >
              <Info className="h-4 w-4 text-white/60" />
              <span>Details</span>
            </Link>
          </motion.div>
        </div>

        {/* Next Trending Mini-Rail (Desktop) */}
        {slides.length > 2 && (
          <div className="hidden xl:flex absolute bottom-4 right-8 z-20 items-center gap-2 pointer-events-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 mr-1">
              Up Next:
            </span>
            {[1, 2].map((offset) => {
              const nextSlideIdx = (safeIdx + offset) % slides.length;
              const nextSlide = slides[nextSlideIdx];
              if (!nextSlide) return null;
              const nextTitle = extractCleanTitleAndDate(nextSlide.name || "", nextSlide.year, nextSlide.section).cleanTitle;
              return (
                <button
                  key={nextSlideIdx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go(nextSlideIdx);
                  }}
                  className="group flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-left backdrop-blur-md transition hover:bg-white/15 hover:border-white/30 active:scale-95"
                >
                  <span className="text-[10px] font-extrabold text-rose-400">#{nextSlideIdx + 1}</span>
                  <span className="max-w-[130px] truncate text-[11px] font-semibold text-white/85 group-hover:text-white">
                    {nextTitle}
                  </span>
                  <ChevronRight className="h-3 w-3 text-white/40 group-hover:text-white" />
                </button>
              );
            })}
          </div>
        )}

        {/* Ambient Video Sound Control (Volume Mute / Unmute) */}
        {previewVideoUrl && videoReady && !videoError && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            aria-label={isMuted ? "Unmute video preview audio" : "Mute video preview audio"}
            className="absolute bottom-3 right-3 sm:bottom-5 sm:right-6 z-20 flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all shadow-2xl hover:scale-105 active:scale-95"
          >
            {isMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-white/80" />
                <span className="hidden sm:inline text-[11px] text-white/90">Preview Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline text-[11px] text-cyan-300 font-semibold">Sound On</span>
              </>
            )}
          </button>
        )}

        {/* Subtle Desktop Side Navigation Arrows (Hover) */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(safeIdx - 1);
              }}
              aria-label="Previous trending slide"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white/70 hover:text-white backdrop-blur-md transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(safeIdx + 1);
              }}
              aria-label="Next trending slide"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white/70 hover:text-white backdrop-blur-md transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Simple, touch-friendly slide dots with spring layout animation */}
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 sm:bottom-3">
            <div className="flex items-center" role="group" aria-label="Featured slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show featured slide ${i + 1}`}
                  aria-current={idx === i ? "true" : undefined}
                  className="group flex h-11 w-8 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <motion.span
                    layout
                    transition={SPRING_SNAPPY}
                    aria-hidden="true"
                    className={`h-1.5 rounded-full ${
                      idx === i
                        ? "w-5 bg-gradient-to-r from-cyan-300 to-violet-300 shadow-[0_0_10px_rgba(103,232,249,0.55)]"
                        : "w-1.5 bg-white/45 group-hover:bg-white/75"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
