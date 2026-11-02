import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, X } from "lucide-react";
import { getTaxonomies, queryItems, type TaxonomyItem } from "@/lib/catalog-db";
import { getCatalogThumbnailUrls } from "@/lib/catalog-thumbnail";
import { formatStudioLabel } from "@/lib/studio-label";
import { TaxonomyThumbnail } from "@/components/aethoplex/TaxonomyThumbnail";
import { MyListProvider } from "@/components/aethoplex/PosterCard";

type TaxonomyType = "category" | "actor" | "studio" | "tag";
const titles: Record<TaxonomyType, string> = {
  category: "Categories",
  actor: "Pornstars & Actresses",
  studio: "Studios",
  tag: "Tags",
};

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function TaxonomyIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ section?: string; q?: string }>;
}) {
  const { type: rawType } = await params;
  const { section: rawSection, q = "" } = await searchParams;
  if (!["category", "actor", "studio", "tag"].includes(rawType)) notFound();
  const type = rawType as TaxonomyType;
  const section = rawSection === "jax" || rawSection === "fans" ? rawSection : "lust";
  const isActor = type === "actor";
  const pageTitle = isActor
    ? (section === "jax" ? "AV Actresses & Idols" : section === "fans" ? "Creators & Leaks" : "Pornstars & Models")
    : titles[type];
  const sectionBadge = isActor
    ? (section === "jax" ? "💋 JAX AV MODELS" : section === "fans" ? "💋 VERIFIED CREATORS" : "💋 WESTERN MODELS")
    : section.toUpperCase();
  const pageSubtitle = isActor
    ? (section === "jax"
        ? "Browse Japanese adult video performers, exclusive idol debuts, and full video series."
        : section === "fans"
          ? "Browse verified creator profiles, OnlyFans leaks, and premium video channels."
          : "Browse top-ranked Western pornstars, studio models, and complete scene filmographies.")
    : `Browse ${pageTitle.toLowerCase()} and recent releases.`;

  let items = section === "fans" && type === "studio" ? [] : await getTaxonomies(section, type, 100, q);
  if (type === "category") {
    const [studios, actors] = await Promise.all([
      section === "fans" ? Promise.resolve([] as TaxonomyItem[]) : getTaxonomies(section, "studio", 500),
      section === "fans" ? Promise.resolve([] as TaxonomyItem[]) : getTaxonomies(section, "actor", 500),
    ]);
    const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, "");
    const knownStudios = ["bangbros", "naughtyamerica", "teamskeet", "brazzers", "realitykings", "21sextury", "mofos", "adulttime", "hotguysfuck", "pornpros", "spizoo", "evilangel", "vixen", "tushy", "blacked", "blackedraw", "deeper", "puretaboo", "julesjordan", "sweetheartvideo", "devilsfilm", "digitalplayground", "twistys", "fakehub", "propertysex", "nubiles", "rkprime", "netvideogirls", "passionhd", "fantasyhd", "momxxx", "sislovesme", "mylf", "tiny4k", "lubed", "wetandpuffy", "swallowed", "darkx", "milfed", "porndoe", "brazzersexxtra", "private", "wicked", "zerotolerance", "hustler", "penthouse", "hardx", "dogfart", "blackdog", "cumclinic", "exploitedteens", "publicpickups"];
    const separateNames = new Set([...knownStudios.map(normalize), ...studios.map((item) => normalize(item.name)), ...actors.map((item) => normalize(item.name))]);
    items = items.filter((item) => !separateNames.has(normalize(item.name || item.slug || "")));
  }

  // Fetch preview images (bounded to stay under edge subrequest limits)
  const previewCount = Math.min(items.length, 36);
  const previews = await Promise.all(items.slice(0, previewCount).map(async (entry: TaxonomyItem) => {
    const result = await queryItems({
      section,
      limit: 1,
      tab: "new",
      ...(type === "category" ? { category: entry.name } : {}),
      ...(type === "actor" ? { actor: entry.name } : {}),
      ...(type === "studio" ? { studio: entry.name } : {}),
      ...(type === "tag" ? { tag: entry.name } : {}),
    });
    return [entry.slug, result.items[0]] as const;
  }));
  const previewBySlug = new Map(previews);
  const featured = items.map((entry) => ({ entry, video: previewBySlug.get(entry.slug) }));

  const activePillStyle = (brand: string) => {
    if (section !== brand) return "border-white/10 bg-white/[0.03] text-white/55 hover:text-white";
    if (brand === "jax") return "border-pink-500/50 bg-pink-500/20 text-pink-100 shadow-md shadow-pink-500/20";
    if (brand === "fans") return "border-cyan-400/50 bg-cyan-400/20 text-cyan-100 shadow-md shadow-cyan-500/20";
    return "border-purple-500/50 bg-purple-500/20 text-purple-100 shadow-md shadow-purple-500/20";
  };

  const cardBorderHover = section === "jax"
    ? "hover:border-pink-400/60 hover:shadow-[0_8px_24px_rgba(244,114,182,0.18)]"
    : section === "fans"
      ? "hover:border-cyan-400/60 hover:shadow-[0_8px_24px_rgba(6,182,212,0.18)]"
      : "hover:border-purple-400/60 hover:shadow-[0_8px_24px_rgba(168,85,247,0.18)]";

  return (
    <MyListProvider>
      <main className="min-h-screen bg-[#080a0f] px-3 py-8 pb-20 text-[#f4f5f8] sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href={"/?section=" + section} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Home ({section.toUpperCase()})
          </Link>
          <div className="mt-6 border-b border-white/10 pb-4">
            <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${section === "jax" ? "text-pink-300/85" : section === "fans" ? "text-cyan-300/85" : "text-purple-300/85"}`}>{sectionBadge}</p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{pageTitle}</h1>
            <p className="mt-1 text-sm text-white/50">{pageSubtitle}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(type === "studio" ? (["lust", "jax"] as const) : (["lust", "jax", "fans"] as const)).map((brand) => (
              <Link key={brand} href={"/browse/" + type + "?section=" + brand} aria-current={section === brand ? "page" : undefined} className={"inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-semibold uppercase transition " + activePillStyle(brand)}>
                {brand}
              </Link>
            ))}
          </div>
          <form action={"/browse/" + type} method="get" className="mt-4 flex max-w-xl items-center gap-2">
            <input type="hidden" name="section" value={section} />
            <label className="sr-only" htmlFor="taxonomy-search">Search {pageTitle}</label>
            <input id="taxonomy-search" name="q" defaultValue={q} placeholder={"Search " + pageTitle.toLowerCase()} className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-300/50" />
            <button type="submit" className="min-h-11 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/15">Search</button>
            {q && (
              <Link href={"/browse/" + type + "?section=" + section} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/60 hover:text-white">
                <X className="h-3.5 w-3.5" /> Clear
              </Link>
            )}
          </form>
        {isActor ? (
          /* Models layout: portrait cards for JAX & Lust, horizontal cards for Fans */
          <div className={`mt-6 grid gap-3 sm:gap-4 ${
            section === "fans"
              ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          }`}>
            {featured.map(({ entry, video }) => {
              const vpsBase = process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org";
              const modelSlug = (entry.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
              const creatorAvatar = `${vpsBase}/thumbs/${section}/models/${modelSlug}.webp`;
              const image = video ? getCatalogThumbnailUrls(video, vpsBase) : { posterUrl: null, fallbackUrl: null };
              const primaryPoster = creatorAvatar || image.posterUrl;
              const fallbackPoster = creatorAvatar ? (image.posterUrl || image.fallbackUrl) : image.fallbackUrl;
              return (
                <Link key={entry.id} href={"/browse/" + type + "/" + encodeURIComponent(entry.slug) + "?section=" + section + "&name=" + encodeURIComponent(entry.name)} className={"group overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] transition " + cardBorderHover}>
                  <div className={`relative overflow-hidden bg-gradient-to-b from-[#12161f] to-[#0b0e14] ${
                    section === "fans" ? "aspect-[16/10] sm:aspect-[4/3]" : "aspect-[3/4]"
                  }`}>
                    {primaryPoster || fallbackPoster ? (
                      <TaxonomyThumbnail src={primaryPoster} fallbackSrc={fallbackPoster} alt="" fallbackLabel={entry.name} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-white/25">{entry.name.slice(0, 1).toUpperCase()}</div>
                    )}
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">{entry.count.toLocaleString()} videos</span>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1.5 px-2.5 pb-2">
                      <span className="min-w-0 truncate text-xs font-bold text-white/95">{entry.name}</span>
                      <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${section === "jax" ? "text-pink-300/80" : section === "fans" ? "text-cyan-300/80" : "text-purple-300/80"}`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Categories / Studios / Tags: landscape video-style cards */
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {featured.map(({ entry, video }) => {
              const vpsBase = process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org";
              const image = video ? getCatalogThumbnailUrls(video, vpsBase) : { posterUrl: null, fallbackUrl: null };
              const primaryPoster = image.posterUrl;
              const fallbackPoster = image.fallbackUrl;
              return (
                <Link key={entry.id} href={"/browse/" + type + "/" + encodeURIComponent(entry.slug) + "?section=" + section + "&name=" + encodeURIComponent(entry.name)} className={"group overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] transition " + cardBorderHover}>
                  <div className="relative aspect-video overflow-hidden bg-[#111620]">
                    {primaryPoster || fallbackPoster ? <TaxonomyThumbnail src={primaryPoster} fallbackSrc={fallbackPoster} alt="" fallbackLabel={entry.name} /> : <div className="flex h-full items-center justify-center text-2xl text-white/30">{entry.name.slice(0, 1).toUpperCase()}</div>}
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/70">{entry.count.toLocaleString()} videos</span>
                  </div>
                  <div className="flex min-h-12 items-center justify-between gap-2 px-3 py-2">
                    <span className="min-w-0 truncate text-xs font-semibold text-white/85">{type === "studio" ? formatStudioLabel(entry.name) : entry.name}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-cyan-300/70" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {featured.length === 0 && <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] p-5 text-sm text-white/55">{section === "fans" && type === "studio" ? "Fans catalog entries do not include studio labels." : "No matches found."}</p>}
      </div>
    </main>
  </MyListProvider>
);
}
