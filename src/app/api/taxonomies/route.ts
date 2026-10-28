import { NextRequest, NextResponse } from "next/server";
import { getTaxonomies } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") as "lust" | "jax") || "lust";
    const type = (searchParams.get("type") as "actor" | "studio" | "category" | "tag") || "actor";
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const search = searchParams.get("q") || searchParams.get("search") || "";

    const items = await getTaxonomies(section, type, limit, search);

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
