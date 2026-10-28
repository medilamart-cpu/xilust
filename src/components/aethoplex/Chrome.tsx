"use client";

import { Tv, ShieldCheck, Sparkles, Heart } from "lucide-react";
import { site } from "@/lib/catalog";
import { Wordmark } from "./Logo";

export function Footer({ onNavigate }: { onNavigate?: (v: string) => void }) {
  return (
    <footer className="border-t border-white/10 bg-[#06080d] py-10 sm:py-12 pb-28 sm:pb-12 text-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <Wordmark />
            <p className="text-xs text-white/50 max-w-sm mt-3 leading-relaxed">
              {site.tagline}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                CleanStream Protected
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-[11px] font-semibold text-pink-300">
                <Sparkles className="h-3.5 w-3.5" />
                260,000+ Movies
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Sections</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/?section=lust" className="hover:text-white transition-colors">🔥 Lust (Western Studio)</a>
              </li>
              <li>
                <a href="/?section=jax" className="hover:text-white transition-colors">🌸 Jax (Japanese Adult Video)</a>
              </li>
              <li>
                <a href="/#mylist" className="hover:text-white transition-colors">📑 My Saved List</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Streaming Engine</h4>
            <p className="text-xs text-white/50 leading-relaxed">
              Powered by CleanStream Tunnel Proxy. Strips all ads, malicious redirect loops, and click traps for pure, uninterrupted playback.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-6 text-[11px] text-white/40">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 fill-pink-500 text-pink-500" /> for supreme streaming
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LivePill() {
  return (
    <div className="fixed bottom-5 right-5 z-40 hidden sm:flex items-center gap-2 rounded-full bg-black/80 border border-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-2xl backdrop-blur-xl">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-white/80">{site.live.toLocaleString()} Watching</span>
    </div>
  );
}
