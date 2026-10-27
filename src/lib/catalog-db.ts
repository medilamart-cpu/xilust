import { DatabaseSync } from "node:sqlite";
import path from "node:path";

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

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), "catalog.db");
    dbInstance = new DatabaseSync(dbPath, { readOnly: true });
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
    studios: row.studios ? JSON.parse(row.studios) : [],
    actors: row.actors ? JSON.parse(row.actors) : [],
    categories: row.categories ? JSON.parse(row.categories) : [],
    tags: row.tags ? JSON.parse(row.tags) : [],
    video_sources: row.video_sources ? JSON.parse(row.video_sources) : [],
    published_at: row.published_at || "",
  };
}

export function queryItems(options: {
  section?: "lust" | "jax";
  limit?: number;
  offset?: number;
  category?: string;
  studio?: string;
  actor?: string;
  tag?: string;
  year?: number;
  query?: string;
  tab?: "trending" | "new" | "top" | "random";
}): { items: CatalogItem[]; total: number } {
  const db = getDb();
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

export function getItemBySlug(section: "lust" | "jax", slug: string): CatalogItem | null {
  const db = getDb();
  const raw = decodeURIComponent(slug).trim();

  // 1. Exact match by section & slug
  let row = db.prepare("SELECT * FROM items WHERE section = ? AND slug = ? LIMIT 1").get(section, raw);
  if (row) return parseItem(row);

  // 2. Clean trailing ellipsis / hyphens
  const clean = raw.replace(/\.{2,}$/, "").replace(/-+$/, "");
  if (clean && clean !== raw) {
    row = db.prepare("SELECT * FROM items WHERE section = ? AND (slug = ? OR slug LIKE ?) LIMIT 1").get(section, clean, `${clean}%`);
    if (row) return parseItem(row);
  }

  // 3. Prefix match if slug was cut off
  if (clean.length >= 10) {
    row = db.prepare("SELECT * FROM items WHERE section = ? AND slug LIKE ? LIMIT 1").get(section, `${clean}%`);
    if (row) return parseItem(row);
  }

  // 4. Fallback by numeric ID
  if (/^\d+$/.test(clean)) {
    const byId = db.prepare("SELECT * FROM items WHERE section = ? AND id = ? LIMIT 1").get(section, parseInt(clean, 10));
    if (byId) return parseItem(byId);
  }

  // 5. Fallback by JAV code
  if (clean.length >= 3) {
    const byCode = db.prepare("SELECT * FROM items WHERE section = ? AND code = ? LIMIT 1").get(section, clean);
    if (byCode) return parseItem(byCode);
  }

  // 6. Cross-section fallback
  row = db.prepare("SELECT * FROM items WHERE slug = ? OR slug LIKE ? LIMIT 1").get(clean, `${clean}%`);
  if (row) return parseItem(row);

  return null;
}

export function getTaxonomies(
  section: "lust" | "jax",
  type: "actor" | "studio" | "category" | "tag",
  limit = 40
): TaxonomyItem[] {
  const db = getDb();
  const rows = db.prepare(
    "SELECT id, section, type, name, slug, count FROM taxonomies WHERE section = ? AND type = ? ORDER BY count DESC LIMIT ?"
  ).all(section, type, limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    section: r.section,
    type: r.type,
    name: r.name,
    slug: r.slug,
    count: r.count,
  }));
}
