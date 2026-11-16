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
      signal: AbortSignal.timeout(15000),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      const text = await res.text();
      data = { error: text || `Resolver returned status ${res.status}` };
    }

    if (!res.ok) {
      return NextResponse.json(data, {
        status: res.status,
        headers: { "Cache-Control": "no-cache" }
      });
    }

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
