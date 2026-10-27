"use client";

import { Play, Sparkles } from "lucide-react";
import { site } from "@/lib/catalog";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/15 shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md"
      style={{ width: size, height: size }}
    >
      <Play className="ml-0.5 h-[45%] w-[45%] fill-cyan-300 text-cyan-300" />
      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
      </span>
    </span>
  );
}

export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} />
      <div className="flex items-baseline">
        <span className="text-xl font-black tracking-wider text-white">Xi</span>
        <span className="text-xl font-black tracking-wider bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">Lust</span>
      </div>
    </span>
  );
}
