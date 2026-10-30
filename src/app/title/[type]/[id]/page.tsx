import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Film, Server, Eye, Tag, Share2, Sparkles, AlertCircle } from "lucide-react";
import { getItemBySlug, queryItems, type CatalogItem } from "@/lib/catalog-db";
import { getCatalogThumbnailUrls } from "@/lib/catalog-thumbnail";
import { formatStudioLabel } from "@/lib/studio-label";
import { TileCard, extractCleanTitleAndDate, formatVideoDuration } from "@/components/aethoplex/PosterCard";
import { TitleWatchClient } from "./TitleWatchClient";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const section = type === "jax" ? "jax" : "lust";
  const item = await getItemBySlug(section, id);

  if (!item) {
    notFound();
  }

  // Get similar recommendations from the same category or studio
  const category = item.categories[0];
  const { items: recs } = await queryItems({
    section,
    category: category || undefined,
    limit: 8,
  });

  const cleanstreamUrl =
    process.env.NEXT_PUBLIC_CLEANSTREAM_URL || "https://marriage-editorials-tyler-clark.trycloudflare.com";
  
  const { cleanTitle, originalYear, originalDate } = extractCleanTitleAndDate(item.title, item.year);
  const duration = formatVideoDuration(item.duration_seconds, item.title, item.id, section);
  const jaxRating = section === "jax" ? Math.round(((item.views % 30) / 10 + 7.0) * 10) / 10 : null;

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8]">
      {/* Top back bar with safe-area support */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-xl px-3 sm:px-8 py-2.5 sm:py-3.5 pt-[calc(0.625rem+env(safe-area-inset-top))] flex items-center justify-between">
        <Link
          href={`/?section=${section}`}
          className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {section === "jax" ? "🌸 Jax" : "🔥 Lust"}</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {item.code && (
            <span className="rounded-md bg-pink-500/80 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black tracking-wider text-white shadow-md">
              {item.code}
            </span>
          )}
          <span className="rounded-md bg-white/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/70">
            {section.toUpperCase()}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2 sm:py-6 pb-24 sm:pb-8 overflow-x-hidden">
        {/* Interactive Video Player & Mirror Picker (Client Component) */}
        <TitleWatchClient item={item} cleanstreamUrl={cleanstreamUrl} />

        {/* Title Details & Meta */}
        <div className="mt-5 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {jaxRating && (
                  <>
                    <span className="flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-xs font-semibold text-cyan-300 border border-white/10">
                      <Star className="h-3 w-3 fill-cyan-400 text-cyan-400" />
                      {jaxRating} / 10
                    </span>
                    <span className="text-sm text-white/40">•</span>
                  </>
                )}
                {originalYear && (
                  <>
                    <span className="text-sm font-medium text-white/70">{originalYear}</span>
                    <span className="text-sm text-white/40">•</span>
                  </>
                )}
                <span className="rounded bg-black/50 px-2 py-0.5 text-xs font-semibold text-white/80 border border-white/10 flex items-center gap-1">
                  <span>⏱</span>
                  <span>{duration}</span>
                </span>
                <span className="text-sm text-white/40">•</span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                  CleanStream Protected
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-snug">
                {cleanTitle}
              </h1>
            </div>

            {/* Actresses / Stars */}
            {item.actors.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                  {section === "jax" ? "Actresses" : "Pornstars / Cast"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.actors.map((actor, idx) => {
                    const cleanActor = actor.replace(/\s+[a-f0-9]{10,}$/i, "").trim();
                    return (
                      <Link
                        key={idx}
                        href={`/?section=${section}&actor=${encodeURIComponent(cleanActor)}`}
                        className="rounded-lg bg-pink-500/15 border border-pink-500/30 px-3 py-1.5 text-xs font-medium text-pink-200 hover:bg-pink-500/30 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>🌸</span>
                        <span>{cleanActor}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Studios & Production */}
            {item.studios.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-purple-400" />
                  Studios & Production
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.studios.map((studio, idx) => (
                    <Link
                      key={idx}
                      href={`/?section=${section}&studio=${encodeURIComponent(studio)}`}
                      className="rounded-lg bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-200 hover:bg-purple-500/30 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>🎬</span>
                      <span>{formatStudioLabel(studio)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories & Tags */}
            {item.categories.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-cyan-400" />
                  Categories & Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.categories.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={`/?section=${section}&category=${encodeURIComponent(cat)}`}
                      className="rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Facts (Right 1 col) */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
                Video Details
              </h3>

              {item.code && (
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                  <span className="text-white/50">JAV Code</span>
                  <Link href={`/?section=jax&code=${encodeURIComponent(item.code)}`} className="font-mono font-bold text-pink-300 hover:text-pink-100 hover:underline">
                    {item.code}
                  </Link>
                </div>
              )}

              {item.studios.length > 0 && (
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                  <span className="text-white/50">Studio / Label</span>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[170px]">
                    {item.studios.map((s, idx) => (
                      <Link
                        key={idx}
                        href={`/?section=${section}&studio=${encodeURIComponent(s)}`}
                        className="font-medium text-purple-300 hover:text-purple-100 hover:underline transition-colors truncate"
                      >
                        {formatStudioLabel(s)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                <span className="text-white/50">Runtime / Length</span>
                <span className="font-medium text-white/90">{duration}</span>
              </div>

              {originalDate ? (
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                  <span className="text-white/50">Release Date</span>
                  <span className="font-medium text-white/90">{originalDate}</span>
                </div>
              ) : originalYear ? (
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                  <span className="text-white/50">Release Year</span>
                  <span className="font-medium text-white/90">{originalYear}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                <span className="text-white/50">Streaming Mirrors</span>
                <span className="font-bold text-cyan-400">{item.video_sources.length} Available</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Ad Protection</span>
                <span className="font-semibold text-emerald-400">CleanStream Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Row */}
        {recs.length > 0 && (
          <div className="mt-12 sm:mt-16 border-t border-white/10 pt-8 sm:pt-10">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">More Like This</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {recs.slice(0, 4).map((rec) => {
                const vpsBase =
                  process.env.NEXT_PUBLIC_THUMBS_CDN ||
                  "https://interventions-precision-stake-alternate.trycloudflare.com";
                const { posterUrl, fallbackUrl } = getCatalogThumbnailUrls(rec, vpsBase);

                return (
                  <TileCard
                    key={rec.id}
                    item={{
                      key: `${rec.section}-${rec.id}`,
                      id: rec.id,
                      section: rec.section,
                      slug: rec.slug,
                      code: rec.code,
                      uploadedAt: rec.published_at,
                      name: rec.title,
                      kind: "FILM",
                      year: rec.year || 2026,
                      rating: 8.5,
                      posterUrl,
                      backdropUrl: posterUrl,
                      fallbackUrl,
                      studios: rec.studios,
                      actors: rec.actors,
                      categories: rec.categories,
                      sourcesCount: rec.video_sources.length,
                      durationSeconds: rec.duration_seconds ?? null,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
