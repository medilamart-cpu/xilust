import path from "path";
import fs from "fs";

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
  process.env.CATALOG_API_URL || "https://revenue-substitute-summaries-subject.trycloudflare.com";

let dbInstance: any = null;
let localDbChecked = false;

function getLocalDb() {
  if (localDbChecked) return dbInstance;
  localDbChecked = true;
  try {
    const dbPath = path.resolve(process.cwd(), "catalog.db");
    if (fs.existsSync(dbPath)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DatabaseSync } = require("node:sqlite");
      dbInstance = new DatabaseSync(dbPath, { readOnly: true });
    }
  } catch {
    dbInstance = null;
  }
  return dbInstance;
}

export function parseItem(row: any): CatalogItem {
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
  year?: number;
  query?: string;
  tab?: "trending" | "top" | "new" | "random";
}): Promise<{ items: CatalogItem[]; total: number }> {
  const db = getLocalDb();

  // If local SQLite is available, query locally
  if (db) {
    const limit = Math.min(Math.max(options.limit || 24, 1), 100);
    const offset = Math.max(options.offset || 0, 0);

    const whereParts: string[] = [];
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
      whereParts.push("categories LIKE ?");
      params.push(`%"${options.category}"%`);
    }

    if (options.studio) {
      whereParts.push("studios LIKE ?");
      params.push(`%"${options.studio}"%`);
    }

    if (options.actor) {
      whereParts.push("actors LIKE ?");
      params.push(`%"${options.actor}"%`);
    }

    if (options.tag) {
      whereParts.push("tags LIKE ?");
      params.push(`%"${options.tag}"%`);
    }

    if (options.query) {
      const q = options.query.trim();
      if (q) {
        whereParts.push("(title LIKE ? OR code LIKE ? OR actors LIKE ? OR studios LIKE ? OR tags LIKE ?)");
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    let orderBy = "ORDER BY year DESC, id DESC";
    if (options.tab === "top") {
      orderBy = "ORDER BY views DESC, id DESC";
    } else if (options.tab === "new") {
      orderBy = "ORDER BY id DESC";
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
    if (options.query) params.set("search", options.query);

    const res = await fetch(`${CATALOG_API_URL}/api/catalog?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Catalog API responded with ${res.status}`);
    const data = await res.json();
    return {
      items: (data.items || []).map(parseItem),
      total: data.total || 0,
    };
  } catch (err) {
    console.error("Failed to fetch from remote catalog API:", err);
    return { items: [], total: 0 };
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
  limit: number = 40
): Promise<TaxonomyItem[]> {
  const db = getLocalDb();

  if (db) {
    try {
      const sql = `
        SELECT id, section, type, name, slug, count
        FROM taxonomies
        WHERE section = ? AND type = ?
        ORDER BY count DESC
        LIMIT ?
      `;
      const rows = db.prepare(sql).all(section, type, limit);
      return rows as unknown as TaxonomyItem[];
    } catch (err) {
      console.error("Taxonomy query error:", err);
      return [];
    }
  }

  // Remote Catalog API
  try {
    const res = await fetch(
      `${CATALOG_API_URL}/api/taxonomies?section=${encodeURIComponent(section)}&type=${encodeURIComponent(type)}&limit=${limit}`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return [];
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
