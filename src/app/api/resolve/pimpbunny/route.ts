import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const CATALOG_API_URL =
  process.env.CATALOG_API_URL ||
  "https://supervisor-demonstrated-rhythm-ignored.trycloudflare.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url") || "";
  const slug = searchParams.get("slug") || "";

  if (!targetUrl && !slug) {
    return NextResponse.json({ error: "Missing url or slug parameter" }, { status: 400 });
  }

  try {
    const resolverUrl = new URL("/api/resolve_pb", CATALOG_API_URL);
    if (slug) resolverUrl.searchParams.set("slug", slug);
    if (targetUrl) resolverUrl.searchParams.set("url", targetUrl);

    const res = await fetch(resolverUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Resolver error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to resolve stream" },
      { status: 500 }
    );
  }
}
