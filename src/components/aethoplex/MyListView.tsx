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
      <span className="eyebrow">Your library</span>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-[#f5f6fb] md:text-5xl">
        My list
      </h1>
      <p className="mt-2 text-[13.5px] text-white/60">
        {list.length > 0
          ? `${list.length} ${list.length === 1 ? "title" : "titles"} saved — synced to this browser.`
          : "Titles you add land here."}
      </p>

      {list.length === 0 ? (
        <div className="glass mt-10 flex flex-col items-center rounded-2xl px-6 py-20 text-center">
          <span className="glass-soft flex h-14 w-14 items-center justify-center rounded-2xl">
            <Heart className="h-6 w-6 text-[#cfe6ff]" />
          </span>
          <p className="mt-5 text-lg font-semibold text-white/85">Nothing saved yet</p>
          <p className="mt-2 max-w-sm text-[13px] text-white/55">
            Hover any poster and hit the + to keep it here for later.
          </p>
          <button
            onClick={onBrowse}
            className="cta-gradient focusable mt-6 rounded-xl px-5 py-2.5 text-[13px] font-semibold"
          >
            Browse films & series
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((li) => (
            <TileCard
              key={li.key ?? `${li.mediaType}-${li.id}`}
              item={{
                key: li.key ?? `${li.mediaType}-${li.id}`,
                name: li.name,
                kind: li.kind,
                year: li.year,
                rating: li.rating,
                posterUrl: li.posterUrl,
                tmdbId: li.mediaType === "movie" || li.mediaType === "tv" ? li.id : undefined,
                mediaType: li.mediaType === "movie" || li.mediaType === "tv" ? li.mediaType : undefined,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
