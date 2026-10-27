/* Server-only TMDB data layer.
 * ⚠️ Import ONLY from server components / route handlers —
 * this module injects the API key, which must never reach the browser.
 * (The browser talks to /api/tmdb/* via src/lib/tmdb.ts instead.) */

const TMDB_BASE = "https://api.themoviedb.org/3";

export type MediaType = "movie" | "tv";

export async function tmdbServer<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;

  const qs = new URLSearchParams(params);
  qs.set("api_key", key);

  try {
    const res = await fetch(`${TMDB_BASE}/${path}?${qs.toString()}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 600 }, // cache upstream responses 10 min
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ---------- shared image / formatting helpers (safe for server use) ---------- */

export function img(
  path?: string | null,
  size: "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original" = "w342",
): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export const titleOf = (d: { title?: string; name?: string; original_title?: string; original_name?: string }) =>
  d.title || d.name || d.original_title || d.original_name || "Untitled";

export const yearOf = (d: { release_date?: string; first_air_date?: string }) =>
  parseInt((d.release_date || d.first_air_date || "0").slice(0, 4), 10) || 0;

export function runtimeText(mins?: number): string | null {
  if (!mins || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

export function moneyText(v?: number): string | null {
  if (!v || v <= 0) return null;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}b`;
  if (v >= 1_000_000) return `$${Math.round(v / 1_000_000)}m`;
  return `$${v.toLocaleString("en-US")}`;
}

/* ---------- TMDB detail shapes ---------- */

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
  known_for_department?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  published_at?: string;
  size?: number;
}

export interface SeasonItem {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date?: string | null;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
}

export interface PagedLite {
  results?: {
    id: number;
    media_type?: string;
    title?: string;
    name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
  }[];
}

export interface TitleDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  tagline?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  status?: string;
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  original_language?: string;
  homepage?: string;
  production_countries?: { iso_3166_1: string; name: string }[];
  production_companies?: { id: number; name: string; logo_path?: string | null }[];
  networks?: { id: number; name: string; logo_path?: string | null }[];
  budget?: number;
  revenue?: number;
  created_by?: { id: number; name: string }[];
  spoken_languages?: { english_name?: string; iso_639_1?: string }[];
  credits?: { cast?: CastMember[]; crew?: CrewMember[] };
  videos?: { results?: VideoItem[] };
  recommendations?: PagedLite;
  similar?: PagedLite;
  images?: { logos?: { file_path: string; iso_639_1?: string | null; vote_average?: number }[] };
  release_dates?: {
    results?: { iso_3166_1: string; release_dates?: { certification?: string }[] }[];
  };
  content_ratings?: { results?: { iso_3166_1: string; rating: string }[] };
  seasons?: SeasonItem[];
}

/** Sort videos: official trailers first, then teasers, clips, featurettes. */
export function pickVideos(videos?: { results?: VideoItem[] }): VideoItem[] {
  const yt = (videos?.results ?? []).filter((v) => v.site === "YouTube" && v.key);
  if (yt.length === 0) return [];
  const rank = (v: VideoItem) => {
    const t = v.type.toLowerCase();
    const base = t.includes("trailer") ? 0 : t.includes("teaser") ? 1 : t.includes("clip") ? 2 : 3;
    return (v.official ? 0 : 10) + base;
  };
  return yt.sort((a, b) => rank(a) - rank(b) || (b.published_at ?? "").localeCompare(a.published_at ?? "")).slice(0, 8);
}

/** Age certification, preferring US then GB. */
export function certificationOf(d: TitleDetails): string | null {
  const us = d.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
  const mCert =
    us?.release_dates?.map((x) => x.certification ?? "").find((c) => c.length > 0) ?? null;
  if (mCert) return mCert;
  const gb = d.release_dates?.results?.find((r) => r.iso_3166_1 === "GB");
  const gCert = gb?.release_dates?.map((x) => x.certification ?? "").find((c) => c.length > 0) ?? null;
  if (gCert) return gCert;
  const tv = d.content_ratings?.results?.find((r) => r.iso_3166_1 === "US")?.rating ?? null;
  return tv ?? d.content_ratings?.results?.[0]?.rating ?? null;
}

/** Director (movie) or creator (tv). */
export function createdBy(d: TitleDetails, type: MediaType): string[] {
  if (type === "tv") return (d.created_by ?? []).map((c) => c.name);
  const crew = d.credits?.crew ?? [];
  const directors = crew.filter((c) => c.job === "Director").map((c) => c.name);
  return [...new Set(directors)].slice(0, 3);
}

export function writersOf(d: TitleDetails): string[] {
  const crew = d.credits?.crew ?? [];
  const names = crew
    .filter((c) => c.job === "Screenplay" || c.job === "Writer" || c.job === "Story")
    .map((c) => c.name);
  return [...new Set(names)].slice(0, 3);
}
