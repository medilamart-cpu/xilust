import os
import json
import sqlite3
import time

DB_PATH = "/home/ubuntu/catalog.db"
con = sqlite3.connect(DB_PATH)
cur = con.cursor()

def cover_stem(p):
    pid = str(p.get("post_id") or "noid")
    code = (p.get("code") or "").lower().replace(" ", "-")
    return f"{pid}-{code}" if code else pid

# 1. Sync JAV Guru 2026 (JAX)
javguru_file = "/home/ubuntu/smovie-scraper/jav-guru-scraper-toolkit/posts_by_year/posts_2026.json"
if os.path.exists(javguru_file):
    print("Reading JAV Guru 2026...")
    with open(javguru_file, "r", encoding="utf-8") as f:
        posts = json.load(f)
    print(f"Total JAV Guru posts: {len(posts)}")
    upserts = []
    seen = set()
    for p in posts:
        slug = p.get("slug")
        if not slug or slug in seen:
            continue
        seen.add(slug)
        title = p.get("title") or "Untitled JAV"
        code = p.get("code") or ""
        stem = cover_stem(p)
        thumb_path = f"/thumbs/2026/{stem}.jpg"
        cover_url = p.get("cover_url") or ""
        actors = p.get("actresses") or p.get("actors") or []
        if isinstance(actors, str):
            actors = [actors]
        studios = p.get("studios") or p.get("studio") or []
        if isinstance(studios, str):
            studios = [studios]
        categories = p.get("categories") or p.get("genres") or []
        tags = p.get("tags") or []
        video_sources = p.get("video_sources") or p.get("stream_sources") or []
        published_at = p.get("published_at") or p.get("release_date") or ""

        upserts.append((
            "jax", slug, title, code, 2026, p.get("views") or 0, cover_url,
            thumb_path, json.dumps(studios, ensure_ascii=False),
            json.dumps(actors, ensure_ascii=False), json.dumps(categories, ensure_ascii=False),
            json.dumps(tags, ensure_ascii=False), json.dumps(video_sources, ensure_ascii=False),
            published_at
        ))

    cur.executemany("""
    INSERT INTO items (
        section, slug, title, code, year, views, cover_url, thumbnail_url,
        studios, actors, categories, tags, video_sources, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(section, slug) DO UPDATE SET
        title = excluded.title,
        code = excluded.code,
        year = excluded.year,
        cover_url = excluded.cover_url,
        thumbnail_url = excluded.thumbnail_url,
        studios = excluded.studios,
        actors = excluded.actors,
        categories = excluded.categories,
        tags = excluded.tags,
        video_sources = excluded.video_sources,
        published_at = excluded.published_at;
    """, upserts)
    con.commit()
    print(f"Upserted {len(upserts)} JAX posts into catalog.db")

# 2. Sync XMovies 2026 (LUST)
xmovies_file = "/home/ubuntu/smovie-scraper/posts_by_year/posts_2026.json"
if os.path.exists(xmovies_file):
    print("Reading XMovies 2026...")
    with open(xmovies_file, "r", encoding="utf-8") as f:
        posts = json.load(f)
    print(f"Total XMovies posts: {len(posts)}")
    upserts = []
    seen = set()
    for p in posts:
        slug = p.get("slug")
        if not slug or slug in seen:
            continue
        seen.add(slug)
        title = p.get("title") or "Untitled"
        code = ""
        cover_url = p.get("cover_url") or ""
        thumb_path = f"/thumbs/xmovies/2026/{slug}.webp"
        actors = p.get("pornstars") or p.get("actors") or p.get("actresses") or []
        if isinstance(actors, str):
            actors = [actors]
        studios = p.get("studios") or p.get("studio") or []
        if isinstance(studios, str):
            studios = [studios]
        categories = p.get("categories") or p.get("genres") or []
        tags = p.get("tags") or []
        video_sources = p.get("video_sources") or p.get("stream_sources") or []
        published_at = p.get("published_at") or p.get("release_date") or ""

        upserts.append((
            "lust", slug, title, code, 2026, p.get("views") or 0, cover_url,
            thumb_path, json.dumps(studios, ensure_ascii=False),
            json.dumps(actors, ensure_ascii=False), json.dumps(categories, ensure_ascii=False),
            json.dumps(tags, ensure_ascii=False), json.dumps(video_sources, ensure_ascii=False),
            published_at
        ))

    cur.executemany("""
    INSERT INTO items (
        section, slug, title, code, year, views, cover_url, thumbnail_url,
        studios, actors, categories, tags, video_sources, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(section, slug) DO UPDATE SET
        title = excluded.title,
        code = excluded.code,
        year = excluded.year,
        cover_url = excluded.cover_url,
        thumbnail_url = excluded.thumbnail_url,
        studios = excluded.studios,
        actors = excluded.actors,
        categories = excluded.categories,
        tags = excluded.tags,
        video_sources = excluded.video_sources,
        published_at = excluded.published_at;
    """, upserts)
    con.commit()
    print(f"Upserted {len(upserts)} LUST posts into catalog.db")

# Verify Oct 27 count in catalog.db now
cur.execute("SELECT section, count(*) FROM items WHERE published_at LIKE '%2026-10-27%' GROUP BY section")
print("\nUpdated Oct 27 counts in catalog.db:")
for row in cur.fetchall():
    print(row)

cur.execute("SELECT section, count(*) FROM items WHERE published_at LIKE '%2026-10-28%' GROUP BY section")
print("\nUpdated Oct 28 counts in catalog.db:")
for row in cur.fetchall():
    print(row)

con.close()
print("Sync complete!")
