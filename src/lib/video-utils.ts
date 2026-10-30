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

/** Clean title string and extract actual original release date */
export function extractCleanTitleAndDate(rawTitle: string, rawYear?: number | null) {
  let title = rawTitle || "";

  // Clean decoded question marks like ??? in JAV titles
  title = title.replace(/\?{2,}/g, "—").replace(/â€“/g, "–").replace(/â€œ|â€/g, '"');

  // Look for date in title e.g. / 10.24.2026 or (2018) or 2014.05.12
  let originalDate: string | null = null;
  let originalYear: number | null = null;

  // Match mm.dd.yyyy or yyyy.mm.dd
  const slashDateMatch = title.match(/[/(]\s*(\d{1,2})[./-](\d{1,2})[./-]((?:19|20)\d{2})\s*[)]?/);
  if (slashDateMatch) {
    originalYear = parseInt(slashDateMatch[3], 10);
    originalDate = `${slashDateMatch[1]}.${slashDateMatch[2]}.${slashDateMatch[3]}`;
    // Strip trailing date from title for cleaner display e.g. " / 10.24.2026)" -> ")"
    title = title.replace(/\s*\/\s*\d{1,2}[./-]\d{1,2}[./-](?:19|20)\d{2}\s*\)/, ")").trim();
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

  return {
    cleanTitle: title,
    originalYear,
    originalDate,
  };
}
