import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getTaxonomies, queryItems, type TaxonomyItem } from "@/lib/catalog-db";
import { getCatalogThumbnailUrls } from "@/lib/catalog-thumbnail";
import { formatStudioLabel } from "@/lib/studio-label";
import { TaxonomyThumbnail } from "@/components/aethoplex/TaxonomyThumbnail";

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
  const pageTitle = type === "actor" ? (section === "jax" ? "Actresses" : section === "fans" ? "Creators" : "Pornstars") : titles[type];
  let items = section === "fans" && (type === "actor" || type === "studio") ? [] : await getTaxonomies(section, type, 100, q);
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
  const previews = await Promise.all(items.slice(0, 12).map(async (entry: TaxonomyItem) => {
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

  return (
    <main className="min-h-screen bg-[#080a0f] px-3 py-8 pb-20 text-[#f4f5f8] sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/xilust" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Xilust home
        </Link>
        <div className="mt-6 border-b border-white/10 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">{section.toUpperCase()}</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-white/50">Browse {pageTitle.toLowerCase()} and recent releases.</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["lust", "jax", "fans"] as const).map((brand) => (
            <Link key={brand} href={"/browse/" + type + "?section=" + brand} aria-current={section === brand ? "page" : undefined} className={"inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-semibold uppercase transition " + (section === brand ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white")}>
              {brand}
            </Link>
          ))}
        </div>
        <form action={"/browse/" + type} method="get" className="mt-4 flex max-w-xl gap-2">
          <input type="hidden" name="section" value={section} />
          <label className="sr-only" htmlFor="taxonomy-search">Search {pageTitle}</label>
          <input id="taxonomy-search" name="q" defaultValue={q} placeholder={"Search " + pageTitle.toLowerCase()} className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-300/50" />
          <button type="submit" className="min-h-11 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/15">Search</button>
        </form>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {featured.map(({ entry, video }) => {
            const image = video ? getCatalogThumbnailUrls(video, process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org") : { posterUrl: null, fallbackUrl: null };
            return (
              <Link key={entry.id} href={"/browse/" + type + "/" + encodeURIComponent(entry.slug) + "?section=" + section + "&name=" + encodeURIComponent(entry.name)} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] transition hover:border-cyan-300/35 hover:bg-white/[0.06]">
                <div className="relative aspect-video overflow-hidden bg-[#111620]">
                  {image.posterUrl || image.fallbackUrl ? <TaxonomyThumbnail src={image.posterUrl} fallbackSrc={image.fallbackUrl} alt="" fallbackLabel={entry.name} /> : <div className="flex h-full items-center justify-center text-2xl text-white/30">{entry.name.slice(0, 1).toUpperCase()}</div>}
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
        {featured.length === 0 && <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] p-5 text-sm text-white/55">{section === "fans" && type === "studio" ? "Fans catalog entries do not include studio labels." : section === "fans" && type === "actor" ? "Fans catalog entries do not include creator names yet." : "No matches found."}</p>}
      </div>
    </main>
  );
}
