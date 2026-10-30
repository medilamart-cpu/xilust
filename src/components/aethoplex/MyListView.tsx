"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { readList, TileCard, type ListItem } from "./PosterCard";
import type { CardModel } from "./PosterCard";

export function MyListView({
  onOpen,
  onBrowse,
}: {
  onOpen?: (c: CardModel) => void;
  onBrowse: () => void;
}) {
  const [list, setList] = useState<ListItem[]>([]);

  useEffect(() => {
    const sync = () => setList(readList());
    sync();
    window.addEventListener("mylist-change", sync);
    return () => window.removeEventListener("mylist-change", sync);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6 lg:px-8">
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
          className="min-h-11 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/85 transition hover:bg-white/10"
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
          <span className="glass-soft flex h-14 w-14 items-center justify-center rounded-2xl">
            <Heart className="h-6 w-6 text-[#cfe6ff]" />
          </span>
          <p className="mt-5 text-base sm:text-lg font-semibold text-white/85">Nothing saved yet</p>
          <p className="mt-2 max-w-sm text-xs sm:text-[13px] text-white/55">
            Tap the + button on any title card to keep it here for later.
          </p>
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((li) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
