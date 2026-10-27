"use client";

import { useState, useMemo } from "react";
import { Server, Play, ShieldCheck, RefreshCw, ExternalLink, AlertTriangle, Maximize2, Sparkles } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog-db";

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

  const activeSource = sources[activeIdx];
  const targetUrl = activeSource?.url || activeSource?.embed_url || "";

  // Build embed URL
  const embedUrl = useMemo(() => {
    if (!targetUrl) return "";
    if (playerMode === "direct") {
      return targetUrl;
    }
    // CleanStream ad-free player
    return `${cleanstreamUrl}/embed?url=${encodeURIComponent(targetUrl)}&autoplay=1`;
  }, [cleanstreamUrl, targetUrl, playerMode]);

  const handleRefresh = () => {
    setKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Player Screen Frame */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_12px_45px_rgba(0,0,0,0.85)]">
        {targetUrl ? (
          <iframe
            key={`${key}-${playerMode}-${activeIdx}`}
            src={embedUrl}
            title={item.title}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
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
      </div>

      {/* Player Controls & Mirror Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
        {/* Mirrors list */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white/60 mr-2 shrink-0">
            <Server className="h-3.5 w-3.5 text-cyan-400" />
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
                  setKey((k) => k + 1);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
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
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Player Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setPlayerMode("clean")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                playerMode === "clean"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              🛡️ Ad-Free CleanStream
            </button>
            <button
              type="button"
              onClick={() => setPlayerMode("direct")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                playerMode === "direct"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              🌐 Direct Host
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Reload video player"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>

          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Open raw source"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Source</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
