import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTaxonomies, queryItems, type CatalogItem } from "@/lib/catalog-db";
import { getCatalogThumbnailUrls } from "@/lib/catalog-thumbnail";
import { formatStudioLabel } from "@/lib/studio-label";
import { TileCard, type CardModel } from "@/components/aethoplex/PosterCard";

type TaxonomyType = "category" | "actor" | "studio" | "tag";
const PAGE_SIZE = 20;

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function TaxonomyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ section?: string; name?: string; page?: string; subfilter?: string }>;
}) {
  const { type: rawType, slug } = await params;
  const { section: rawSection, name: rawName, page: rawPage, subfilter } = await searchParams;
  if (!["category", "actor", "studio", "tag"].includes(rawType)) notFound();
  const type = rawType as TaxonomyType;
  const section = rawSection === "jax" || rawSection === "fans" ? rawSection : "lust";
  if (type === "studio" && section === "fans") notFound();
  const requestedName = rawName || decodeURIComponent(slug);
  const candidates = await getTaxonomies(section, type, 100, requestedName);
  const taxonomy = candidates.find((entry) => entry.name === requestedName || entry.slug === slug);
  const name = taxonomy?.name || requestedName;
  const page = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);
  const result = await queryItems({
    section,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    tab: "new",
    ...(type === "category" ? { category: name } : {}),
    ...(type === "actor" ? { actor: name } : {}),
    ...(type === "studio" ? { studio: name } : {}),
    ...(type === "tag" ? { tag: name } : {}),
    ...(section === "jax" && (type === "actor" || type === "studio") && ["uncensored", "4k", "subbed"].includes(subfilter || "") ? { subfilter } : {}),
  });
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const cards: CardModel[] = result.items.map((item: CatalogItem) => {
    const thumbs = getCatalogThumbnailUrls(item, process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org");
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
      sourcesCount: item.video_sources.length,
      durationSeconds: item.duration_seconds ?? null,
    };
  });
  const title = type === "studio" ? formatStudioLabel(name) : name;
  const base = "/browse/" + type + "/" + encodeURIComponent(slug) + "?section=" + section + "&name=" + encodeURIComponent(name);
  const hrefFor = (nextPage: number, nextFilter = subfilter) => base + "&page=" + nextPage + (nextFilter ? "&subfilter=" + nextFilter : "");

  return (
    <main className="min-h-screen bg-[#080a0f] px-3 py-8 pb-20 text-[#f4f5f8] sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href={"/browse/" + type + "?section=" + section} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All {type === "actor" ? "performers" : type + "s"}
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">{section.toUpperCase()}</p><h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-white/50">{result.total.toLocaleString()} videos</p></div>
          {section === "jax" && (type === "actor" || type === "studio") && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter Jax videos">
              {(["uncensored", "4k", "subbed"] as const).map((filter) => (
                <Link key={filter} href={hrefFor(1, subfilter === filter ? undefined : filter)} aria-current={subfilter === filter ? "true" : undefined} className={"inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-semibold " + (subfilter === filter ? "border-pink-300/50 bg-pink-500/20 text-pink-100" : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white")}>{filter === "4k" ? "4K" : filter}</Link>
              ))}
            </div>
          )}
        </div>
        {cards.length ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">{cards.map((item) => <TileCard key={item.key} item={item} />)}</div>
            {totalPages > 1 && <nav aria-label="Browse pagination" className="mt-8 flex items-center justify-center gap-4">
              <Link aria-disabled={page <= 1} href={hrefFor(Math.max(1, page - 1))} className={"inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-sm " + (page <= 1 ? "pointer-events-none opacity-40" : "")}>Previous</Link>
              <span aria-live="polite" className="text-sm text-white/60">{page} / {totalPages}</span>
              <Link aria-disabled={page >= totalPages} href={hrefFor(Math.min(totalPages, page + 1))} className={"inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-sm " + (page >= totalPages ? "pointer-events-none opacity-40" : "")}>Next</Link>
            </nav>}
          </>
        ) : <p className="py-16 text-center text-sm text-white/50">No videos found for this {type}.</p>}
      </div>
    </main>
  );
}
