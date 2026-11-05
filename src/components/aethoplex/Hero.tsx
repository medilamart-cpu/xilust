"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { type CardModel } from "./PosterCard";
import { extractCleanTitleAndDate } from "@/lib/video-utils";
import { GeneratedArt } from "./GeneratedArt";
import { ThemedTitle, ThemedThemeBadge } from "./ThemedTitle";

const heroCache = new Map<string, CardModel[]>();

// High-speed, unblocked studio 720p preview clip fallback (Aylo / Project1 Content)
const DEFAULT_PREVIEW_MP4 =
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

    // For Lust feature the top trending leaderboards; for JAX feature newest releases
    const heroTab = "trending";
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
    // High-resolution reliable fallback so background video preview is always playing
    return DEFAULT_PREVIEW_MP4;
  };

  const previewVideoUrl = resolvePreviewVideoUrl();

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
        className="relative min-h-[360px] sm:min-h-[460px] md:min-h-[500px] lg:min-h-[540px] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0a0d14] shadow-2xl"
      >
        {/* The whole featured artwork opens its title; controls stay above this link. */}
        <Link
          href={titleHref}
          aria-label={`Open ${cur?.name || "Featured video"}`}
          className="absolute inset-0 z-0 rounded-2xl sm:rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
        >
          {imgSrc && !imgError ? (
            <>
              {!imageLoaded && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[#0a0d14] pointer-events-none transition-opacity duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                </div>
              )}
              {/* Dual-layer Ambient Backdrop */}
              <img
                src={imgSrc}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover blur-3xl opacity-40 scale-110 pointer-events-none"
              />
              {/* Crisp Foreground Master Image with right-weighted positioning */}
              <img
                ref={(img) => {
                  if (img && img.complete && img.naturalWidth > 0 && !imageLoaded) {
                    setImageLoaded(true);
                  }
                }}
                src={imgSrc}
                alt=""
                onLoad={() => setImageLoaded(true)}
                onError={handleHeroImgError}
                className="absolute inset-0 h-full w-full rounded-2xl sm:rounded-3xl object-cover object-[center_20%] sm:object-[right_center] transition-[opacity,transform,filter] duration-700 brightness-100 opacity-100"
              />

              {/* Seamless Auto-Playing Background Video Preview (Aethoflix / Netflix style) */}
              {previewVideoUrl && !videoError && (
                <video
                  ref={videoRef}
                  key={previewVideoUrl}
                  src={previewVideoUrl}
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
                />
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
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-48 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/80 to-transparent z-[1]"
        />

        {/* Content Box */}
        <div className="pointer-events-none relative z-[2] flex min-h-[360px] sm:min-h-[460px] md:min-h-[500px] lg:min-h-[540px] max-w-xl sm:max-w-2xl flex-col justify-end p-4 pb-14 sm:p-8 sm:pb-16 md:p-10 md:pb-16">
          {/* Eyebrow badge row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-wider text-pink-300 backdrop-blur-md uppercase">
              <Sparkles className="h-3 w-3 text-pink-400" />
              {section === "lust" ? `TRENDING #${safeIdx + 1}` : `FEATURED IN ${section.toUpperCase()}`}
            </span>

            {/* Bespoke Cinematic Theme Badge */}
            <ThemedThemeBadge
              title={heroHeadline}
              studio={studioName}
              section={cur?.section || section}
              code={cur?.code}
            />

            {studioName && (
              <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-semibold tracking-wider text-zinc-200 uppercase backdrop-blur-md">
                {studioName}
              </span>
            )}

            {section !== "fans" && cur?.code && (
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-black tracking-widest text-cyan-300 backdrop-blur-md">
                {cur.code}
              </span>
            )}

            {/* Live Video Preview Active Indicator */}
            {previewVideoUrl && videoReady && !videoError && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider text-emerald-300 backdrop-blur-md uppercase shadow-[0_0_12px_rgba(52,211,153,0.35)]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Live Preview
              </span>
            )}
          </div>

          {/* Bespoke Themed Typography with Distinct Fonts & Eyebrow Patterns */}
          <div className="mb-2 sm:mb-3 drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
            <ThemedTitle
              title={heroHeadline}
              studio={studioName}
              section={cur?.section || section}
              code={cur?.code}
              size="hero"
            />
          </div>

          {/* Starring Cast Subline */}
          {heroCast && (
            <p className="line-clamp-1 text-xs sm:text-sm font-medium text-pink-300/90 mb-2 sm:mb-3">
              <span className="text-zinc-400 text-xs font-normal">Starring: </span>
              {heroCast}
            </p>
          )}
        </div>

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

        {/* Simple, touch-friendly slide dots; swiping remains available on touch screens. */}
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
                  <span
                    aria-hidden="true"
                    className={`h-1.5 rounded-full transition-all ${
                      idx === i
                        ? "w-4 bg-gradient-to-r from-cyan-300 to-violet-300 shadow-[0_0_10px_rgba(103,232,249,0.55)]"
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
