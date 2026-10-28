import { NextRequest, NextResponse } from "next/server";
import { queryItems, getTaxonomies } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") as "lust" | "jax") || "lust";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const category = searchParams.get("category") || undefined;
    const studio = searchParams.get("studio") || undefined;
    const actor = searchParams.get("actor") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const code = searchParams.get("code") || undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
    const query = searchParams.get("query") || searchParams.get("q") || undefined;
    const tab = (searchParams.get("tab") as any) || "trending";
    const sort = (searchParams.get("sort") as any) || undefined;

    const offset = (page - 1) * limit;

    const { items, total } = await queryItems({
      section,
      limit,
      offset,
      category: category && category !== "All" ? category : undefined,
      studio,
      actor,
      tag,
      code,
      year,
      query,
      tab,
      sort,
    });

    // Map to CardModel format
    const cards = items.map((item) => {
      let posterUrl: string | null = null;
      let backdropUrl: string | null = null;

      const vpsBase = process.env.NEXT_PUBLIC_THUMBS_CDN || "https://interventions-precision-stake-alternate.trycloudflare.com";
      if (item.section === "lust") {
        posterUrl = `${vpsBase}/${item.slug}.webp`;
        backdropUrl = `${vpsBase}/${item.slug}.webp`;
      } else {
        if (item.thumbnail_url) {
          const cleanThumb = item.thumbnail_url.startsWith("/") ? item.thumbnail_url : `/${item.thumbnail_url}`;
          posterUrl = `${vpsBase}${cleanThumb}`;
          backdropUrl = `${vpsBase}${cleanThumb}`;
        } else {
          posterUrl = item.cover_url || null;
          backdropUrl = item.cover_url || null;
        }
      }

      return {
        key: `${item.section}-${item.id}`,
        id: item.id,
        section: item.section,
        slug: item.slug,
        code: item.code,
        uploadedAt: item.published_at,
        name: item.title,
        kind: "FILM" as const,
        year: item.year || 2026,
        rating: Math.round(((item.views % 30) / 10 + 7.0) * 10) / 10,
        popularity: Math.max(item.views, 150),
        posterUrl,
        backdropUrl,
        fallbackUrl: item.cover_url || null,
        studios: item.studios,
        actors: item.actors,
        categories: item.categories,
        tags: item.tags,
        sourcesCount: item.video_sources.length,
      };
    });

    return NextResponse.json({
      section,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: cards,
    });
  } catch (error: any) {
    console.error("API /api/catalog error:", error);
    return NextResponse.json({ error: error.message || "Failed to load catalog" }, { status: 500 });
  }
}
