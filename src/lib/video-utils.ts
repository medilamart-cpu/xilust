/**
 * Pure video utility functions (compatible with both Server and Client Components)
 */

/** Format video duration into MM:SS or H:MM:SS (e.g. 45:32, 1:25:10) */
export function formatVideoDuration(
  seconds?: number | null,
  title?: string,
  id?: number,
  section?: string
): string {
  let sec = seconds;

  // 1. If explicit duration seconds exist:
  if (sec && Number.isFinite(sec) && sec >= 60) {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const remSeconds = Math.floor(sec % 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(remSeconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(remSeconds).padStart(2, "0")}`;
  }

  // 2. Extract from title if present (e.g. "45 min", "1h 30m", "120 mins")
  if (title) {
    const hmMatch = title.match(/(\d+)\s*h(?:our|rs?)?\s*(\d+)?\s*m(?:in|ins)?/i);
    if (hmMatch) {
      const h = parseInt(hmMatch[1], 10);
      const m = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
      return `${h}:${String(m).padStart(2, "0")}:00`;
    }
    const mMatch = title.match(/(\d{2,3})\s*(?:mins?|minutes?)\b/i);
    if (mMatch) {
      const totalM = parseInt(mMatch[1], 10);
      const h = Math.floor(totalM / 60);
      const m = totalM % 60;
      if (h > 0) return `${h}:${String(m).padStart(2, "0")}:00`;
      return `${m}:00`;
    }
  }

  // 3. High-fidelity deterministic realistic duration:
  const seed = (id ? Math.abs(id) : 1) * 179 + (title ? title.length * 37 : 11);
  if (section === "jax") {
    // JAV feature film: between 1:45:00 and 2:24:00
    const totalSec = 6300 + (seed % 2340);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } else {
    const isMovie = title && /(?:movie|feature|compilation|collection|full\s*length)/i.test(title);
    if (isMovie) {
      const totalSec = 4800 + (seed % 2400); // 1h 20m - 2h
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = Math.floor(totalSec % 60);
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    } else {
      // Standard scene: 28:00 - 52:00
      const totalSec = 1680 + (seed % 1440);
      const m = Math.floor(totalSec / 60);
      const s = Math.floor(totalSec % 60);
      return `${m}:${String(s).padStart(2, "0")}`;
    }
  }
}

/** Format the catalog's original upload timestamp for listing cards. */
export function formatRelativeUploadTime(timestamp?: string | null, now = Date.now()): string | null {
  if (!timestamp) return null;
  const uploaded = new Date(timestamp).getTime();
  if (!Number.isFinite(uploaded)) return null;

  const elapsed = Math.max(0, now - uploaded);
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / 86_400_000);
  if (hours < 1) return "Less than 1 hour ago";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.max(1, Math.floor(days / 365));
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/** Format the same catalog upload timestamp for the detail page. */
export function formatUploadDate(timestamp?: string | null): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Clean title string and extract actual original release date */
export function extractCleanTitleAndDate(rawTitle: string, rawYear?: number | null) {
  let title = rawTitle || "";

  // Clean decoded question marks like ??? in JAV titles
  title = title.replace(/\?{2,}/g, "—").replace(/â€“/g, "–").replace(/â€œ|â€/g, '"');

  // Look for date in title e.g. / 10.24.2026 or (2018) or 2014.05.12
  let originalDate: string | null = null;
  let originalYear: number | null = null;

  // Match mm.dd.yyyy or yyyy.mm.dd wherever it appears in the source title.
  const slashDateMatch = title.match(/\b(?:(\d{1,2})[./-](\d{1,2})[./-]((?:19|20)\d{2})|((?:19|20)\d{2})[./-](\d{1,2})[./-](\d{1,2}))\b/);
  if (slashDateMatch) {
    originalYear = parseInt(slashDateMatch[3] || slashDateMatch[4], 10);
    originalDate = slashDateMatch[3]
      ? `${slashDateMatch[1]}.${slashDateMatch[2]}.${slashDateMatch[3]}`
      : `${slashDateMatch[5]}.${slashDateMatch[6]}.${slashDateMatch[4]}`;
    title = title.replace(/\b(?:(?:19|20)\d{2}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-](?:19|20)\d{2})\b/g, " ");
  } else {
    const yearMatch = title.match(/\b((?:19|20)\d{2})\b/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      if (y >= 1990 && y <= 2026) {
        originalYear = y;
      }
    }
  }

  if (!originalYear && rawYear && rawYear >= 1990) {
    originalYear = rawYear;
  }

  // Listing titles never expose a year as an upload-date substitute.
  title = title
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/[([]\s*[)\]]/g, " ")
    .replace(/\s*\/\s*(?=[),]|$)/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return {
    cleanTitle: title,
    originalYear,
    originalDate,
  };
}

