"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, Flame, Sparkles, Star } from "lucide-react";
import { readList, TileCard, type ListItem } from "./PosterCard";
import type { CardModel } from "./PosterCard";
import { SPRING_SNAPPY, SPRING_GENTLE } from "@/lib/motion";

export function MyListView({
  onOpen,
  onBrowse,
  section = "lust",
  onSectionChange,
}: {
  onOpen?: (c: CardModel) => void;
  onBrowse: () => void;
  section?: "lust" | "jax" | "fans";
  onSectionChange?: (sec: "lust" | "jax" | "fans") => void;
}) {
  const [list, setList] = useState<ListItem[]>([]);

  useEffect(() => {
    const sync = () => setList(readList());
    sync();
    window.addEventListener("mylist-change", sync);
    return () => window.removeEventListener("mylist-change", sync);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-24 md:px-6 lg:px-8">
      {/* Top Navigation Row: Explicit Back button & Section Switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={onBrowse}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/15 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-cyan-400" />
          <span>Back to Home</span>
        </button>

        {onSectionChange && (
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0e121a] border border-white/[0.08] relative">
            {(
              [
                { id: "lust" as const, label: "LUST", icon: <Flame className="h-3 w-3 text-rose-400" /> },
                { id: "jax" as const, label: "JAX", icon: <Sparkles className="h-3 w-3 text-pink-400" /> },
                { id: "fans" as const, label: "FANS", icon: <Star className="h-3 w-3 text-amber-400" /> },
              ] as const
            ).map((t) => {
              const active = section === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSectionChange(t.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-150 active:scale-95 z-[1] ${
                    active ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mylist-channel-pill"
                      className="absolute inset-0 rounded-full bg-white/20 border border-white/25 shadow-sm"
                      transition={SPRING_SNAPPY}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Your library</span>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#f5f6fb] md:text-5xl">
            My list
          </h1>
        </div>
        <button
          type="button"
          onClick={onBrowse}
          className="min-h-11 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
        >
          Browse titles
        </button>
      </div>
      <p className="mt-2 text-[13.5px] text-white/60">
        {list.length > 0
          ? `${list.length} ${list.length === 1 ? "title" : "titles"} saved — synced to this browser.`
          : "Titles you add land here."}
      </p>

      {list.length === 0 ? (
        <div className="glass mt-8 sm:mt-10 flex flex-col items-center rounded-2xl px-4 sm:px-6 py-16 sm:py-20 text-center">
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="glass-soft flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(207,230,255,0.2)]"
          >
            <Heart className="h-6 w-6 text-[#cfe6ff] fill-[#cfe6ff]/20" />
          </motion.span>
          <p className="mt-5 text-base sm:text-lg font-semibold text-white/85">Nothing saved yet</p>
          <p className="mt-2 max-w-sm text-xs sm:text-[13px] text-white/55">
            Tap the + button on any title card to keep it here for later.
          </p>
          <button
            type="button"
            onClick={onBrowse}
            className="mt-6 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-all active:scale-95"
          >
            Start Browsing
          </button>
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((li) => (
              <motion.div
                key={li.key ?? `${li.section}-${li.id}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
                transition={SPRING_GENTLE}
              >
                <TileCard
                  key={li.key ?? `${li.section}-${li.id}`}
                  item={{
                    key: li.key ?? `${li.section}-${li.id}`,
                    id: li.id,
                    section: li.section,
                    slug: li.slug,
                    code: li.code,
                    uploadedAt: li.uploadedAt,
                    name: li.name,
                    kind: li.kind,
                    year: li.year,
                    rating: li.rating,
                    posterUrl: li.posterUrl,
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
