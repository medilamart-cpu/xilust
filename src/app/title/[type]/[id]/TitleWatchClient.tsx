"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Server, Play, ShieldCheck, RefreshCw, ExternalLink, AlertTriangle, Maximize2, Sparkles, Activity, X, CheckCircle2, Clock } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog-db";
import { AddToPlaylistModal } from "@/components/aethoplex/AddToPlaylistModal";

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
        { match: ["kamehaus", "kamehameha", "kame"], name: "Goku ⚡", icon: "🐉" },
        { match: ["vidara", "sugbaioug"], name: "Vegeta 💥", icon: "👑" },
        { match: ["streamtape", "streamta.pe"], name: "Tsunade", icon: "💮" },
        { match: ["mixdrop", "mxdrop"], name: "Jiraiya 🐸", icon: "📜" },
        { match: ["streamhihi", "lulu"], name: "Naruto", icon: "🍥" },
        { match: ["javlesbian", "voe"], name: "Sasuke", icon: "⚡" },
        { match: ["javclan", "streamsb", "sbthe", "sb"], name: "Itachi 👁️", icon: "🌙" },
        { match: ["filemoon"], name: "Gaara ⏳", icon: "🏜️" },
        { match: ["maxstream"], name: "Kakashi", icon: "🥷" },
        { match: ["vid0", "vide0"], name: "Sakura 🗑️", icon: "🌸" },
      ]
    : section === "lust"
      ? [
          { match: ["streamtape", "streamta.pe"], name: "Naruto", icon: "🍥" },
          { match: ["mixdrop", "mxdrop", "mixdrp"], name: "Sasuke", icon: "⚡" },
          { match: ["doodstream", "dood", "d000d"], name: "Sakura 🗑️", icon: "🌸" },
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
                className="min-h-11 rounded-lg bg-purple-500 px-4 text-xs font-bold text-white transition hover:bg-purple-400 sm:text-sm"
              >
                🌐 Try Direct Embed
              </button>
            )}
            {sources.length > 1 && (
              <button
                type="button"
                onClick={handleNextMirror}
                className="min-h-11 rounded-lg bg-cyan-400 px-4 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 sm:text-sm"
              >
                Try next mirror
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              className="min-h-11 rounded-lg border border-amber-200/20 bg-white/[0.06] px-4 text-xs font-semibold text-white transition hover:bg-white/10 sm:text-sm"
            >
              Retry this mirror
            </button>
          </div>
        </div>
      )}

      {/* Player Controls & Mirror Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
        {/* Mirrors list */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none touch-scroll py-1 max-w-full">
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white/60 mr-1 sm:mr-2 shrink-0">
            <Server className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" />
            Mirrors ({sources.length}):
          </span>

          {sources.map((s, idx) => {
            const active = activeIdx === idx;
            let label = s.label || s.host || `Mirror ${idx + 1}`;
            const identity = serverIdentity(s, item.section);
            // Clean up host label for readability
            if (identity) label = identity.name;
            else if (label.toLowerCase().includes("hdplayer") || label.toLowerCase().includes("jolly")) label = "Jolly";
            else if (label.toLowerCase().includes("hornyleak") || label.toLowerCase().includes("molly")) label = "Molly";
            else if (label.toLowerCase().includes("streamtape")) label = "Streamtape";
            else if (label.toLowerCase().includes("mixdrop")) label = "Mixdrop";
            else if (label.toLowerCase().includes("dood")) label = "Doodstream";
            else if (label.toLowerCase().includes("javclan") || label.includes("SB")) label = "JavClan (SB)";
            else if (label.toLowerCase().includes("vide0") || label.includes("DD")) label = "Vide0 (DD)";
            else if (label.toLowerCase().includes("maxstream") || label.includes("JK")) label = "MaxStream (JK)";
            else if (label.toLowerCase().includes("streamhihi") || label.includes("LU")) label = "StreamHiHi (LU)";
            else if (label.toLowerCase().includes("javlesbians") || label.includes("VO")) label = "JavLesbians (VO)";

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveIdx(idx);
                  setPlayerError(false);
                  setKey((k) => k + 1);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                  active
                    ? "bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <Play className={`h-2.5 w-2.5 ${active ? "fill-black" : "fill-current"}`} />
                {identity && <span aria-hidden="true">{identity.icon}</span>}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right utility buttons: Mode Switcher, CleanStream status, Reload */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5 pt-1 sm:pt-0 border-t border-white/5 sm:border-0">
          {/* Player Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10 text-[10px] sm:text-[11px]">
            <button
              type="button"
              onClick={() => setPlayerMode("clean")}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all ${
                playerMode === "clean"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              🛡️ CleanStream
            </button>
            <button
              type="button"
              onClick={() => setPlayerMode("direct")}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all ${
                playerMode === "direct"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              🌐 Direct
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950/95 border border-white/10 p-4 sm:p-6 shadow-2xl overflow-hidden">
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
                          {identity && <span aria-hidden="true">{identity.icon}</span>}
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
    </div>
  );
}
