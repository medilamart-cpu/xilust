import sqlite3
import os

conn = sqlite3.connect("/home/ubuntu/catalog.db")
cur = conn.cursor()
cur.execute("SELECT count(*) FROM items WHERE published_at LIKE '%2026-10-27%'")
print("Total Oct 27 items in VPS catalog.db:", cur.fetchone()[0])

cur.execute("SELECT section, count(*) FROM items WHERE published_at LIKE '%2026-10-27%' GROUP BY section")
print("Breakdown by section in VPS catalog.db:", cur.fetchall())

cur.execute("SELECT section, count(*) FROM items WHERE published_at LIKE '%2026-10-28%' GROUP BY section")
print("Breakdown for Oct 28 in VPS catalog.db:", cur.fetchall())

cur.execute("SELECT section, title, published_at FROM items WHERE published_at LIKE '%2026-10-27%' LIMIT 5")
print("\nSample Oct 27 items in catalog.db:")
for row in cur.fetchall():
    print(row)
conn.close()
