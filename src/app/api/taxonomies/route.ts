import { NextRequest, NextResponse } from "next/server";
import { getTaxonomies } from "@/lib/catalog-db";

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
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") as "lust" | "jax") || "lust";
    const type = (searchParams.get("type") as "actor" | "studio" | "category" | "tag") || "actor";
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const search = searchParams.get("q") || searchParams.get("search") || "";

    let items = await getTaxonomies(section, type, type === "category" ? limit + 25 : limit, search);

    // Remove studio names from the general categories section
    if (type === "category") {
      items = items.filter((item) => {
        const cleanSlug = (item.slug || item.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return !STUDIO_NAMES_IN_CATEGORIES.has(cleanSlug);
      }).slice(0, limit);
    }

    return NextResponse.json({
      section,
      type,
      items,
    });
  } catch (error: any) {
    console.error("API /api/taxonomies error:", error);
    return NextResponse.json({ error: error.message || "Failed to load taxonomies" }, { status: 500 });
  }
}
