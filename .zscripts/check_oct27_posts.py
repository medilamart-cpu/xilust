import json
import sqlite3
import os

print("=== 1. Checking /home/ubuntu/smovie-scraper/posts_by_year/posts_2026.json ===")
xmovies_path = "/home/ubuntu/smovie-scraper/posts_by_year/posts_2026.json"
if os.path.exists(xmovies_path):
    with open(xmovies_path, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    print(f"Total posts in xmovies 2026: {len(posts)}")
    oct27_posts = [p for p in posts if "2026-10-27" in str(p.get("published_at", "")) or "10.27.2026" in str(p.get("title", "")) or "2026-10-27" in str(p.get("release_date", "")) or "27-10-2026" in str(p.get("published_at", ""))]
    print(f"Posts with Oct 27 in xmovies: {len(oct27_posts)}")
    dates = sorted(list(set(p.get("published_at", "")[:10] for p in posts if p.get("published_at"))))[-10:]
    print("Latest 10 published_at dates in xmovies 2026:", dates)

print("\n=== 2. Checking JAV Guru /home/ubuntu/smovie-scraper/jav-guru-scraper-toolkit/posts_by_year/posts_2026.json ===")
javguru_path = "/home/ubuntu/smovie-scraper/jav-guru-scraper-toolkit/posts_by_year/posts_2026.json"
if os.path.exists(javguru_path):
    with open(javguru_path, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    print(f"Total posts in JAV Guru 2026: {len(posts)}")
    oct27_posts = [p for p in posts if "2026-10-27" in str(p.get("published_at", "")) or "2026-10-27" in str(p.get("release_date", ""))]
    print(f"Posts with Oct 27 in JAV Guru: {len(oct27_posts)}")
    dates = sorted(list(set(p.get("published_at", "")[:10] for p in posts if p.get("published_at"))))[-10:]
    print("Latest 10 published_at dates in JAV Guru 2026:", dates)

print("\n=== 3. Checking catalog.db on VPS ===")
if os.path.exists("/home/ubuntu/catalog.db"):
    conn = sqlite3.connect("/home/ubuntu/catalog.db")
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM items WHERE published_at LIKE '%2026-10-27%' OR release_date LIKE '%2026-10-27%'")
    print("Total Oct 27 items in VPS catalog.db:", cur.fetchone()[0])
    cur.execute("SELECT section, title, published_at FROM items ORDER BY published_at DESC LIMIT 5")
    print("Latest 5 items in VPS catalog.db:", cur.fetchall())
    conn.close()
