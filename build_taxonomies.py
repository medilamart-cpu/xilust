import os
import re
import json
import sqlite3
from collections import Counter

DB_PATH = "catalog.db"
OUT_DIR = "organized"

def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return s or "x"

def clean_name(name: str) -> str:
    # Strip hex hash disambiguators if any
    return re.sub(r"\s+[0-9a-f]{10,}$", "", name, flags=re.I).strip()

def main():
    print("=" * 60)
    print("  XiLust Taxonomy Indexer & Categorizer")
    print("=" * 60)

    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA journal_mode = WAL;")

    # Create taxonomies table
    con.execute("""
    CREATE TABLE IF NOT EXISTS taxonomies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL,       -- 'lust' or 'jax'
        type TEXT NOT NULL,          -- 'actor', 'studio', 'category', 'tag'
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        UNIQUE(section, type, name)
    );
    """)
    con.execute("CREATE INDEX IF NOT EXISTS idx_tax_query ON taxonomies(section, type, count DESC);")
    con.execute("CREATE INDEX IF NOT EXISTS idx_tax_slug ON taxonomies(section, type, slug);")
    con.execute("CREATE INDEX IF NOT EXISTS idx_tax_name ON taxonomies(name);")

    # Clear previous taxonomies
    con.execute("DELETE FROM taxonomies;")
    con.commit()

    os.makedirs(os.path.join(OUT_DIR, "lust"), exist_ok=True)
    os.makedirs(os.path.join(OUT_DIR, "jax"), exist_ok=True)

    for section in ("lust", "jax"):
        print(f"\nProcessing {section.upper()} taxonomies...")

        actor_counter = Counter()
        studio_counter = Counter()
        category_counter = Counter()
        tag_counter = Counter()

        cursor = con.execute("SELECT actors, studios, categories, tags FROM items WHERE section = ?", (section,))
        for row in cursor:
            actors = json.loads(row[0] or "[]")
            studios = json.loads(row[1] or "[]")
            categories = json.loads(row[2] or "[]")
            tags = json.loads(row[3] or "[]")

            for a in actors:
                a_clean = clean_name(a)
                if a_clean:
                    actor_counter[a_clean] += 1

            for s in studios:
                s_clean = clean_name(s)
                if s_clean:
                    studio_counter[s_clean] += 1

            for c in categories:
                c_clean = clean_name(c)
                if c_clean:
                    category_counter[c_clean] += 1

            for t in tags:
                t_clean = clean_name(t)
                if t_clean:
                    tag_counter[t_clean] += 1

        # Insert into database
        rows = []
        for name, count in actor_counter.items():
            rows.append((section, "actor", name, slugify(name), count))

        for name, count in studio_counter.items():
            rows.append((section, "studio", name, slugify(name), count))

        for name, count in category_counter.items():
            rows.append((section, "category", name, slugify(name), count))

        for name, count in tag_counter.items():
            rows.append((section, "tag", name, slugify(name), count))

        con.executemany("""
        INSERT OR REPLACE INTO taxonomies (section, type, name, slug, count)
        VALUES (?, ?, ?, ?, ?)
        """, rows)
        con.commit()

        # Build JSON indexes
        sec_dir = os.path.join(OUT_DIR, section)
        
        actor_label = "pornstars" if section == "lust" else "actresses"
        
        with open(os.path.join(sec_dir, f"index_{actor_label}.json"), "w", encoding="utf-8") as f:
            data = [{"name": n, "slug": slugify(n), "count": c} for n, c in actor_counter.most_common()]
            json.dump(data, f, ensure_ascii=False, indent=2)

        with open(os.path.join(sec_dir, "index_studios.json"), "w", encoding="utf-8") as f:
            data = [{"name": n, "slug": slugify(n), "count": c} for n, c in studio_counter.most_common()]
            json.dump(data, f, ensure_ascii=False, indent=2)

        with open(os.path.join(sec_dir, "index_categories.json"), "w", encoding="utf-8") as f:
            data = [{"name": n, "slug": slugify(n), "count": c} for n, c in category_counter.most_common()]
            json.dump(data, f, ensure_ascii=False, indent=2)

        with open(os.path.join(sec_dir, "index_tags.json"), "w", encoding="utf-8") as f:
            data = [{"name": n, "slug": slugify(n), "count": c} for n, c in tag_counter.most_common()]
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"  • {actor_label.capitalize()}: {len(actor_counter):,} (saved to index_{actor_label}.json)")
        print(f"  • Studios:   {len(studio_counter):,} (saved to index_studios.json)")
        print(f"  • Categories:{len(category_counter):,} (saved to index_categories.json)")
        print(f"  • Tags:      {len(tag_counter):,} (saved to index_tags.json)")

    con.close()
    print("\nTaxonomies built successfully!")

if __name__ == "__main__":
    main()
