"use client";

import { useMemo } from "react";

/* Deterministic "generated art" posters.
 * Every title gets a unique, stable cinematic gradient composition
 * derived from its name hash — so placeholder art still feels art-directed.
 * If a Title has a `poster` / `backdrop` URL, the real image is used instead. */

const PALETTES: [string, string, string][] = [
  ["#1b2a4a", "#0e1830", "#7fb4e8"],
  ["#3a1b4a", "#160d26", "#c78fe8"],
  ["#0d3a3f", "#071c20", "#66d9cf"],
  ["#402015", "#1c0d08", "#e8a066"],
  ["#12284f", "#090f1e", "#8fb7ff"],
  ["#3f1428", "#1a0810", "#ff8fb1"],
  ["#1e3d16", "#0a1408", "#9fe07f"],
  ["#2f2a0e", "#141206", "#e8d27f"],
  ["#142e46", "#0a1420", "#7fd4e8"],
  ["#33194a", "#120824", "#b48fff"],
  ["#0e2e4a", "#081426", "#6fb9ff"],
  ["#42350f", "#1a1506", "#ffd97f"],
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface ArtSpec {
  bg: string;
  glowA: string;
  glowB: string;
  ringX: number;
  ringY: number;
  angle: number;
}

export function artSpecFor(name: string): ArtSpec {
  const h = hash(name);
  const pal = PALETTES[h % PALETTES.length];
  return {
    bg: `linear-gradient(${155 + (h % 40)}deg, ${pal[0]} 0%, ${pal[1]} 58%, ${pal[0]} 100%)`,
    glowA: pal[2],
    glowB: PALETTES[(h + 5) % PALETTES.length][2],
    ringX: 25 + (h % 50),
    ringY: 20 + ((h >> 3) % 45),
    angle: (h >> 5) % 360,
  };
}

interface Props {
  name: string;
  kind?: string;
  wide?: boolean;
  imageUrl?: string;
  className?: string;
}

export function GeneratedArt({ name, kind, wide, imageUrl, className }: Props) {
  const spec = useMemo(() => artSpecFor(name), [name]);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`h-full w-full object-cover ${className ?? ""}`}
        loading="lazy"
        draggable={false}
      />
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className ?? ""}`}
      style={{ background: spec.bg }}
      aria-label={`${kind ?? "Title"} art for ${name}`}
      role="img"
    >
      {/* aurora glow blobs */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(${wide ? "72% 62%" : "58% 48%"} at ${spec.ringX}% ${spec.ringY}%, ${spec.glowA}${wide ? "55" : "42"} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(${wide ? "58% 52%" : "45% 38%"} at ${100 - spec.ringX}% ${100 - spec.ringY}%, ${spec.glowB}${wide ? "4d" : "38"} 0%, transparent 70%)`,
        }}
      />
      {/* light streak */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(${spec.angle}deg, transparent 42%, ${spec.glowA}30 50%, transparent 58%)`,
        }}
      />
      {/* horizon glow for wide art */}
      {wide && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background: `linear-gradient(to top, ${spec.glowB}26 0%, transparent 80%)`,
          }}
        />
      )}
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 40%, transparent 55%, rgba(4,6,10,0.55) 100%)",
        }}
      />
      {/* typographic monogram */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center select-none">
        <span
          className={`font-semibold tracking-[0.18em] text-white/85 ${wide ? "text-[11px] md:text-xs" : "text-[8px]"}`}
        >
          {kind ?? "FEATURE"}
        </span>
        <span
          className={`mt-2 font-bold leading-tight text-white/95 drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] ${
            wide
              ? "text-4xl md:text-6xl tracking-tight"
              : name.length > 18
                ? "text-[13px]"
                : "text-base"
          }`}
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {name}
        </span>
        <span className="mt-3 h-px w-10 bg-white/30" />
      </div>
    </div>
  );
}
