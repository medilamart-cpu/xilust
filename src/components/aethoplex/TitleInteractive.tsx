"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, Check, Share2, X, Youtube, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar, type View } from "./Navbar";
import { Footer } from "./Chrome";
import { useMyList, type CardModel } from "./PosterCard";
import type { VideoItem } from "@/lib/tmdb-server";

/* ------------------------------------------------------------------ */
/*  YouTube modal player                                               */
/* ------------------------------------------------------------------ */

function VideoModal({
  videos,
  index,
  onClose,
  onIndex,
}: {
  videos: VideoItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const v = videos[index];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < videos.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", fn);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", fn);
    };
  }, [onClose, onIndex, index, videos.length]);

  if (!v) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070b]/95 p-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={v.name}
      onClick={onClose}
    >
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 pb-3">
          <p className="truncate text-[13.5px] font-semibold text-white/90">{v.name}</p>
          <button
            onClick={onClose}
            aria-label="Close player"
            className="glass-soft focusable flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/12 bg-black shadow-2xl">
          <iframe
            key={v.key}
            src={`https://www.youtube.com/embed/${v.key}?autoplay=1&rel=0`}
            title={v.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        {videos.length > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => onIndex(index - 1)}
              disabled={index === 0}
              className="glass-soft focusable flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-white/85 transition hover:bg-white/15 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-[11.5px] tabular-nums text-white/45">
              {index + 1} / {videos.length}
            </span>
            <button
              onClick={() => onIndex(index + 1)}
              disabled={index === videos.length - 1}
              className="glass-soft focusable flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-white/85 transition hover:bg-white/15 disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero "play trailer" button                                         */
/* ------------------------------------------------------------------ */

export function WatchTrailerButton({ videos }: { videos: VideoItem[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (videos.length === 0) return null;

  return (
    <>
      <button
        onClick={() => {
          setIdx(0);
          setOpen(true);
        }}
        className="cta-gradient focusable flex h-11 items-center gap-2.5 rounded-xl px-6 text-[14px] font-semibold transition"
      >
        <Play className="h-4.5 w-4.5 fill-current" />
        Play trailer
      </button>
      {open && (
        <VideoModal videos={videos} index={idx} onClose={() => setOpen(false)} onIndex={setIdx} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Trailers & more — video thumbnail grid                             */
/* ------------------------------------------------------------------ */

export function VideosSection({ videos }: { videos: VideoItem[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (videos.length === 0) return null;

  return (
    <section className="mt-12" aria-label="Trailers and more">
      <h3 className="text-[22px] font-bold tracking-tight text-[#f5f6fb] md:text-2xl">
        Trailers &amp; more
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {videos.slice(0, 6).map((v, i) => (
          <button
            key={v.id}
            onClick={() => {
              setIdx(i);
              setOpen(true);
            }}
            className="focusable group relative overflow-hidden rounded-xl border border-white/10 bg-[#10131b] text-left transition hover:border-white/25"
            aria-label={`Play video: ${v.name}`}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <img
                src={`https://img.youtube.com/vi/${v.key}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-[1.04] group-hover:opacity-100"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="glass-soft flex h-11 w-11 items-center justify-center rounded-full shadow-xl transition group-hover:scale-110">
                  <Play className="ml-0.5 h-4.5 w-4.5 fill-[#cfe6ff] text-[#cfe6ff]" />
                </span>
              </span>
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.1em] text-white/85">
                <Youtube className="h-3 w-3" />
                {v.type.toUpperCase()}
              </span>
            </div>
            <p className="truncate px-3 py-2.5 text-[12.5px] font-medium text-white/85">{v.name}</p>
          </button>
        ))}
      </div>
      {open && (
        <VideoModal videos={videos} index={idx} onClose={() => setOpen(false)} onIndex={setIdx} />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  My list toggle (hero)                                              */
/* ------------------------------------------------------------------ */

export function MyListToggle({ item }: { item: CardModel }) {
  const { has, toggle } = useMyList();
  const saved = has(item.key);
  return (
    <button
      onClick={() => toggle(item)}
      className="glass-soft focusable flex h-11 items-center gap-2.5 rounded-xl px-6 text-[14px] font-medium text-[#f1f4fa] transition hover:bg-white/15"
      aria-pressed={saved}
    >
      {saved ? (
        <>
          <Check className="h-4.5 w-4.5 text-[#cfe6ff]" /> In my list
        </>
      ) : (
        <>
          <Plus className="h-4.5 w-4.5" /> My list
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Share button                                                       */
/* ------------------------------------------------------------------ */

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: document.title });
        return;
      }
      throw new Error("no share");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        /* clipboard unavailable — ignore */
      }
    }
  };

  return (
    <button
      onClick={share}
      aria-label="Share this title"
      className="glass-soft focusable flex h-11 w-11 items-center justify-center rounded-xl text-white/85 transition hover:bg-white/15"
    >
      {copied ? <Check className="h-4.5 w-4.5 text-[#cfe6ff]" /> : <Share2 className="h-4.5 w-4.5" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Standalone navbar + footer for the title page route                */
/* ------------------------------------------------------------------ */

export function TitleNav() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const navigate = (v: View) => {
    if (v === "home") router.push("/");
    else router.push(`/?view=${v}`);
  };

  const onQueryChange = (value: string) => {
    setQ(value);
    if (!value.trim()) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      router.push(`/?view=search&q=${encodeURIComponent(value.trim())}`);
    }, 650);
  };

  return (
    <Navbar view="home" onNavigate={navigate} query={q} onQueryChange={onQueryChange} deferNavigate />
  );
}

export function TitleFooter() {
  const router = useRouter();
  return (
    <Footer
      onNavigate={(v) => {
        if (v === "home") router.push("/");
        else router.push(`/?view=${v}`);
      }}
    />
  );
}
