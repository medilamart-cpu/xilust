"""
Link local mirrored covers to catalog.db.
Populates items.thumbnail_url with '/thumbs/<year>/<post_id>-<code>.jpg'
matching the covers downloaded to the VPS.
"""

import os
import glob
import json
import sqlite3
import time

DB_PATH = "catalog.db"
POSTS_DIR = "E:/MY PROJECTS/SCREAPPER SMOVIE/jav-guru-scraper-toolkit/posts_by_year"

def cover_stem(post):
    pid = str(post.get("post_id") or "noid")
    code = (post.get("code") or "").lower().replace(" ", "-")
    return f"{pid}-{code}" if code else pid

def main():
    if not os.path.exists(DB_PATH):
        raise SystemExit(f"Database {DB_PATH} not found.")

    files = sorted(glob.glob(os.path.join(POSTS_DIR, "posts_*.json")))
    if not files:
        raise SystemExit(f"No posts_*.json files found in {POSTS_DIR}")

    print(f"Reading {len(files)} year files...")
    updates = []
    seen = set()

    t0 = time.time()
    for f in files:
        year = os.path.basename(f)[len("posts_"):-len(".json")]
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
            stem = cover_stem(p)
            thumb_path = f"/thumbs/{year}/{stem}.jpg"
            updates.append((thumb_path, slug))

    print(f"Prepared {len(updates):,} thumbnail links in {time.time() - t0:.2f}s")

    print(f"Connecting to {DB_PATH}...")
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA synchronous = OFF;")
    con.execute("PRAGMA journal_mode = WAL;")

    t1 = time.time()
    cur = con.cursor()
    cur.executemany("UPDATE items SET thumbnail_url = ? WHERE section = 'jax' AND slug = ?", updates)
    con.commit()
    rows_updated = cur.rowcount
    con.close()

    print(f"[SUCCESS] Updated {len(updates):,} records in {time.time() - t1:.2f}s!")

if __name__ == "__main__":
    main()
