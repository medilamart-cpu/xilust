import os
import glob
import json
import sqlite3
import re
import time

DB_PATH = "catalog.db"

def init_db(con):
    con.execute("PRAGMA journal_mode = WAL;")
    con.execute("PRAGMA synchronous = NORMAL;")
    con.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL,          -- 'lust' or 'jax'
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        code TEXT,
        year INTEGER,
        views INTEGER DEFAULT 0,
        cover_url TEXT,
        thumbnail_url TEXT,
        studios TEXT,                   -- JSON list
        actors TEXT,                    -- JSON list (pornstars or actresses)
        categories TEXT,                -- JSON list
        tags TEXT,                      -- JSON list
        video_sources TEXT,             -- JSON list of {label, host, url, embed_url, gateway_url}
        published_at TEXT,
        UNIQUE(section, slug)
    );
    """)

    con.execute("CREATE INDEX IF NOT EXISTS idx_items_section ON items(section);")
    con.execute("CREATE INDEX IF NOT EXISTS idx_items_sec_year ON items(section, year DESC);")
    con.execute("CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);")
    con.execute("CREATE INDEX IF NOT EXISTS idx_items_slug ON items(slug);")

    # Full text search table
    con.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        title,
        code,
        actors,
        studios,
        categories,
        tags,
        content=items,
        content_rowid=id
    );
    """)

    # Triggers to keep FTS in sync
    con.execute("""
    CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
        INSERT INTO items_fts(rowid, title, code, actors, studios, categories, tags)
        VALUES (new.id, new.title, new.code, new.actors, new.studios, new.categories, new.tags);
    END;
    """)
    con.commit()

def load_lust(con):
    path = "x1.json"
    if not os.path.exists(path):
        print(f"Skipping Lust: {path} not found")
        return 0

    print("Loading Lust catalog from x1.json...")
    t0 = time.time()
    with open(path, "r", encoding="utf-8") as f:
        posts = json.load(f)

    rows = []
    seen = set()
    for p in posts:
        slug = p.get("slug") or ""
        if not slug or slug in seen:
            continue
        seen.add(slug)

        title = p.get("title") or "Untitled"
        # Extract year from published_at or title
        pub = p.get("published_at") or ""
        year = None
        if pub and len(pub) >= 4 and pub[:4].isdigit():
            year = int(pub[:4])
        else:
            ym = re.search(r"\b(201\d|202\d)\b", title)
            if ym:
                year = int(ym.group(1))

        # Pornstars & Studios
        actors = p.get("pornstars") or []
        if isinstance(actors, str):
            actors = [actors]
        studios = p.get("studios") or []
        if isinstance(studios, str):
            studios = [studios]

        categories = p.get("categories") or []
        tags = p.get("tags") or []
        video_sources = p.get("video_sources") or []

        rows.append((
            "lust",
            slug,
            title,
            "",  # code
            year,
            0,   # views
            "",  # cover_url
            p.get("thumbnail_url") or "",
            json.dumps(studios, ensure_ascii=False),
            json.dumps(actors, ensure_ascii=False),
            json.dumps(categories, ensure_ascii=False),
            json.dumps(tags, ensure_ascii=False),
            json.dumps(video_sources, ensure_ascii=False),
            pub
        ))

    con.executemany("""
    INSERT OR REPLACE INTO items (
        section, slug, title, code, year, views, cover_url, thumbnail_url,
        studios, actors, categories, tags, video_sources, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
    con.commit()
    print(f"Loaded {len(rows):,} Lust titles in {time.time() - t0:.2f}s")
    return len(rows)

def load_jax(con):
    files = sorted(glob.glob("posts_by_year/posts_*.json"))
    if not files:
        print("No Jax post files found under posts_by_year/")
        return 0

    print(f"Loading Jax catalog from {len(files)} year files...")
    t0 = time.time()
    total = 0
    seen = set()

    for fpath in files:
        with open(fpath, "r", encoding="utf-8") as f:
            posts = json.load(f)

        rows = []
        for p in posts:
            slug = p.get("slug") or ""
            if not slug or slug in seen:
                continue
            seen.add(slug)

            title = p.get("title") or "Untitled"
            code = (p.get("code") or "").strip()
            
            # Year
            pub = p.get("published_at") or p.get("release_date") or ""
            year = None
            if pub and len(pub) >= 4 and pub[:4].isdigit():
                year = int(pub[:4])
            else:
                m = re.search(r"posts_(\d{4})\.json", fpath)
                if m:
                    year = int(m.group(1))

            actresses = p.get("actresses") or []
            if isinstance(actresses, str):
                actresses = [actresses]

            studios = (p.get("studios") or []) + (p.get("makers") or [])
            if isinstance(studios, str):
                studios = [studios]
            # Deduplicate studios list
            studios = list(dict.fromkeys(studios))

            categories = p.get("categories") or []
            tags = p.get("tags") or []
            sources = p.get("video_sources") or []
            views = int(p.get("views") or 0)

            rows.append((
                "jax",
                slug,
                title,
                code,
                year,
                views,
                p.get("cover_url") or "",
                "",  # local thumbnail_url
                json.dumps(studios, ensure_ascii=False),
                json.dumps(actresses, ensure_ascii=False),
                json.dumps(categories, ensure_ascii=False),
                json.dumps(tags, ensure_ascii=False),
                json.dumps(sources, ensure_ascii=False),
                pub
            ))

        con.executemany("""
        INSERT OR REPLACE INTO items (
            section, slug, title, code, year, views, cover_url, thumbnail_url,
            studios, actors, categories, tags, video_sources, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows)
        con.commit()
        total += len(rows)
        print(f"  {os.path.basename(fpath):20} -> {len(rows):,} items")

    print(f"Loaded {total:,} Jax titles in {time.time() - t0:.2f}s")
    return total

def main():
    print("=" * 60)
    print("  XiLust Fast SQLite Indexer (Lust + Jax)")
    print("=" * 60)
    con = sqlite3.connect(DB_PATH)
    init_db(con)

    lust_cnt = load_lust(con)
    jax_cnt = load_jax(con)

    # Rebuild FTS index
    print("Building full-text search index...")
    t0 = time.time()
    con.execute("INSERT INTO items_fts(items_fts) VALUES('rebuild');")
    con.commit()
    print(f"FTS index built in {time.time() - t0:.2f}s")

    print("=" * 60)
    print(f"TOTAL CATALOG: {lust_cnt + jax_cnt:,} titles indexed in {DB_PATH}")
    print(f"  • Lust: {lust_cnt:,}")
    print(f"  • Jax:  {jax_cnt:,}")
    print("=" * 60)
    con.close()

if __name__ == "__main__":
    main()
