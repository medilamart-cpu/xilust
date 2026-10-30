export interface CatalogItem {
  id: number;
  section: "lust" | "jax";
  slug: string;
  title: string;
  code: string;
  year: number | null;
  views: number;
  cover_url: string;
  thumbnail_url: string;
  studios: string[];
  actors: string[];
  categories: string[];
  tags: string[];
  video_sources: Array<{
    label?: string;
    host?: string;
    url?: string;
    embed_url?: string;
    gateway_url?: string;
  }>;
  published_at: string;
  duration_seconds?: number | null;
}

export interface TaxonomyItem {
  id: number;
  section: "lust" | "jax";
  type: "actor" | "studio" | "category" | "tag";
  name: string;
  slug: string;
  count: number;
}

const CATALOG_API_URL =
  process.env.CATALOG_API_URL || "https://supervisor-demonstrated-rhythm-ignored.trycloudflare.com";

let dbInstance: any = null;
let localDbChecked = false;

function getLocalDb() {
  if (typeof process === "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return null;
  }
  if (localDbChecked) return dbInstance;
  localDbChecked = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    const proc = typeof process !== "undefined" ? (process as any) : null;
    const cwd = typeof proc?.["cwd"] === "function" ? proc["cwd"]() : "";
    const dbPath = path.resolve(cwd, "catalog.db");
    if (fs.existsSync(dbPath)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DatabaseSync } = require("node:sqlite");
      dbInstance = new DatabaseSync(dbPath, { readOnly: true });
      console.log("✅ [catalog-db] Connected to local catalog.db successfully!");
    } else {
      console.warn("⚠️ [catalog-db] catalog.db not found at:", dbPath);
    }
  } catch (err) {
    console.error("❌ [catalog-db] getLocalDb failed:", err);
    dbInstance = null;
  }
  return dbInstance;
}

export function parseItem(row: any): CatalogItem {
  const durationSeconds = Number(row.duration_seconds);
  return {
    id: row.id,
    section: row.section,
    slug: row.slug,
    title: row.title,
    code: row.code || "",
    year: row.year ?? null,
    views: row.views || 0,
    cover_url: row.cover_url || "",
    thumbnail_url: row.thumbnail_url || "",
    studios: typeof row.studios === "string" ? JSON.parse(row.studios) : (row.studios || []),
    actors: typeof row.actors === "string" ? JSON.parse(row.actors) : (row.actors || []),
    categories: typeof row.categories === "string" ? JSON.parse(row.categories) : (row.categories || []),
    tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
    video_sources: typeof row.video_sources === "string" ? JSON.parse(row.video_sources) : (row.video_sources || []),
    published_at: row.published_at || "",
    duration_seconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
  };
}

export async function queryItems(options: {
  section?: "lust" | "jax";
  limit?: number;
  offset?: number;
  category?: string;
  studio?: string;
  actor?: string;
  tag?: string;
  code?: string;
  year?: number;
  query?: string;
  tab?: "trending" | "top" | "new" | "random";
  sort?: "newest" | "popular" | "views";
  movies?: boolean;
  subfilter?: string;
}): Promise<{ items: CatalogItem[]; total: number }> {
  const db = getLocalDb();

  // If local SQLite is available, query locally
  if (db) {
    const limit = Math.min(Math.max(options.limit || 24, 1), 100);
    const offset = Math.max(options.offset || 0, 0);

    const whereParts: string[] = ["slug != 'live'"];
    const params: any[] = [];

    if (options.section) {
      whereParts.push("section = ?");
      params.push(options.section);
    }

    if (options.year) {
      whereParts.push("year = ?");
      params.push(options.year);
    }

    if (options.category && options.category !== "All") {
      whereParts.push("EXISTS (SELECT 1 FROM json_each(items.categories) AS taxonomy WHERE taxonomy.value = ?)");
      params.push(options.category);
    }

    if (options.studio) {
      whereParts.push("EXISTS (SELECT 1 FROM json_each(items.studios) AS taxonomy WHERE taxonomy.value = ?)");
      params.push(options.studio);
    }

    if (options.actor) {
      whereParts.push("EXISTS (SELECT 1 FROM json_each(items.actors) AS taxonomy WHERE taxonomy.value = ?)");
      params.push(options.actor);
    }

    if (options.tag) {
      whereParts.push("EXISTS (SELECT 1 FROM json_each(items.tags) AS taxonomy WHERE taxonomy.value = ?)");
      params.push(options.tag);
    }

    if (options.code) {
      whereParts.push("UPPER(code) = UPPER(?)");
      params.push(options.code.trim());
    }

    if (options.movies) {
      whereParts.push("(duration_seconds >= 3600 OR section = 'jax' OR title LIKE '%movie%' OR title LIKE '%feature%')");
    }

    if (options.subfilter) {
      const sf = options.subfilter.toLowerCase();
      if (sf === "4k") {
        whereParts.push("(categories LIKE '%4K%' OR title LIKE '%4K%')");
      } else if (sf === "subbed") {
        whereParts.push("(categories LIKE '%subbed%' OR tags LIKE '%sub%' OR categories LIKE '%subtitle%')");
      } else if (sf === "uncensored") {
        whereParts.push("(tags LIKE '%uncensored%' OR categories LIKE '%uncen%' OR categories LIKE '%fc2%')");
      }
    }

    if (options.query) {
      const q = options.query.trim();
      if (q) {
        whereParts.push("(title LIKE ? OR code LIKE ? OR actors LIKE ? OR studios LIKE ? OR categories LIKE ? OR tags LIKE ?)");
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    let orderBy = "ORDER BY COALESCE(year, 0) DESC, COALESCE(published_at, '') DESC, id DESC";
    if (options.tab === "top" || options.sort === "popular" || options.sort === "views") {
      orderBy = "ORDER BY COALESCE(views, 0) DESC, COALESCE(year, 0) DESC, id DESC";
    } else if (options.tab === "new" || options.sort === "newest") {
      orderBy = "ORDER BY COALESCE(year, 0) DESC, COALESCE(published_at, '') DESC, id DESC";
    } else if (options.tab === "random") {
      orderBy = "ORDER BY RANDOM()";
    }

    const countSql = `SELECT count(*) as total FROM items ${whereClause}`;
    const countRow: any = db.prepare(countSql).get(...params);
    const total = countRow?.total || 0;

    const dataSql = `SELECT * FROM items ${whereClause} ${orderBy} LIMIT ? OFFSET ?`;
    const rows = db.prepare(dataSql).all(...params, limit, offset);

    return {
      items: rows.map(parseItem),
      total,
    };
  }

  // Fallback to remote Catalog API
  try {
    const params = new URLSearchParams();
    if (options.section) params.set("section", options.section);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    if (options.category && options.category !== "All") params.set("category", options.category);
    if (options.studio) params.set("studio", options.studio);
    if (options.actor) params.set("actor", options.actor);
    if (options.tag) params.set("tag", options.tag);
    if (options.code) params.set("code", options.code);
    if (options.movies) params.set("movies", "1");
    if (options.subfilter) params.set("subfilter", options.subfilter);
    if (options.query) params.set("search", options.query);
    if (options.tab) params.set("tab", options.tab);
    if (options.sort) params.set("sort", options.sort);

    const res = await fetch(`${CATALOG_API_URL}/api/catalog?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Catalog API responded with ${res.status}`);
      return { items: [], total: 0 };
    }
    const data = await res.json();
    return {
      items: (data.items || []).map(parseItem),
      total: data.total || 0,
    };
  } catch (err) {
    console.error("Failed to fetch from remote catalog API:", err);
    return {
      items: [],
      total: 0,
    };
  }
}

export async function getItemBySlug(section: "lust" | "jax", slug: string): Promise<CatalogItem | null> {
  const db = getLocalDb();

  if (db) {
    let row: any = db.prepare("SELECT * FROM items WHERE section = ? AND slug = ? LIMIT 1").get(section, slug);

    if (!row) {
      const cleanSlug = slug.replace(/\.*$/, "").replace(/-+$/, "").trim();
      row = db.prepare("SELECT * FROM items WHERE section = ? AND slug = ? LIMIT 1").get(section, cleanSlug);

      if (!row) {
        row = db.prepare("SELECT * FROM items WHERE section = ? AND slug LIKE ? LIMIT 1").get(section, `${cleanSlug}%`);
      }

      if (!row && /^\d+$/.test(slug)) {
        row = db.prepare("SELECT * FROM items WHERE section = ? AND id = ? LIMIT 1").get(section, parseInt(slug, 10));
      }

      if (!row && section === "jax") {
        row = db.prepare("SELECT * FROM items WHERE section = 'jax' AND code = ? LIMIT 1").get(slug.toUpperCase());
      }
    }

    return row ? parseItem(row) : null;
  }

  // Remote Catalog API
  try {
    const res = await fetch(
      `${CATALOG_API_URL}/api/title?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return parseItem(data);
  } catch (err) {
    console.error("Failed to fetch title from remote catalog API:", err);
    return null;
  }
}

export async function getTaxonomies(
  section: "lust" | "jax",
  type: "actor" | "studio" | "category" | "tag",
  limit: number = 40,
  search: string = ""
): Promise<TaxonomyItem[]> {
  const db = getLocalDb();

  if (db) {
    try {
      const sql = `
        SELECT id, section, type, name, slug, count
        FROM taxonomies
        WHERE section = ? AND type = ? AND (? = '' OR LOWER(REPLACE(name, ' ', '')) LIKE '%' || LOWER(REPLACE(?, ' ', '')) || '%')
        ORDER BY count DESC
        LIMIT ?
      `;
      const q = search.trim();
      const rows = db.prepare(sql).all(section, type, q, `%${q}%`, Math.min(Math.max(limit, 1), 100));
      return rows as unknown as TaxonomyItem[];
    } catch (err) {
      console.error("Taxonomy query error:", err);
      return [];
    }
  }

  // Remote Catalog API
  try {
    const res = await fetch(
      `${CATALOG_API_URL}/api/taxonomies?section=${encodeURIComponent(section)}&type=${encodeURIComponent(type)}&limit=${Math.min(Math.max(limit, 1), 100)}&q=${encodeURIComponent(search.trim())}`,
      search.trim() ? { cache: "no-store" } : { next: { revalidate: 600 } }
    );
    if (!res.ok) {
      console.warn(`Taxonomy API responded with ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.items || []).map((item: any, idx: number) => ({
      id: idx + 1,
      section,
      type,
      name: item.name,
      slug: item.slug,
      count: item.count,
    }));
  } catch (err) {
    console.error("Failed to fetch taxonomies from remote catalog API:", err);
    return [];
  }
}
