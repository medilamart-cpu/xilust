import os
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor

POSTS_PATH = "/home/ubuntu/smovie-scraper/jav-guru-scraper-toolkit/posts_by_year/posts_2026.json"
THUMBS_DIR = "/home/ubuntu/javguru-scraper/thumbs/2026"

def cover_stem(p):
    pid = str(p.get("post_id") or "noid")
    code = (p.get("code") or "").lower().replace(" ", "-")
    return f"{pid}-{code}" if code else pid

def download_one(item):
    cover_url, dest_path = item
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        return True
    try:
        req = urllib.request.Request(
            cover_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://jav.guru/",
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            if len(data) > 1000:
                with open(dest_path, "wb") as f:
                    f.write(data)
                return True
    except Exception as e:
        # print(f"Error {cover_url}: {e}")
        return False
    return False

def main():
    with open(POSTS_PATH, "r", encoding="utf-8") as f:
        posts = json.load(f)

    os.makedirs(THUMBS_DIR, exist_ok=True)
    
    missing = []
    for p in posts:
        stem = cover_stem(p)
        dest = os.path.join(THUMBS_DIR, f"{stem}.jpg")
        cover_url = p.get("cover_url")
        if cover_url and (not os.path.exists(dest) or os.path.getsize(dest) < 1000):
            missing.append((cover_url, dest))

    print(f"Total posts: {len(posts)}. Missing thumbnails to download: {len(missing)}")

    if not missing:
        print("All thumbnails exist!")
        return

    # Download in parallel
    print(f"Downloading {len(missing)} missing thumbnails...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(download_one, missing))

    success = sum(1 for r in results if r)
    print(f"Successfully downloaded {success} / {len(missing)} thumbnails!")

if __name__ == "__main__":
    main()
