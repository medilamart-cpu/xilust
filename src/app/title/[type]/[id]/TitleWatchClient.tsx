"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Server, Play, ShieldCheck, RefreshCw, ExternalLink, AlertTriangle, Maximize2, Sparkles } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog-db";

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

  // Doodstream / Playmogo: /d/ID -> /e/ID
  if (/(?:dood|playmogo|ds2play|d000d|do0od)\.[a-z0-9]+\/d\/([A-Za-z0-9_-]+)/i.test(clean)) {
    return clean.replace(/\/d\//i, "/e/");
  }

  return clean;
}

export function TitleWatchClient({
  item,
  cleanstreamUrl,
}: {
  item: CatalogItem;
  cleanstreamUrl: string;
}) {
  const rawSources = item.video_sources || [];

  // Sort sources by highest reliability (Streamtape, StreamSB, Vide0, Mixdrop first)
  const sources = useMemo(() => {
    return [...rawSources].sort((a, b) => {
      const hA = (a.host || a.label || "").toLowerCase();
      const hB = (b.host || b.label || "").toLowerCase();

      const priority = (h: string) => {
        if (h.includes("streamtape")) return 1;
        if (h.includes("javclan") || h.includes("sb")) return 2;
        if (h.includes("vide0") || h.includes("dd")) return 3;
        if (h.includes("mixdrop")) return 4;
        if (h.includes("maxstream") || h.includes("jk")) return 5;
        if (h.includes("streamhihi") || h.includes("lu")) return 6;
        if (h.includes("javlesbians") || h.includes("vo")) return 7;
        if (h.includes("dood")) return 99; // Dood often deletes older files
        return 10;
      };

      return priority(hA) - priority(hB);
    });
  }, [rawSources]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [playerMode, setPlayerMode] = useState<"clean" | "direct">("clean");
  const [key, setKey] = useState(0);
  const [playerError, setPlayerError] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const playerTimeoutRef = useRef<number | null>(null);

  const activeSource = sources[activeIdx];
  const targetUrl = activeSource?.url || activeSource?.embed_url || "";

  const isStreamtape = useMemo(() => {
    const h = (activeSource?.host || activeSource?.label || targetUrl).toLowerCase();
    return h.includes("streamtape") || h.includes("strtape") || h.includes("streamta.pe") || h.includes("advtpe");
  }, [activeSource, targetUrl]);

  // Build embed URL
  const embedUrl = useMemo(() => {
    if (!targetUrl) return "";
    const directEmbed = toDirectEmbedUrl(targetUrl);
    // Streamtape tokens are bound directly to browser IP, so direct embed works seamlessly
    if (playerMode === "direct" || isStreamtape) {
      return directEmbed;
    }
    // CleanStream ad-free player for other servers
    return `${cleanstreamUrl}/embed?url=${encodeURIComponent(directEmbed)}&autoplay=1`;
  }, [cleanstreamUrl, targetUrl, playerMode, isStreamtape]);

  useEffect(() => {
    if (!embedUrl) {
      setPlayerLoading(false);
      return;
    }

    setPlayerError(false);
    setPlayerLoading(true);
    playerTimeoutRef.current = window.setTimeout(() => {
      setPlayerLoading(false);
      setPlayerError(true);
    }, 20000);

    return () => {
      if (playerTimeoutRef.current !== null) {
        window.clearTimeout(playerTimeoutRef.current);
        playerTimeoutRef.current = null;
      }
    };
  }, [embedUrl, key]);

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

  const handleNextMirror = () => {
    if (sources.length < 2) return;
    setPlayerError(false);
    setActiveIdx((idx) => (idx + 1) % sources.length);
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-full">
      {/* Centered Cinema Video Player Container */}
      <div className="w-full max-w-full mx-auto relative aspect-video bg-black overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.85)]">
        {targetUrl ? (
          <iframe
            key={`${key}-${playerMode}-${activeIdx}`}
            src={embedUrl}
            title={item.title}
            className="absolute inset-0 h-full w-full border-0 object-contain"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={handleEmbedLoaded}
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
            // Clean up host label for readability
            if (label.toLowerCase().includes("streamtape")) label = "Streamtape";
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
                playerMode === "clean" && !isStreamtape
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
                playerMode === "direct" || isStreamtape
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
              onClick={handleRefresh}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
              title="Reload video player"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload</span>
            </button>

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
    </div>
  );
}
