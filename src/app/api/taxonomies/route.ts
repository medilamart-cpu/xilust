import { NextRequest, NextResponse } from "next/server";
import { getTaxonomies, type TaxonomyItem } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Studio names that should never appear in general Categories
const STUDIO_NAMES_IN_CATEGORIES = new Set([
  "bangbros",
  "naughtyamerica",
  "teamskeet",
  "brazzers",
  "realitykings",
  "21sextury",
  "mofos",
  "adulttime",
  "hotguysfuck",
  "pornpros",
  "spizoo",
  "evilangel",
  "vixen",
  "tushy",
  "blacked",
  "blackedraw",
  "deeper",
  "puretaboo",
  "julesjordan",
  "sweetheartvideo",
  "devilfilm",
  "devilsfilm",
  "digitalplayground",
  "twistys",
  "babes",
  "fakehub",
  "propertysex",
  "nubiles",
  "kink",
  "rkprime",
  "dontbreakme",
  "shessowild",
  "sexselector",
  "netgirl",
  "netvideogirls",
  "passionhd",
  "fantasyhd",
  "momxxx",
  "sislovesme",
  "mylf",
  "tiny4k",
  "lubed",
  "wetandpuffy",
  "brattysis",
  "swallowed",
  "darkx",
  "milfed",
  "porndoe",
  "blowjobfridays",
  "daughterswap",
  "reptylelabs",
  "householdfantasy",
  "brazzersexxtra",
  "50plusmilfs",
  "8kmilfs",
  "pervsonline",
  "teamfutanari",
  "letsdoeit",
  "czechav",
  "private",
  "wicked",
  "zerotolerance",
  "hustler",
  "penthouse",
  "elegance",
  "hardx",
  "eroticax",
  "archangel",
  "sensualjane",
  "dogfart",
  "blackdog",
  "interracialblowbang",
  "wetfood",
  "slimyfood",
  "firstanalquest",
  "cumclinic",
  "exploitedteens",
  "publicpickups",
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") as "lust" | "jax" | "fans") || "lust";
    const type = (searchParams.get("type") as "actor" | "studio" | "category" | "tag") || "actor";
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const search = searchParams.get("q") || searchParams.get("search") || "";

    // Fast-path: Check R2 edge cache for default taxonomies
    if (!search && limit <= 40) {
      try {
        const r2Url = `https://pub-2e7c05ee5cd1414784641924f34316da.r2.dev/taxonomies/${section}_${type}.json`;
        const r2Res = await fetch(r2Url, { next: { revalidate: 300 } });
        if (r2Res.ok) {
          const data = await r2Res.json();
          if (data && Array.isArray(data.items)) {
            return NextResponse.json(data, {
              headers: {
                "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
                "X-Taxonomy-Source": "r2",
              },
            });
          }
        }
      } catch {
        // Fall back gracefully
      }
    }

    let items = await getTaxonomies(section, type, type === "category" ? limit + 80 : limit, search);

    // Fans records currently have no performer metadata; the upstream Fans
    // taxonomy endpoint incorrectly aliases tags into its actor response.
    if (section === "fans" && type === "actor") items = [];
    if (section === "fans" && type === "studio") items = [];

    // Keep category, studio, and cast vocabularies distinct within each section.
    if (type === "category" || (section === "fans" && type === "tag")) {
      const [studios, actors] = await Promise.all([
        section === "fans" ? Promise.resolve([] as TaxonomyItem[]) : getTaxonomies(section, "studio", 500),
        type === "category" && section !== "fans" ? getTaxonomies(section, "actor", 500) : Promise.resolve([] as TaxonomyItem[]),
      ]);
      const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, "");
      const studioNames = new Set([
        ...Array.from(STUDIO_NAMES_IN_CATEGORIES, normalize),
        ...studios.map((item) => normalize(item.name)),
      ]);
      const actorNames = new Set(actors.map((item) => normalize(item.name)));
      items = items.filter((item) => {
        const name = normalize(item.name || item.slug || "");
        return Boolean(name) && !studioNames.has(name) && !actorNames.has(name);
      }).slice(0, limit);
    }

    return NextResponse.json(
      {
        section,
        type,
        items,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error: any) {
    console.error("API /api/taxonomies error:", error);
    return NextResponse.json({ error: error.message || "Failed to load taxonomies" }, { status: 500 });
  }
}
