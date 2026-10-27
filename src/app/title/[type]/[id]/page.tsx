import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Film, Server, Eye, Tag, Share2, Sparkles, AlertCircle } from "lucide-react";
import { getItemBySlug, queryItems, type CatalogItem } from "@/lib/catalog-db";
import { TileCard } from "@/components/aethoplex/PosterCard";
import { TitleWatchClient } from "./TitleWatchClient";

export const dynamic = "force-dynamic";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const section = type === "jax" ? "jax" : "lust";
  const item = getItemBySlug(section, id);

  if (!item) {
    notFound();
  }

  // Get similar recommendations from the same category or studio
  const category = item.categories[0];
  const { items: recs } = queryItems({
    section,
    category: category || undefined,
    limit: 8,
  });

  const cleanstreamUrl =
    process.env.NEXT_PUBLIC_CLEANSTREAM_URL || "https://marriage-editorials-tyler-clark.trycloudflare.com";

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8]">
      {/* Top back bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-xl px-4 py-3.5 sm:px-8 flex items-center justify-between">
        <Link
          href={`/?section=${section}`}
          className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {section === "jax" ? "🌸 Jax" : "🔥 Lust"}</span>
        </Link>

        <div className="flex items-center gap-2">
          {item.code && (
            <span className="rounded-md bg-pink-500/80 px-2.5 py-1 text-xs font-black tracking-wider text-white shadow-md">
              {item.code}
            </span>
          )}
          <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white/70">
            {section.toUpperCase()}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Interactive Video Player & Mirror Picker (Client Component) */}
        <TitleWatchClient item={item} cleanstreamUrl={cleanstreamUrl} />

        {/* Title Details & Meta */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-xs font-semibold text-cyan-300 border border-white/10">
                  <Star className="h-3 w-3 fill-cyan-400 text-cyan-400" />
                  8.5 / 10
                </span>
                <span className="text-sm text-white/40">•</span>
                <span className="text-sm font-medium text-white/70">{item.year || "2026"}</span>
                <span className="text-sm text-white/40">•</span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                  CleanStream Protected
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                {item.title}
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
                  {item.actors.map((actor, idx) => (
                    <Link
                      key={idx}
                      href={`/?section=${section}&q=${encodeURIComponent(actor)}`}
                      className="rounded-lg bg-pink-500/15 border border-pink-500/30 px-3 py-1 text-xs font-medium text-pink-200 hover:bg-pink-500/30 transition-all"
                    >
                      🌸 {actor}
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
                  <span className="font-mono font-bold text-pink-300">{item.code}</span>
                </div>
              )}

              {item.studios.length > 0 && (
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                  <span className="text-white/50">Studio / Label</span>
                  <span className="font-medium text-white/90 truncate max-w-[150px]">
                    {item.studios.join(", ")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                <span className="text-white/50">Release Year</span>
                <span className="font-medium text-white/90">{item.year || "—"}</span>
              </div>

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
          <div className="mt-16 border-t border-white/10 pt-10">
            <h2 className="text-xl font-bold text-white mb-6">More Like This</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {recs.slice(0, 4).map((rec) => {
                const vpsBase =
                  process.env.NEXT_PUBLIC_THUMBS_CDN ||
                  "https://interventions-precision-stake-alternate.trycloudflare.com";
                const posterUrl =
                  rec.section === "lust" ? `${vpsBase}/${rec.slug}.webp` : rec.cover_url || null;

                return (
                  <TileCard
                    key={rec.id}
                    item={{
                      key: `${rec.section}-${rec.id}`,
                      id: rec.id,
                      section: rec.section,
                      slug: rec.slug,
                      code: rec.code,
                      name: rec.title,
                      kind: "FILM",
                      year: rec.year || 2026,
                      rating: 8.5,
                      posterUrl,
                      backdropUrl: posterUrl,
                      studios: rec.studios,
                      actors: rec.actors,
                      categories: rec.categories,
                      sourcesCount: rec.video_sources.length,
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
