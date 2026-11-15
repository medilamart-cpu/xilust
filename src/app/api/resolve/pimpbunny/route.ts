import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url") || "";
  const slug = searchParams.get("slug") || "";

  let videoPageUrl = targetUrl;
  if (!videoPageUrl && slug) {
    videoPageUrl = `https://pimpbunny.com/videos/${slug}/`;
  }

  if (!videoPageUrl) {
    return NextResponse.json({ error: "Missing url or slug parameter" }, { status: 400 });
  }

  try {
    const pageRes = await fetch(videoPageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://pimpbunny.com/",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!pageRes.ok) {
      return NextResponse.json({ error: `PimpBunny page error: ${pageRes.status}` }, { status: 502 });
    }

    const html = await pageRes.text();

    // Priority order: 1440p (2K) -> 1080p (FHD) -> 720p (HD) -> 480p -> 360p
    const patterns = [
      /video_alt_url4:\s*'([^']+)'/, // 1440p
      /video_alt_url3:\s*'([^']+)'/, // 1080p
      /video_alt_url2:\s*'([^']+)'/, // 720p
      /video_alt_url:\s*'([^']+)'/,  // 480p
      /video_url:\s*'([^']+)'/,      // 360p
    ];

    let getFileUrl: string | null = null;
    let quality = "1080p";

    for (let i = 0; i < patterns.length; i++) {
      const match = html.match(patterns[i]);
      if (match && match[1] && match[1].startsWith("http") && !match[1].includes("upgrade=true")) {
        getFileUrl = match[1];
        if (i === 0) quality = "1440p (2K)";
        else if (i === 1) quality = "1080p (FHD)";
        else if (i === 2) quality = "720p (HD)";
        else if (i === 3) quality = "480p";
        else quality = "360p";
        break;
      }
    }

    if (!getFileUrl) {
      return NextResponse.json({ error: "No open video streams found for this title" }, { status: 404 });
    }

    // Follow 302 redirect to get storage URL
    const getFileRes = await fetch(getFileUrl, {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: videoPageUrl,
      },
      signal: AbortSignal.timeout(8000),
    });

    const storageLocation = getFileRes.headers.get("location");
    if (!storageLocation) {
      return NextResponse.json({ error: "Failed to resolve storage redirect location" }, { status: 502 });
    }

    return NextResponse.json(
      {
        success: true,
        stream_url: storageLocation,
        quality,
        expires_in_hours: 2,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to resolve stream" }, { status: 500 });
  }
}
