"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Server, Play, ShieldCheck, RefreshCw, ExternalLink, AlertTriangle, Maximize2, Sparkles, Activity, X, CheckCircle2, Clock, ListVideo, SkipBack, SkipForward, Shuffle, Star, ChevronRight, Check, Film } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog-db";
import { AddToPlaylistModal } from "@/components/aethoplex/AddToPlaylistModal";
import { Playlist, getPlaylistById, ratePlaylist, getUserPlaylistRating } from "@/lib/playlists";

function toDirectEmbedUrl(url: string): string {
  if (!url) return "";
  const clean = url.trim();

  // Streamtape: rewrite domain to streamta.pe and ensure /e/ embed URL to bypass ISP DNS sinkholes
  const stMatch = clean.match(/(?:streamtape\.(?:com|net)|streamta\.pe|strtape\.tech|strcloud\.link|advtpe\.com)\/(?:v|e)\/([A-Za-z0-9_-]+)/i);
  if (stMatch) {
    return `https://streamta.pe/e/${stMatch[1]}`;
  }

  // Mixdrop: /f/ID -> /e/ID
  if (/(?:mixdrop|mxdrop|mixdrp|miiixdrop)\.[a-z0-9]+\/f\/([A-Za-z0-9_-]+)/i.test(clean)) {
    return clean.replace(/\/f\//i, "/e/");
  }

  // Kamehamehaa: /v/ID -> /embed/ID
  if (/kamehamehaa\.xyz\/v\/([A-Za-z0-9_-]+)/i.test(clean)) {
    return clean.replace(/\/v\//i, "/embed/");
  }

  // Kamehaus: /v/ID -> /e/ID
  if (/kamehaus\.net\/v\/([A-Za-z0-9_-]+)/i.test(clean)) {
    return clean.replace(/\/v\//i, "/e/");
  }

  // StreamSB (sbthe, streamsb, tubesb, sbcloud): /d/ or /v/ -> /e/
  if (/(?:sbthe|streamsb|tubesb|sbcloud|sbembed|cloudemb)\.[a-z0-9]+\/(?:d|v)\/([A-Za-z0-9_.-]+)/i.test(clean)) {
    return clean.replace(/\/(?:d|v)\//i, "/e/");
  }

  // Filemoon: /d/ID -> /e/ID
  if (/filemoon\.[a-z0-9]+\/d\/([A-Za-z0-9_-]+)/i.test(clean)) {
    return clean.replace(/\/d\//i, "/e/");
  }

  // VOE: /d/ID -> /e/ID
  if (/(?:voe\.sx|jamespatterncamera\.com)\/d\/([A-Za-z0-9_-]+)/i.test(clean)) {
    return clean.replace(/\/d\//i, "/e/");
  }

  // Doodstream / Playmogo: /d/ID -> /e/ID
  if (/(?:dood|playmogo|ds2play|d000d|do0od)\.[a-z0-9]+\/d\/([A-Za-z0-9_-]+)/i.test(clean)) {
    return clean.replace(/\/d\//i, "/e/");
  }

  return clean;
}

function isCleanStreamSupported(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  const supportedKeywords = [
    "kamehaus",
    "kamehameha",
    "kame.upns",
    "vidara",
    "sugbaioug",
    "streamtape",
    "streamta.pe",
    "strtape",
    "mixdrop",
    "mxdrop",
    "voe",
    "javlesbians",
    "dood",
    "playmogo",
    "streamhihi",
    "lulu",
    "maxstream",
    "vide0",
    "javclan",
    "jolly",
    "molly",
    "hornyleak",
    "hdplayer"
  ];
  return supportedKeywords.some((k) => lower.includes(k));
}

function serverIdentity(source: { label?: string; host?: string }, section: CatalogItem["section"]) {
  const key = `${source.host || ""} ${source.label || ""}`.toLowerCase();
  const identities = section === "jax"
    ? [
        { match: ["kamehaus", "kamehameha", "kame"], name: "Server 1 (Kamehaus Fast)", quality: "1080p HD" },
        { match: ["vidara", "sugbaioug"], name: "Server 2 (Vidara High Speed)", quality: "1080p HD" },
        { match: ["streamtape", "streamta.pe"], name: "Server 3 (Streamtape)", quality: "720p HD" },
        { match: ["mixdrop", "mxdrop"], name: "Server 4 (Mixdrop)", quality: "720p HD" },
        { match: ["streamhihi", "lulu"], name: "Server 5 (Lulu Stream)", quality: "1080p HD" },
        { match: ["javlesbian", "voe"], name: "Server 6 (VOE Embed)", quality: "1080p HD" },
        { match: ["javclan", "streamsb", "sbthe", "sb"], name: "Server 7 (StreamSB)", quality: "720p" },
        { match: ["filemoon"], name: "Server 8 (Filemoon)", quality: "1080p HD" },
        { match: ["maxstream"], name: "Server 9 (MaxStream)", quality: "1080p HD" },
        { match: ["vid0", "vide0"], name: "Server 10 (Direct Player)", quality: "720p" },
      ]
    : section === "lust"
      ? [
          { match: ["streamtape", "streamta.pe"], name: "Server 1 (Streamtape HD)", quality: "1080p HD" },
          { match: ["mixdrop", "mxdrop", "mixdrp"], name: "Server 2 (Mixdrop Fast)", quality: "720p HD" },
          { match: ["doodstream", "dood", "d000d"], name: "Server 3 (Doodstream)", quality: "720p" },
        ]
      : [];
  return identities.find((identity) => identity.match.some((part) => key.includes(part)));
}

export function TitleWatchClient({
  item,
  cleanstreamUrl,
}: {
  item: CatalogItem;
  cleanstreamUrl: string;
}) {
  const rawSources = item.video_sources || [];

  // Sort sources by highest reliability (KameHaus, Vidara, Streamtape, StreamSB first)
  const sources = useMemo(() => {
    return [...rawSources]
      .filter((s) => {
        const h = (s.host || s.label || "").toLowerCase();
        return !h.includes("listeamed") && !h.includes("parking");
      })
      .sort((a, b) => {
        const hA = (a.host || a.label || "").toLowerCase();
        const hB = (b.host || b.label || "").toLowerCase();

        const priority = (h: string) => {
          if (h.includes("jolly") || h.includes("hdplayer")) return 1;
          if (h.includes("molly") || h.includes("hornyleak")) return 2;
          if (h.includes("kamehaus") || h.includes("kamehameha") || h.includes("kame.upns")) return 3;
          if (h.includes("vidara") || h.includes("sugbaioug")) return 4;
          if (h.includes("streamtape")) return 5;
          if (h.includes("mixdrop")) return 6;
          if (h.includes("javclan") || h.includes("streamsb") || h.includes("sbthe") || h.includes("sb")) return 7;
          if (h.includes("filemoon")) return 8;
          if (h.includes("vide0") || h.includes("dd")) return 9;
          if (h.includes("maxstream") || h.includes("jk")) return 10;
          if (h.includes("streamhihi") || h.includes("lulu")) return 11;
          if (h.includes("javlesbians") || h.includes("voe") || h.includes("vo")) return 12;
          if (h.includes("cherrycams")) return 15;
          if (h.includes("turtleviplay")) return 90; // Cloudflare Turnstile blocked, KameHaus/Vidara preferred
          if (h.includes("dood")) return 99; // Dood often deletes older files
          return 20;
        };

        return priority(hA) - priority(hB);
      });
  }, [rawSources]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [playerMode, setPlayerMode] = useState<"clean" | "direct">("clean");
  const [key, setKey] = useState(0);
  const [playerError, setPlayerError] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [serverHealth, setServerHealth] = useState<{
    cleanstream_online: boolean;
    latency_ms: number;
    servers: Record<string, { name: string; status: string; cleanstream_working: boolean; latency_ms: number; note?: string }>;
    active_count: number;
    total_count: number;
  } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Playlist Mode & Sequential Playback Engine
  const searchParams = useSearchParams();
  const router = useRouter();
  const playlistId = searchParams?.get("playlist");
  const playlistIndexParam = searchParams?.get("index");
  const isShuffleParam = searchParams?.get("shuffle") === "1";

  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [isShuffle, setIsShuffle] = useState(isShuffleParam);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const [userPlRating, setUserPlRating] = useState<number | null>(null);

  useEffect(() => {
    if (playlistId) {
      const pl = getPlaylistById(playlistId);
      setActivePlaylist(pl);
      setUserPlRating(getUserPlaylistRating(playlistId));
    } else {
      setActivePlaylist(null);
    }
  }, [playlistId]);

  const playlistIndex = useMemo(() => {
    if (!activePlaylist || activePlaylist.items.length === 0) return -1;
    const idx = playlistIndexParam ? parseInt(playlistIndexParam, 10) : 0;
    if (isNaN(idx)) return 0;
    return Math.max(0, Math.min(idx, activePlaylist.items.length - 1));
  }, [activePlaylist, playlistIndexParam]);

  const hasNext = activePlaylist ? (isShuffle ? activePlaylist.items.length > 1 : playlistIndex < activePlaylist.items.length - 1) : false;
  const hasPrev = activePlaylist ? playlistIndex > 0 : false;

  const navigateToTrack = (idx: number) => {
    if (!activePlaylist) return;
    const nextVideo = activePlaylist.items[idx];
    if (!nextVideo) return;
    const url = `/title/${nextVideo.section || "lust"}/${nextVideo.slug || nextVideo.id}?playlist=${encodeURIComponent(activePlaylist.id)}&index=${idx}${isShuffle ? "&shuffle=1" : ""}`;
    router.push(url);
  };

  const handleNextTrack = () => {
    if (!activePlaylist) return;
    let nextIdx = playlistIndex + 1;
    if (isShuffle && activePlaylist.items.length > 1) {
      const otherIndices = activePlaylist.items.map((_, i) => i).filter((i) => i !== playlistIndex);
      nextIdx = otherIndices[Math.floor(Math.random() * otherIndices.length)];
    }
    if (nextIdx < activePlaylist.items.length) {
      navigateToTrack(nextIdx);
    }
  };

  const handlePrevTrack = () => {
    if (!activePlaylist || playlistIndex <= 0) return;
    navigateToTrack(playlistIndex - 1);
  };

  const handleRateActivePlaylist = (stars: number) => {
    if (!activePlaylist) return;
    const res = ratePlaylist(activePlaylist.id, stars);
    if (res.success) {
      setUserPlRating(stars);
      setActivePlaylist((prev) => prev ? { ...prev, rating: res.newRating, ratingCount: res.newCount } : null);
    }
  };

  // Listen for video ended events from CleanStream iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && (e.data.type === "CLEANSTREAM_ENDED" || e.data.type === "VIDEO_ENDED")) {
        if (activePlaylist && hasNext && autoAdvance) {
          setAutoAdvanceCountdown(5);
        }
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [activePlaylist, hasNext, autoAdvance]);

  // Countdown timer
  useEffect(() => {
    if (autoAdvanceCountdown === null) return;
    if (autoAdvanceCountdown <= 0) {
      setAutoAdvanceCountdown(null);
      handleNextTrack();
      return;
    }
    const timer = setTimeout(() => {
      setAutoAdvanceCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoAdvanceCountdown]);

  const fetchStatus = () => {
    setHealthLoading(true);
    fetch("/api/cleanstream/status")
      .then((r) => r.json())
      .then((data) => setServerHealth(data))
      .catch(() => {})
      .finally(() => setHealthLoading(false));
  };

  useEffect(() => {
    if (showStatusModal && !serverHealth) {
      fetchStatus();
    }
  }, [showStatusModal, serverHealth]);

  const playerTimeoutRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const activeSource = sources[activeIdx];
  const targetUrl = activeSource?.url || activeSource?.embed_url || "";

  // Auto-switch to direct mode if targetUrl is unsupported by CleanStream
  useEffect(() => {
    if (targetUrl && !isCleanStreamSupported(targetUrl)) {
      setPlayerMode("direct");
    }
  }, [targetUrl]);

  // Listen for fallback messages from CleanStream iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && (e.data.type === "CLEANSTREAM_FALLBACK_DIRECT" || e.data.type === "CLEANSTREAM_ERROR")) {
        console.warn("CleanStream requested fallback to direct mode.");
        setPlayerMode("direct");
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  // Build embed URL
  const embedUrl = useMemo(() => {
    if (!targetUrl) return "";
    const directEmbed = toDirectEmbedUrl(targetUrl);
    if (playerMode === "direct" || !isCleanStreamSupported(targetUrl)) {
      return directEmbed;
    }
    // CleanStream ad-free player with unmuted audio enabled (&autoplay=1&muted=0)
    return `${cleanstreamUrl}/embed?url=${encodeURIComponent(directEmbed)}&autoplay=1&muted=0`;
  }, [cleanstreamUrl, targetUrl, playerMode]);

  useEffect(() => {
    if (!embedUrl) {
      setPlayerLoading(false);
      return;
    }

    setPlayerError(false);
    setPlayerLoading(true);
    playerTimeoutRef.current = window.setTimeout(() => {
      setPlayerLoading(false);
      if (playerMode === "clean") {
        // Automatic fallback to Direct Version if CleanStream takes > 10s
        console.warn("CleanStream timeout reached. Auto-falling back to Direct Version.");
        setPlayerMode("direct");
      } else {
        setPlayerError(true);
      }
    }, 10000);

    return () => {
      if (playerTimeoutRef.current !== null) {
        window.clearTimeout(playerTimeoutRef.current);
        playerTimeoutRef.current = null;
      }
    };
  }, [embedUrl, key, playerMode]);

  const handleEmbedLoaded = () => {
    if (playerTimeoutRef.current !== null) {
      window.clearTimeout(playerTimeoutRef.current);
      playerTimeoutRef.current = null;
    }
    setPlayerLoading(false);
    setPlayerError(false);
  };

  const handleRefresh = () => {
    setPlayerError(false);
    setKey((k) => k + 1);
  };

  const handleNativeFullscreen = () => {
    // 1. Post message to CleanStream embed inside the iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "CLEANSTREAM_NATIVE_FULLSCREEN" }, "*");
    }

    // 2. Direct device check for fallback
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (!isIOS && playerContainerRef.current) {
      const doc = document as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        const cont = playerContainerRef.current as any;
        const req = cont.requestFullscreen || cont.webkitRequestFullscreen;
        if (req) {
          req.call(cont).catch(() => {});
        }
      }
    }
  };

  const handleNextMirror = () => {
    if (sources.length < 2) return;
    setPlayerError(false);
    setActiveIdx((idx) => (idx + 1) % sources.length);
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-full">
      {/* Auto-Advance Countdown Toast */}
      {autoAdvanceCountdown !== null && hasNext && (
        <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-white text-black shadow-2xl border border-white/20 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-bold truncate">
              Up Next in {autoAdvanceCountdown}s: {activePlaylist?.items[playlistIndex + 1]?.title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAutoAdvanceCountdown(null)}
              className="px-3 py-1 text-xs font-semibold text-zinc-600 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setAutoAdvanceCountdown(null);
                handleNextTrack();
              }}
              className="px-3.5 py-1 rounded-full bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
            >
              Play Now
            </button>
          </div>
        </div>
      )}

      {/* Playlist Continuous Playback Transport Deck */}
      {activePlaylist && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-[#0e121a] border border-white/10 shadow-lg">
          {/* Previous Button */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              type="button"
              onClick={handlePrevTrack}
              disabled={!hasPrev}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
            >
              <SkipBack className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>

            {/* Current Playlist Title & Index */}
            <button
              type="button"
              onClick={() => setShowQueueDrawer(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all text-center min-w-0"
              title="Click to view playlist queue"
            >
              <ListVideo className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                {activePlaylist.name}
              </span>
              <span className="text-[11px] font-semibold text-zinc-400 shrink-0 tabular-nums">
                ({playlistIndex + 1}/{activePlaylist.items.length})
              </span>
            </button>
          </div>

          {/* Right Transport Controls: Shuffle, Next & Queue */}
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isShuffle
                  ? "bg-white text-black font-bold shadow-sm"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
              title={isShuffle ? "Shuffle Enabled" : "Shuffle Off"}
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Shuffle</span>
            </button>

            <button
              type="button"
              onClick={handleNextTrack}
              disabled={!hasNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-bold shadow-sm hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
            >
              <span>Next</span>
              <SkipForward className="h-3.5 w-3.5 fill-black" />
            </button>

            <button
              type="button"
              onClick={() => setShowQueueDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <ListVideo className="h-3.5 w-3.5" />
              <span>Queue</span>
            </button>
          </div>
        </div>
      )}

      {/* Centered Cinema Video Player Container */}
      <div
        ref={playerContainerRef}
        className="w-full max-w-full mx-auto relative aspect-video bg-black overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.85)]"
      >
        {targetUrl ? (
          <iframe
            ref={iframeRef}
            key={`${key}-${playerMode}-${activeIdx}`}
            src={embedUrl}
            title={item.title}
            className="absolute inset-0 h-full w-full border-0 object-contain"
            allow="accelerometer; autoplay *; clipboard-write; encrypted-media *; gyroscope; picture-in-picture *; fullscreen *"
            allowFullScreen
            onLoad={(e) => {
              handleEmbedLoaded();
              try {
                const el = e.currentTarget;
                el.setAttribute("webkitallowfullscreen", "true");
                el.setAttribute("mozallowfullscreen", "true");
              } catch (_) {}
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
            <p className="text-base font-bold text-white">No active stream sources available</p>
            <p className="text-xs text-white/50 mt-1 max-w-md">
              The scraper recorded this catalog item, but stream sources may currently be processing.
            </p>
          </div>
        )}
        {playerLoading && targetUrl && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 pointer-events-none">
            <span className="rounded-full border border-white/10 bg-black/75 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
              Connecting to {activeSource?.label || activeSource?.host || "video source"}…
            </span>
          </div>
        )}
      </div>

      {playerError && targetUrl && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-xs leading-relaxed text-amber-100/90 sm:text-sm">
            {playerMode === "clean"
              ? "CleanStream could not stream this video directly. Try switching to Direct Embed or another mirror."
              : "The selected player could not load. Try another mirror or retry this one."}
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {playerMode === "clean" && (
              <button
                type="button"
                onClick={() => {
                  setPlayerMode("direct");
                  setPlayerError(false);
                  setKey((k) => k + 1);
                }}
                className="min-h-11 rounded-lg bg-white/10 border border-white/20 px-4 text-xs font-bold text-white transition hover:bg-white/15 active:scale-95 sm:text-sm"
              >
                Switch to Direct Embed
              </button>
            )}
            {sources.length > 1 && (
              <button
                type="button"
                onClick={handleNextMirror}
                className="min-h-11 rounded-lg bg-white text-black px-4 text-xs font-bold transition hover:bg-neutral-200 active:scale-95 sm:text-sm"
              >
                Try next mirror
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              className="min-h-11 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-95 sm:text-sm"
            >
              Retry this mirror
            </button>
          </div>
        </div>
      )}

      {/* Player Controls & Mirror Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-2xl bg-[#0e121a] border border-white/[0.08]">
        {/* Mirrors list */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none touch-scroll py-1 max-w-full">
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white/50 mr-1 sm:mr-2 shrink-0">
            <Server className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/60" />
            Mirrors ({sources.length}):
          </span>

          {sources.map((s, idx) => {
            const active = activeIdx === idx;
            let label = s.label || s.host || `Mirror ${idx + 1}`;
            const identity = serverIdentity(s, item.section);
            // Clean up host label for readability
            if (identity) label = identity.name;
            else if (label.toLowerCase().includes("hdplayer") || label.toLowerCase().includes("jolly")) label = "Server (Jolly Fast)";
            else if (label.toLowerCase().includes("hornyleak") || label.toLowerCase().includes("molly")) label = "Server (Molly HD)";
            else if (label.toLowerCase().includes("streamtape")) label = "Streamtape";
            else if (label.toLowerCase().includes("mixdrop")) label = "Mixdrop";
            else if (label.toLowerCase().includes("dood")) label = "Doodstream";
            else if (label.toLowerCase().includes("javclan") || label.includes("SB")) label = "StreamSB";
            else if (label.toLowerCase().includes("vide0") || label.includes("DD")) label = "Direct 1080p";
            else if (label.toLowerCase().includes("maxstream") || label.includes("JK")) label = "MaxStream";
            else if (label.toLowerCase().includes("streamhihi") || label.includes("LU")) label = "Lulu Stream";
            else if (label.toLowerCase().includes("javlesbians") || label.includes("VO")) label = "VOE Embed";

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveIdx(idx);
                  setPlayerError(false);
                  setKey((k) => k + 1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-150 active:scale-95 ${
                  active
                    ? "bg-white text-black font-bold ring-1 ring-white/90 shadow-sm"
                    : "bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
                }`}
              >
                <Play className={`h-2.5 w-2.5 ${active ? "fill-black text-black" : "fill-current text-white/50"}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right utility buttons: Mode Switcher, CleanStream status, Reload */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5 pt-1 sm:pt-0 border-t border-white/5 sm:border-0">
          {/* Player Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] sm:text-[11px]">
            <button
              type="button"
              onClick={() => setPlayerMode("clean")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all active:scale-95 ${
                playerMode === "clean"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>CleanStream</span>
            </button>
            <button
              type="button"
              onClick={() => setPlayerMode("direct")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all active:scale-95 ${
                playerMode === "direct"
                  ? "bg-white/15 text-white border border-white/20 font-bold"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <ExternalLink className="h-3 w-3" />
              <span>Direct</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowStatusModal(true);
                fetchStatus();
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors active:scale-95"
              title="View live server health and CleanStream status"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Servers</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
              title="Reload video player"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload</span>
            </button>

            <button
              type="button"
              onClick={handleNativeFullscreen}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors active:scale-95"
              title="Open video in device native player"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fullscreen</span>
            </button>

            <AddToPlaylistModal
              item={{
                id: String(item.id),
                title: item.title,
                slug: item.slug,
                section: item.section,
                thumbnailUrl: item.thumbnail_url,
                coverUrl: item.cover_url,
              }}
              compact
            />

            {targetUrl && (
              <a
                href={toDirectEmbedUrl(targetUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
                title="Open raw source"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Source</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Live Server & CleanStream Status Modal */}
      {showStatusModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStatusModal(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0e121a] border border-white/10 p-4 sm:p-6 shadow-2xl overflow-hidden modal-dialog-anim">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">CleanStream & Server Status</h3>
                  <p className="text-[11px] text-white/50">Real-time status of streaming hosts on CleanStream</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {/* CleanStream Engine Overview */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${serverHealth?.cleanstream_online ? "bg-emerald-400" : "bg-red-400"} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${serverHealth?.cleanstream_online ? "bg-emerald-500" : "bg-red-500"}`}></span>
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white">CleanStream Protection Engine</div>
                    <div className="text-[10px] text-white/40">Cloudflare Tunnel Proxy • Ad & Pop-up Trap Bypass</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${serverHealth?.cleanstream_online ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
                    {serverHealth?.cleanstream_online ? "Operational" : "Offline"}
                  </span>
                  {serverHealth?.latency_ms ? (
                    <div className="text-[9px] text-white/40 mt-0.5">{serverHealth.latency_ms}ms ping</div>
                  ) : null}
                </div>
              </div>

              {/* Server List */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
                <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-1">
                  Streaming Mirrors on CleanStream
                </div>
                {healthLoading && !serverHealth ? (
                  <div className="p-4 text-center text-xs text-white/40">Probing streaming servers...</div>
                ) : (
                  Object.values(serverHealth?.servers || {}).map((s) => {
                    const identity = serverIdentity({ host: s.name, label: s.name }, item.section);
                    return (
                      <div
                        key={s.name}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {s.cleanstream_working ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          )}
                          <div>
                            <div className="text-xs font-medium text-white">{identity?.name || s.name}</div>
                            <div className="text-[10px] text-white/40">{s.note || (s.cleanstream_working ? "CleanStream Protected" : "Mirror Unavailable")}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${s.cleanstream_working ? "bg-cyan-500/10 text-cyan-300" : "bg-white/5 text-white/40"}`}>
                            {s.cleanstream_working ? "CleanStream Active" : "Direct Only"}
                          </span>
                          {s.latency_ms ? (
                            <div className="text-[9px] text-white/30">{s.latency_ms}ms</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Auto-checks every 60s</span>
              </div>
              <button
                type="button"
                onClick={fetchStatus}
                disabled={healthLoading}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${healthLoading ? "animate-spin" : ""}`} />
                <span>{healthLoading ? "Checking..." : "Re-check"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Glass Playlist Queue Drawer */}
      {showQueueDrawer && activePlaylist && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQueueDrawer(false);
          }}
        >
          <div className="relative h-full w-full max-w-md bg-[#0c1017] border-l border-white/10 p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white shrink-0">
                    <ListVideo className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {activePlaylist.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Curated by @{activePlaylist.authorName} • {activePlaylist.items.length} titles
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQueueDrawer(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* In-Player Rating Bar */}
              <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-300">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRateActivePlaylist(star)}
                      className="p-0.5 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= Math.round(activePlaylist.rating)
                            ? "fill-amber-300 text-amber-300"
                            : "text-zinc-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-white ml-1.5 tabular-nums">
                    {activePlaylist.rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-zinc-400">({activePlaylist.ratingCount})</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/playlists/${activePlaylist.id}`}
                    className="text-[11px] text-zinc-400 hover:text-white underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>

            {/* Queue Items List */}
            <div className="my-4 flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {activePlaylist.items.map((track, tIdx) => {
                const isPlaying = tIdx === playlistIndex;

                return (
                  <button
                    key={track.id + tIdx}
                    type="button"
                    onClick={() => {
                      navigateToTrack(tIdx);
                      setShowQueueDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      isPlaying
                        ? "bg-white/15 border-white text-white shadow-md"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-4 text-center text-[11px] font-bold text-zinc-500 tabular-nums">
                        {tIdx + 1}
                      </span>
                      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-black/60 border border-white/10">
                        {track.thumbnailUrl || track.coverUrl ? (
                          <img
                            src={track.thumbnailUrl || track.coverUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <Film className="h-3 w-3" />
                          </div>
                        )}
                        {isPlaying && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Play className="h-3 w-3 fill-white text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isPlaying ? "text-white" : "text-zinc-200"}`}>
                          {track.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {track.duration || "HD Video"}
                        </div>
                      </div>
                    </div>

                    {isPlaying && (
                      <span className="shrink-0 rounded-full bg-white text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                        Playing
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span>{activePlaylist.items.length} titles in queue</span>
              <button
                type="button"
                onClick={() => setShowQueueDrawer(false)}
                className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs"
              >
                Close Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
