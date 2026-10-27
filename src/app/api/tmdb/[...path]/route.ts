import { NextRequest, NextResponse } from "next/server";

/* Server-side TMDB proxy.
 * The API key lives ONLY in .env — the browser talks to /api/tmdb/*,
 * which forwards to api.themoviedb.org with the key injected. */

const TMDB_BASE = "https://api.themoviedb.org/3";

const ALLOWED_PREFIXES = [
  "trending/",
  "movie/",
  "tv/",
  "search/",
  "discover/",
  "genre/",
  "person/",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const tmdbPath = path.join("/");

  if (!ALLOWED_PREFIXES.some((p) => tmdbPath.startsWith(p))) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB key not configured" }, { status: 500 });
  }

  const url = new URL(`${TMDB_BASE}/${tmdbPath}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  url.searchParams.set("api_key", apiKey);

  try {
    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      next: { revalidate: 600 }, // cache TMDB responses for 10 min
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `TMDB ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  } catch {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 });
  }
}
