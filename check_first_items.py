import os
import sqlite3

thumbs_dir = "/home/ubuntu/javguru-scraper/thumbs/2026"
files = set(os.listdir(thumbs_dir))
print(f"Total files in {thumbs_dir}: {len(files)}")

conn = sqlite3.connect("/home/ubuntu/catalog.db")
c = conn.cursor()
c.execute("SELECT id, slug, code, thumbnail_url, cover_url FROM items WHERE section='jax' ORDER BY year DESC, published_at DESC, id DESC LIMIT 20")
rows = c.fetchall()

print("\nChecking first 20 items in catalog (jax):")
for r in rows:
    thumb = r[3]
    filename = os.path.basename(thumb) if thumb else "NO_THUMB"
    exists = filename in files
    print(f"ID: {r[0]} | Code: {r[2]} | Thumb: {thumb} | File exists on disk: {exists}")
