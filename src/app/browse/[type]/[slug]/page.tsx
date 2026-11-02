import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, Flame, Shuffle, Film, UserCheck } from "lucide-react";
import { getTaxonomies, queryItems, type CatalogItem } from "@/lib/catalog-db";
import { getCatalogThumbnailUrls } from "@/lib/catalog-thumbnail";
import { formatStudioLabel } from "@/lib/studio-label";
import { TaxonomyThumbnail } from "@/components/aethoplex/TaxonomyThumbnail";
import { TileCard, MyListProvider, type CardModel } from "@/components/aethoplex/PosterCard";

type TaxonomyType = "category" | "actor" | "studio" | "tag";
const PAGE_SIZE = 60;

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function TaxonomyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ section?: string; name?: string; page?: string; subfilter?: string; sort?: string }>;
}) {
  const { type: rawType, slug } = await params;
  const { section: rawSection, name: rawName, page: rawPage, subfilter, sort: rawSort } = await searchParams;
  if (!["category", "actor", "studio", "tag"].includes(rawType)) notFound();
  const type = rawType as TaxonomyType;
  const section = rawSection === "jax" || rawSection === "fans" ? rawSection : "lust";
  if (type === "studio" && section === "fans") notFound();

  const sort = rawSort === "top" || rawSort === "random" || rawSort === "new" ? rawSort : "new";
  const requestedName = rawName || decodeURIComponent(slug).replace(/-/g, " ");
  const candidates = await getTaxonomies(section, type, 100, requestedName);
  const taxonomy = candidates.find((entry) =>
    entry.name.toLowerCase() === requestedName.toLowerCase() ||
    entry.slug.toLowerCase() === slug.toLowerCase() ||
    entry.name.toLowerCase().replace(/[\s-]/g, "") === slug.toLowerCase().replace(/[\s-]/g, "")
  );
  const name = taxonomy?.name || requestedName;
  const page = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);

  const result = await queryItems({
    section,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    tab: sort,
    ...(type === "category" ? { category: name } : {}),
    ...(type === "actor" ? { actor: name } : {}),
    ...(type === "studio" ? { studio: name } : {}),
    ...(type === "tag" ? { tag: name } : {}),
    ...(section === "jax" && (type === "actor" || type === "studio") && ["uncensored", "4k", "subbed"].includes(subfilter || "") ? { subfilter } : {}),
  });

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const vpsBase = process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org";

  const cards: CardModel[] = result.items.map((item: CatalogItem) => {
    const thumbs = getCatalogThumbnailUrls(item, vpsBase);
    return {
      key: item.section + "-" + item.id,
      id: item.id,
      section: item.section,
      slug: item.slug,
      code: item.code,
      name: item.title,
      kind: "FILM",
      year: item.year || 2026,
      rating: 0,
      uploadedAt: item.published_at,
      posterUrl: thumbs.posterUrl,
      backdropUrl: thumbs.posterUrl,
      fallbackUrl: thumbs.fallbackUrl,
      studios: item.studios,
      actors: item.actors,
      categories: item.categories,
      tags: item.tags,
      sourcesCount: item.video_sources.length,
      durationSeconds: item.duration_seconds ?? null,
    };
  });

  const title = type === "studio" ? formatStudioLabel(name) : name;
  const base = "/browse/" + type + "/" + encodeURIComponent(slug) + "?section=" + section + "&name=" + encodeURIComponent(name);
  const hrefFor = (nextPage: number, nextFilter?: string, nextSort?: string) => {
    const filterVal = nextFilter !== undefined ? nextFilter : (subfilter || "");
    const sortVal = nextSort !== undefined ? nextSort : sort;
    let url = base + "&page=" + nextPage;
    if (sortVal) url += "&sort=" + encodeURIComponent(sortVal);
    if (filterVal) url += "&subfilter=" + encodeURIComponent(filterVal);
    return url;
  };

  // Profile image for model pages:
  // 1. Scraped headshot from /thumbs/fans/models/{slug}.webp (522+ models)
  // 2. Fallback to newest video cover artwork
  const cleanModelSlug = (taxonomy?.slug || slug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const modelHeadshot = type === "actor" ? `${vpsBase}/thumbs/fans/models/${cleanModelSlug}.webp` : null;
  const latestThumb = type === "actor" && result.items[0] ? getCatalogThumbnailUrls(result.items[0], vpsBase) : null;
  const profileImage = modelHeadshot || latestThumb?.posterUrl || null;
  const profileFallback = latestThumb?.posterUrl || latestThumb?.fallbackUrl || null;

  const sectionBadge = type === "actor"
    ? (section === "jax" ? "JAX AV MODEL" : section === "fans" ? "VERIFIED CREATOR" : "LUST MODEL")
    : section.toUpperCase();

  return (
    <MyListProvider>
      <main className="min-h-screen bg-[#080a0f] px-3 py-6 pb-20 text-[#f4f5f8] sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Navigation Breadcrumb Links */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={"/?section=" + section}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs sm:text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Home ({section.toUpperCase()})
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href={"/browse/" + type + "?section=" + section}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs sm:text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              All {type === "actor" ? "models" : "studios"}
            </Link>
          </div>

          {/* Profile / Studio Header */}
          {type === "actor" ? (
            <div className="relative mt-6 flex flex-col items-center text-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
              {/* Center Model Portrait (horizontal for fans, portrait card for jax/lust) */}
              <div className={`relative overflow-hidden border-2 border-white/20 bg-gradient-to-b from-[#181d27] to-[#0b0e14] shadow-2xl ring-4 ring-white/5 ${
                section === "fans"
                  ? "w-64 sm:w-80 md:w-96 aspect-[16/10] rounded-2xl"
                  : "w-36 h-48 sm:w-44 sm:h-56 md:w-52 md:h-64 rounded-2xl"
              }`}>
                {profileImage || profileFallback ? (
                  <TaxonomyThumbnail
                    src={profileImage}
                    fallbackSrc={profileFallback}
                    alt={name}
                    fallbackLabel={name}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-black text-white/30">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Model Name & Badge */}
              <div className="mt-4 sm:mt-5 flex flex-col items-center max-w-xl">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${
                  section === "jax"
                    ? "bg-pink-500/15 border border-pink-500/30 text-pink-200"
                    : section === "fans"
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-200"
                      : "bg-purple-500/15 border border-purple-500/30 text-purple-200"
                }`}>
                  <span className="text-sm">💋</span>
                  <span>{sectionBadge}</span>
                </span>

                <h1 className="mt-2.5 text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {title}
                </h1>

                <p className="mt-1.5 text-xs sm:text-sm font-medium text-white/50">
                  {result.total.toLocaleString()} {result.total === 1 ? "Video" : "Videos"} Available
                </p>
              </div>
            </div>
          ) : (
            <div className="relative mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-purple-400">
                    <Film className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80">
                      {section.toUpperCase()} STUDIO
                    </span>
                    <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">{title}</h1>
                    <p className="mt-0.5 text-xs sm:text-sm text-white/50 font-medium">
                      {result.total.toLocaleString()} {result.total === 1 ? "Video" : "Videos"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls: Sorting Bar + JAX subfilters */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            {/* Sorting Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold overflow-x-auto no-scrollbar touch-scroll">
              <Link
                href={hrefFor(1, subfilter, "new")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  sort === "new"
                    ? "bg-white text-black shadow-md font-extrabold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Recent</span>
              </Link>

              <Link
                href={hrefFor(1, subfilter, "top")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  sort === "top"
                    ? "bg-white text-black shadow-md font-extrabold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Most Viewed</span>
              </Link>

              <Link
                href={hrefFor(1, subfilter, "random")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  sort === "random"
                    ? "bg-white text-black shadow-md font-extrabold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Random</span>
              </Link>
            </div>

            {/* JAX Video Format Filters */}
            {section === "jax" && (type === "actor" || type === "studio") && (
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter Jax videos">
                {(["uncensored", "4k", "subbed"] as const).map((filter) => (
                  <Link
                    key={filter}
                    href={hrefFor(1, subfilter === filter ? "" : filter, sort)}
                    aria-current={subfilter === filter ? "true" : undefined}
                    className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-semibold capitalize transition ${
                      subfilter === filter
                        ? "border-pink-300/50 bg-pink-500/20 text-pink-100"
                        : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white"
                    }`}
                  >
                    {filter === "4k" ? "4K UHD" : filter}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Video Cards Grid: single column for models, responsive grid for studios */}
          {cards.length ? (
            <>
              {type === "actor" ? (
                <div className="mt-8 mx-auto max-w-2xl flex flex-col gap-6">
                  {cards.map((item) => (
                    <TileCard key={item.key} item={item} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {cards.map((item) => (
                    <TileCard key={item.key} item={item} />
                  ))}
                </div>
              )}

              {/* Pagination Controls only if exceeds single page size */}
              {totalPages > 1 && (
                <nav aria-label="Browse pagination" className="mt-10 flex items-center justify-center gap-4">
                  <Link
                    aria-disabled={page <= 1}
                    href={hrefFor(Math.max(1, page - 1), subfilter, sort)}
                    className={"inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-sm font-semibold transition hover:bg-white/10 " + (page <= 1 ? "pointer-events-none opacity-40" : "")}
                  >
                    Previous
                  </Link>
                  <span aria-live="polite" className="text-sm font-medium text-white/60">
                    {page} / {totalPages}
                  </span>
                  <Link
                    aria-disabled={page >= totalPages}
                    href={hrefFor(Math.min(totalPages, page + 1), subfilter, sort)}
                    className={"inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-sm font-semibold transition hover:bg-white/10 " + (page >= totalPages ? "pointer-events-none opacity-40" : "")}
                  >
                    Next
                  </Link>
                </nav>
              )}
            </>
          ) : (
            <p className="py-16 text-center text-sm text-white/50">No videos found for this {type}.</p>
          )}
        </div>
      </main>
    </MyListProvider>
  );
}
