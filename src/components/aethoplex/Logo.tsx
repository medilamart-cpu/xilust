"use client";

import { Play } from "lucide-react";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-xl bg-[#0e121a] border border-white/[0.12] shadow-sm transition-transform duration-150 active:scale-95"
      style={{ width: size, height: size }}
    >
      <Play className="ml-0.5 h-[42%] w-[42%] fill-rose-500 text-rose-500" />
    </span>
  );
}

export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="flex items-baseline font-black tracking-tight text-xl leading-none">
        <span className="text-white">Xi</span>
        <span className="text-rose-500">Lust</span>
      </div>
    </span>
  );
}
