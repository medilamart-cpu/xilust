import os
import re

thumbs_dir = "/home/ubuntu/javguru-scraper/thumbs/2026"
files = os.listdir(thumbs_dir)

pids = []
for f in files:
    m = re.match(r"^(\d+)-", f)
    if m:
        pids.append((int(m.group(1)), f))

pids.sort()
print(f"Total matching files: {len(pids)}")
print(f"Lowest 5 files: {pids[:5]}")
print(f"Highest 5 files: {pids[-5:]}")
