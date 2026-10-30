"use client";

import { useEffect, useState } from "react";

export function TaxonomyThumbnail({
  src,
  fallbackSrc,
  alt,
  fallbackLabel,
}: {
  src: string | null;
  fallbackSrc: string | null;
  alt: string;
  fallbackLabel: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  useEffect(() => setCurrentSrc(src || fallbackSrc), [src, fallbackSrc]);
  if (!currentSrc) return <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-950/50 to-slate-900 text-3xl font-bold text-white/35">{fallbackLabel.slice(0, 1).toUpperCase()}</div>;
  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
        else setCurrentSrc(null);
      }}
    />
  );
}
