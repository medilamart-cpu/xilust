import { NextRequest, NextResponse } from "next/server";
import { queryItems, getTaxonomies } from "@/lib/catalog-db";
import { PREMIUM_LUST_STUDIOS } from "@/lib/premium-studios";
import { getCatalogThumbnailUrls } from "@/lib/catalog-thumbnail";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") as "lust" | "jax" | "fans") || "lust";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const category = searchParams.get("category") || undefined;
    const studio = searchParams.get("studio") || undefined;
    const actor = searchParams.get("actor") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const code = searchParams.get("code") || undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
    const query = searchParams.get("query") || searchParams.get("q") || undefined;
    const tab = (searchParams.get("tab") as any) || "trending";
    const sort = (searchParams.get("sort") as any) || undefined;
    const movies = searchParams.get("movies") === "1";
    const longform = searchParams.get("longform") === "1";
    const subfilter = searchParams.get("subfilter") || undefined;

    const offset = (page - 1) * limit;

    const premium = section === "lust" && searchParams.get("premium") === "1";
    let items;
    let total;

    if (premium) {
      const studioResults = await Promise.all(
        PREMIUM_LUST_STUDIOS.map((premiumStudio) =>
          queryItems({
            section: "lust",
            studio: premiumStudio,
            limit: 100,
            offset: 0,
            tab: tab === "random" ? "new" : tab,
            sort,
          }),
        ),
      );
      const uniqueItems = new Map<number, (typeof studioResults)[number]["items"][number]>();
      for (const result of studioResults) {
        for (const item of result.items) uniqueItems.set(item.id, item);
      }
      items = Array.from(uniqueItems.values());

      const popularFirst = tab === "top" || tab === "trending" || sort === "popular" || sort === "views";
      if (popularFirst) {
        items.sort((a, b) => b.views - a.views || (b.year || 0) - (a.year || 0) || b.id - a.id);
      } else if (tab === "random") {
        for (let i = items.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }
      } else {
        items.sort(
          (a, b) =>
            (b.year || 0) - (a.year || 0) ||
            b.published_at.localeCompare(a.published_at) ||
            b.id - a.id,
        );
      }
      total = items.length;
    } else {
      const result = await queryItems({
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
        movies,
        longform,
        subfilter,
      });
      items = result.items;
      total = result.total;
    }

    // Map to CardModel format
    const cards = items.map((item) => {
      const vpsBase = process.env.NEXT_PUBLIC_THUMBS_CDN || "https://xithumbs.duckdns.org";
      const { posterUrl, fallbackUrl } = getCatalogThumbnailUrls(item, vpsBase);
      const backdropUrl = posterUrl;

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
        fallbackUrl,
        studios: item.studios,
        actors: item.actors,
        categories: item.categories,
        tags: item.tags,
        sourcesCount: item.video_sources.length,
        durationSeconds: item.duration_seconds ?? null,
      };
    });

    const isCacheable = !query && !code && tab !== "random";
    const cacheControl = isCacheable
      ? "public, max-age=60, s-maxage=120, stale-while-revalidate=600"
      : "no-store";

    return NextResponse.json(
      {
        section,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        items: cards,
      },
      {
        headers: {
          "Cache-Control": cacheControl,
        },
      }
    );
  } catch (error: any) {
    console.error("API /api/catalog error:", error);
    return NextResponse.json({ error: error.message || "Failed to load catalog" }, { status: 500 });
  }
}
