"""
Sync Scraper Data to Catalog Database (XiLust Pipeline)
-------------------------------------------------------
This script continuously or on-demand synchronizes newly scraped items
from the scraper output directories directly into local catalog.db:
  - JAV Guru (JAX): E:/MY PROJECTS/SCREAPPER SMOVIE/jav-guru-scraper-toolkit/posts_by_year/
  - PimpBunny / XMovies (LUST): E:/MY PROJECTS/SCREAPPER SMOVIE/pimpbunny/pimpbunny-prebuilt-catalog/videos_by_year/
  - Fallback local directories: ./posts_by_year/

It automatically computes thumbnail paths:
  - /thumbs/<year>/<post_id>-<code>.jpg
And inserts or updates items without dropping existing records.
"""

import os
import glob
import json
import sqlite3
import re
import time

DB_PATH = "catalog.db"

# Primary local directories mapped from VPS scraper backups
JAX_POSTS_DIRS = [
    "E:/MY PROJECTS/SCREAPPER SMOVIE/jav-guru-scraper-toolkit/posts_by_year",
    "posts_by_year",
]

LUST_POSTS_DIRS = [
    "E:/MY PROJECTS/SCREAPPER SMOVIE/pimpbunny/pimpbunny-prebuilt-catalog/videos_by_year",
]

def cover_stem(p):
    pid = str(p.get("post_id") or "noid")
    code = (p.get("code") or "").lower().replace(" ", "-")
    return f"{pid}-{code}" if code else pid

def sync_jax(con):
    found_files = []
    for d in JAX_POSTS_DIRS:
        if os.path.exists(d):
            files = sorted(glob.glob(os.path.join(d, "posts_*.json")))
            if files:
                found_files = files
                break

    if not found_files:
        print("[JAX] No post files found.")
        return 0

    print(f"[JAX] Reading {len(found_files)} files...")
    t0 = time.time()
    upserts = []
    seen = set()

    for f in found_files:
        year_str = os.path.basename(f)[len("posts_"):-len(".json")]
        try:
            year = int(year_str)
        except ValueError:
            year = 2026

        try:
            with open(f, "r", encoding="utf-8") as fp:
                posts = json.load(fp)
        except Exception as e:
            print(f"Error loading {f}: {e}")
            continue

        for p in posts:
            slug = p.get("slug")
            if not slug or slug in seen:
                continue
            seen.add(slug)

            title = p.get("title") or "Untitled JAV"
            code = p.get("code") or ""
            stem = cover_stem(p)
            thumb_path = f"/thumbs/{year}/{stem}.jpg"
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

            upserts.append((
                "jax",
                slug,
                title,
                code,
                year,
                p.get("views") or 0,
                cover_url,
                thumb_path,
                json.dumps(studios, ensure_ascii=False),
                json.dumps(actors, ensure_ascii=False),
                json.dumps(categories, ensure_ascii=False),
                json.dumps(tags, ensure_ascii=False),
                json.dumps(video_sources, ensure_ascii=False),
                p.get("published_at") or ""
            ))

    cur = con.cursor()
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
    print(f"[JAX] Synced {len(upserts):,} items in {time.time() - t0:.2f}s")
    return len(upserts)

def sync_lust(con):
    found_files = []
    for d in LUST_POSTS_DIRS:
        if os.path.exists(d):
            files = sorted(glob.glob(os.path.join(d, "videos_*.json")))
            if files:
                found_files = files
                break

    if not found_files:
        # Check x1.json
        if os.path.exists("x1.json"):
            print("[LUST] Checked x1.json.")
        return 0

    print(f"[LUST] Reading {len(found_files)} files from {found_files[0]}...")
    t0 = time.time()
    upserts = []
    seen = set()

    for f in found_files:
        try:
            with open(f, "r", encoding="utf-8") as fp:
                posts = json.load(fp)
        except Exception as e:
            print(f"Error reading {f}: {e}")
            continue

        for p in posts:
            slug = p.get("slug")
            if not slug or slug in seen:
                continue
            seen.add(slug)

            title = p.get("title") or "Untitled"
            year = p.get("year") or 2026

            actors = p.get("pornstars") or p.get("actors") or []
            if isinstance(actors, str):
                actors = [actors]
            studios = p.get("studios") or p.get("studio") or []
            if isinstance(studios, str):
                studios = [studios]
            categories = p.get("categories") or []
            tags = p.get("tags") or []
            video_sources = p.get("video_sources") or []

            upserts.append((
                "lust",
                slug,
                title,
                "",
                year,
                p.get("views") or 0,
                "",
                p.get("thumbnail_url") or "",
                json.dumps(studios, ensure_ascii=False),
                json.dumps(actors, ensure_ascii=False),
                json.dumps(categories, ensure_ascii=False),
                json.dumps(tags, ensure_ascii=False),
                json.dumps(video_sources, ensure_ascii=False),
                p.get("published_at") or ""
            ))

    cur = con.cursor()
    cur.executemany("""
    INSERT INTO items (
        section, slug, title, code, year, views, cover_url, thumbnail_url,
        studios, actors, categories, tags, video_sources, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(section, slug) DO UPDATE SET
        title = excluded.title,
        year = excluded.year,
        thumbnail_url = excluded.thumbnail_url,
        studios = excluded.studios,
        actors = excluded.actors,
        categories = excluded.categories,
        tags = excluded.tags,
        video_sources = excluded.video_sources;
    """, upserts)
    con.commit()
    print(f"[LUST] Synced {len(upserts):,} items in {time.time() - t0:.2f}s")
    return len(upserts)

def main():
    if not os.path.exists(DB_PATH):
        raise SystemExit(f"Database {DB_PATH} not found.")

    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA journal_mode = WAL;")
    con.execute("PRAGMA synchronous = NORMAL;")

    print("=== Starting Scraper to Catalog Sync ===")
    sync_jax(con)
    sync_lust(con)
    con.close()
    print("=== Sync Complete! Database is fully up to date. ===")

if __name__ == "__main__":
    main()
