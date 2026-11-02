import { NextResponse } from "next/server";

export const runtime = "edge";

export interface CommentItem {
  id: string;
  post_slug: string;
  section: string;
  username: string;
  avatar: string;
  text: string;
  createdAt: string;
  likes: number;
}

// In-memory edge cache per worker instance (synchronized with client storage & optional KV binding)
const edgeCommentsCache = new Map<string, CommentItem[]>();

// Starter initial comments for realism on high-profile posts
const SAMPLE_COMMENTS: Record<string, Partial<CommentItem>[]> = {
  default: [
    {
      username: "ShadowDrifter",
      avatar: "⚡",
      text: "Stream quality is incredible on CleanStream, zero buffering in 1080p!",
      likes: 14,
    },
    {
      username: "Kira_Jax",
      avatar: "🌸",
      text: "The uncensored release looks pristine. Favorite scene by far.",
      likes: 9,
    },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const post_slug = searchParams.get("post_slug") || "";

  if (!post_slug) {
    return NextResponse.json({ error: "post_slug required" }, { status: 400 });
  }

  // Retrieve cached comments or generate initial seed
  let list = edgeCommentsCache.get(post_slug);
  if (!list) {
    const seed = SAMPLE_COMMENTS.default.map((c, i) => ({
      id: `seed_${i}_${post_slug.slice(0, 10)}`,
      post_slug,
      section: "lust",
      username: c.username || "Anonymous",
      avatar: c.avatar || "💋",
      text: c.text || "Great release!",
      createdAt: new Date(Date.now() - (i + 1) * 3600000 * 3).toISOString(),
      likes: c.likes || 1,
    }));
    edgeCommentsCache.set(post_slug, seed);
    list = seed;
  }

  return NextResponse.json({
    success: true,
    post_slug,
    comments: list,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { post_slug, section, username, avatar, text } = body;

    if (!post_slug || !text?.trim()) {
      return NextResponse.json({ error: "post_slug and comment text are required." }, { status: 400 });
    }

    const newComment: CommentItem = {
      id: "cmt_" + Math.random().toString(36).substring(2, 10),
      post_slug: String(post_slug),
      section: String(section || "lust"),
      username: String(username || "Guest").trim().slice(0, 30),
      avatar: String(avatar || "💋"),
      text: String(text).trim().slice(0, 1000),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    let list = edgeCommentsCache.get(post_slug) || [];
    list = [newComment, ...list];
    edgeCommentsCache.set(post_slug, list);

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to post comment" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { post_slug, comment_id, action } = body;

    if (!post_slug || !comment_id) {
      return NextResponse.json({ error: "post_slug and comment_id required" }, { status: 400 });
    }

    const list = edgeCommentsCache.get(post_slug);
    if (list) {
      const target = list.find((c) => c.id === comment_id);
      if (target && action === "like") {
        target.likes += 1;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
