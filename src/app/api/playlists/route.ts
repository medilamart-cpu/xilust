import { NextRequest, NextResponse } from "next/server";
import { COMMUNITY_PLAYLISTS, Playlist } from "@/lib/playlists";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "trending";
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "6", 10)));
    const id = searchParams.get("id");

    if (id) {
      const match = COMMUNITY_PLAYLISTS.find((p) => p.id === id || p.slug === id);
      if (!match) {
        return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
      }
      return NextResponse.json({ playlist: match });
    }

    let results = [...COMMUNITY_PLAYLISTS];
    if (filter === "top") {
      results.sort((a, b) => b.rating - a.rating);
    } else if (filter === "recent") {
      results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (filter === "staff") {
      results = results.filter((p) => p.tags?.includes("Staff Pick")).concat(results);
    } else {
      // trending
      results.sort((a, b) => b.views - a.views);
    }

    return NextResponse.json({
      playlists: results.slice(0, limit),
      total: results.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch playlists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "rate") {
      const { playlistId, rating } = body;
      if (!playlistId || typeof rating !== "number" || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Invalid rating parameters" }, { status: 400 });
      }

      const match = COMMUNITY_PLAYLISTS.find((p) => p.id === playlistId);
      if (match) {
        const currentSum = match.rating * match.ratingCount;
        match.ratingCount += 1;
        match.rating = Number(((currentSum + rating) / match.ratingCount).toFixed(2));
        return NextResponse.json({
          success: true,
          rating: match.rating,
          ratingCount: match.ratingCount,
        });
      }

      return NextResponse.json({ success: true, rating, ratingCount: 1 });
    }

    if (action === "publish") {
      const playlist: Playlist = body.playlist;
      if (!playlist || !playlist.name) {
        return NextResponse.json({ error: "Invalid playlist object" }, { status: 400 });
      }

      // Add to in-memory community registry if not already present
      const exists = COMMUNITY_PLAYLISTS.some((p) => p.id === playlist.id);
      if (!exists) {
        COMMUNITY_PLAYLISTS.unshift({
          ...playlist,
          visibility: "public",
          rating: 5.0,
          ratingCount: 1,
          views: 1,
        });
      }

      return NextResponse.json({ success: true, playlist });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 });
  }
}

