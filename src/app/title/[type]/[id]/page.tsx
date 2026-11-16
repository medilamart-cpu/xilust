import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Film, Server, Eye, Tag, Share2, Sparkles, AlertCircle, UserCheck } from "lucide-react";
import { getItemBySlug, queryItems, type CatalogItem } from "@/lib/catalog-db";
import { getCatalogThumbnailUrls } from "@/lib/catalog-thumbnail";
import { formatStudioLabel } from "@/lib/studio-label";
import { TileCard } from "@/components/aethoplex/PosterCard";
import { extractCleanTitleAndDate, formatVideoDuration, formatUploadDate } from "@/lib/video-utils";
import { TitleWatchClient } from "./TitleWatchClient";
import { BackButton } from "@/components/aethoplex/BackButton";
import { CommentSection } from "@/components/aethoplex/CommentSection";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const type = resolvedParams?.type;
  const rawId = resolvedParams?.id || "";
  const id = decodeURIComponent(rawId);
  const section = type === "jax" ? "jax" : type === "fans" ? "fans" : "lust";
  const item = await getItemBySlug(section, id);

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-[#080a0f] text-[#f4f5f8]">
        <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Lost signal</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
          This title drifted off-grid
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/60">
          We couldn&apos;t find the video page you were looking for. It may have been removed
          from the catalogue, or the link is out of date.
        </p>
        <Link
          href={`/?section=${section}`}
          className="cta-gradient focusable mt-8 flex h-11 items-center rounded-xl px-6 text-[14px] font-semibold transition"
        >
          Back to {section === "jax" ? "🌸 Jax" : section === "fans" ? "⭐ Fans" : "🔥 Lust"}
        </Link>
      </div>
    );
  }

  // Get similar recommendations from the same category, actor, or section (18+ videos)
  const category = item.categories[0];
  const actor = item.actors[0];
  const studio = item.studios[0];

  let recPool: any[] = [];
  if (category) {
    const catRes = await queryItems({
      section,
      category,
      limit: 24,
    }).catch(() => ({ items: [] }));
    recPool = catRes.items || [];
  }

  // Supplement with same model/actor if fewer than 20
  if (recPool.length < 20 && actor) {
    const cleanActor = actor.replace(/\s+[a-f0-9]{10,}$/i, "").trim();
    const actorRes = await queryItems({
      section,
      actor: cleanActor,
      limit: 20,
    }).catch(() => ({ items: [] }));
    const ids = new Set(recPool.map((r) => r.id));
    for (const it of actorRes.items || []) {
      if (!ids.has(it.id)) {
        recPool.push(it);
        ids.add(it.id);
      }
    }
  }

  // Supplement with same studio if still fewer than 20
  if (recPool.length < 20 && studio && section !== "fans") {
    const studioRes = await queryItems({
      section,
      studio,
      limit: 20,
    }).catch(() => ({ items: [] }));
    const ids = new Set(recPool.map((r) => r.id));
    for (const it of studioRes.items || []) {
      if (!ids.has(it.id)) {
        recPool.push(it);
        ids.add(it.id);
      }
    }
  }

  // Fill with latest popular releases from the same section if still fewer than 20
  if (recPool.length < 20) {
    const latestRes = await queryItems({
      section,
      limit: 24,
    }).catch(() => ({ items: [] }));
    const ids = new Set(recPool.map((r) => r.id));
    for (const it of latestRes.items || []) {
      if (!ids.has(it.id)) {
        recPool.push(it);
        ids.add(it.id);
      }
    }
  }

  // Exclude current video and take 18 recommendations
  const recs = recPool.filter((r) => r.id !== item.id && r.slug !== item.slug).slice(0, 18);

  const cleanstreamUrl =
    process.env.NEXT_PUBLIC_CLEANSTREAM_URL || "https://rick-use-previously-explicitly.trycloudflare.com";

  const { cleanTitle, originalYear, originalDate } = extractCleanTitleAndDate(item.title, item.year, section);
  const duration = formatVideoDuration(item.duration_seconds, item.title, item.id, section, item.categories, item.tags);
  const uploadDate = formatUploadDate(item.published_at);
  const jaxRating = section === "jax" ? Math.round(((item.views % 30) / 10 + 7.0) * 10) / 10 : null;

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8]">
      {/* Top back bar with safe-area support */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-xl px-3 sm:px-8 py-2.5 sm:py-3.5 pt-[calc(0.625rem+env(safe-area-inset-top))] flex items-center justify-between">
        <BackButton section={section} />

        <div className="flex items-center gap-1.5 sm:gap-2">
          {section === "jax" && item.code && (
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
        <div className="mt-5 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              {/* Minimalist Metadata Breadcrumb */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-2.5">
                {studio && (
                  <>
                    <Link
                      href={`/?section=${section}&studio=${encodeURIComponent(studio)}`}
                      className="font-bold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      {formatStudioLabel(studio)}
                    </Link>
                    <span className="text-zinc-600">·</span>
                  </>
                )}
                {originalYear && (
                  <>
                    <span className="font-medium text-zinc-300">{originalYear}</span>
                    <span className="text-zinc-600">·</span>
                  </>
                )}
                <span className="font-medium text-zinc-300 tabular-nums">{duration}</span>
                {originalDate && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">{originalDate}</span>
                  </>
                )}
                {section === "jax" && item.code && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <Link
                      href={`/?section=jax&code=${encodeURIComponent(item.code)}`}
                      className="rounded px-2 py-0.5 bg-pink-500/15 border border-pink-500/30 text-pink-300 font-mono font-bold text-[11px] hover:bg-pink-500/25 transition-all"
                    >
                      {item.code}
                    </Link>
                  </>
                )}
                {jaxRating && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="flex items-center gap-1 font-semibold text-amber-300">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{jaxRating}</span>
                    </span>
                  </>
                )}
                <span className="text-zinc-600">·</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  CleanStream Ad-Free
                </span>
              </div>

              {/* Pure High-Impact Cinema Title */}
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight">
                {cleanTitle}
              </h1>
            </div>

            {/* Performers / Cast (Clean chips without emoji noise) */}
            {item.actors.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                  Starring:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.actors.map((actor, idx) => {
                    const cleanActor = actor.replace(/\s+[a-f0-9]{10,}$/i, "").trim();
                    const actorSlug = cleanActor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "performer";
                    return (
                      <Link
                        key={idx}
                        href={`/browse/actor/${encodeURIComponent(actorSlug)}?section=${section}&name=${encodeURIComponent(cleanActor)}`}
                        className="inline-flex items-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-white transition-all active:scale-95"
                      >
                        <span>{cleanActor}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Studios & Labels */}
            {section !== "fans" && item.studios.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                  Studio:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.studios.map((s, idx) => (
                    <Link
                      key={idx}
                      href={`/?section=${section}&studio=${encodeURIComponent(s)}`}
                      className="inline-flex items-center rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 px-3 py-1 text-xs font-medium text-purple-200 hover:text-white transition-all active:scale-95"
                    >
                      <span>{formatStudioLabel(s)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories & Genres */}
            {item.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.categories.map((cat, idx) => (
                  <Link
                    key={idx}
                    href={`/?section=${section}&category=${encodeURIComponent(cat)}`}
                    className="rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white transition-all"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}

            {/* Post Comments Section */}
            <div className="pt-4 border-t border-white/[0.08]">
              <CommentSection postSlug={item.slug || rawId} section={section} postTitle={item.title} />
            </div>
          </div>

          {/* Right Rail: Up Next Preview Rail (YouTube / Netflix Theater style) */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#0e121a]/80 border border-white/[0.08] p-4 space-y-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Up Next</span>
                </h3>
                <span className="text-[11px] text-zinc-500">Related releases</span>
              </div>

              {/* Up Next Compact Video List */}
              <div className="space-y-2.5">
                {recs.slice(0, 5).map((rec) => {
                  const vpsBase = process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org";
                  const { posterUrl, fallbackUrl } = getCatalogThumbnailUrls(rec, vpsBase);
                  const { cleanTitle: recTitle } = extractCleanTitleAndDate(rec.title, rec.year, rec.section);
                  const recDuration = formatVideoDuration(rec.duration_seconds, rec.title, rec.id, rec.section);
                  const recHref = `/title/${rec.section}/${encodeURIComponent(rec.slug || rec.id)}`;

                  return (
                    <Link
                      key={rec.id}
                      href={recHref}
                      className="group flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/[0.06] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1"
                    >
                      <div className="relative aspect-video w-28 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-black border border-white/10 shadow-sm">
                        <img
                          src={posterUrl || fallbackUrl || ""}
                          alt={recTitle}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                          loading="lazy"
                        />
                        {recDuration && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px] font-bold text-white tabular-nums">
                            {recDuration}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors leading-snug">
                          {recTitle}
                        </p>
                        {rec.studios && rec.studios.length > 0 && (
                          <p className="mt-1 text-[11px] font-semibold text-zinc-500 truncate">
                            {formatStudioLabel(rec.studios[0])}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Details Card */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-xs text-zinc-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>Available Streams</span>
                <span className="font-semibold text-cyan-400">{item.video_sources.length} mirrors</span>
              </div>
              {uploadDate && (
                <div className="flex items-center justify-between">
                  <span>Uploaded to XiLust</span>
                  <span className="text-zinc-300">{uploadDate}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Direct Host Ads</span>
                <span className="font-semibold text-emerald-400">Blocked by Proxy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Row */}
        {recs.length > 0 && (
          <div className="mt-12 sm:mt-16 border-t border-white/10 pt-8 sm:pt-10">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight">More Like This</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {recs.map((rec) => {
                const vpsBase =
                  process.env.NEXT_PUBLIC_THUMBS_CDN ||
                  "https://xithumbs.duckdns.org";
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
