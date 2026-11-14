export interface PlaylistItem {
  id: string;
  title: string;
  slug: string;
  section: string;
  thumbnailUrl?: string;
  coverUrl?: string;
  duration?: string;
  addedAt: string;
}

export interface Playlist {
  id: string;
  slug: string;
  name: string;
  description?: string;
  emoji: string;
  visibility: "public" | "private";
  coverMode: "mosaic" | "custom" | "first_video";
  customCoverUrl?: string;
  authorName: string;
  authorId?: string;
  authorAvatar?: string;
  rating: number;         // e.g. 4.88
  ratingCount: number;    // e.g. 142
  views: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  items: PlaylistItem[];
}

const PLAYLISTS_STORAGE_KEY = "xilust_user_playlists";
const PLAYLIST_RATINGS_STORAGE_KEY = "xilust_user_playlist_ratings";

// Community Curated Seed Playlists (Rich realistic data modeled like Chikari.moe)
export const COMMUNITY_PLAYLISTS: Playlist[] = [
  {
    id: "comm_jav_subs_vault",
    slug: "top-english-subbed-jav-masterpieces",
    name: "Top English Subbed JAV Masterpieces",
    description: "Curated collection of the most acclaimed narrative English subbed JAV releases featuring Yua Mikami, Mina Kitano, and Suzume Mino.",
    emoji: "🌸",
    visibility: "public",
    coverMode: "mosaic",
    authorName: "ChikariCurator",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    rating: 4.92,
    ratingCount: 318,
    views: 14250,
    tags: ["English Subbed", "Drama", "Yua Mikami", "4K"],
    createdAt: "2026-01-15T12:00:00Z",
    updatedAt: "2026-03-20T16:30:00Z",
    items: [
      {
        id: "ssni-344",
        slug: "ssni-344-english-subbed-ever-since-that-day-when-my-father-in-law-rped-me-yua",
        title: "[SSNI-344-SUBS] (English subbed) Ever Since That Day When My Father-In-Law R*ped Me… Yua Mikami",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2018/11/ssni344pl.jpg",
        thumbnailUrl: "/thumbs/2019/48870-ssni-344.jpg",
        duration: "2h 15m",
        addedAt: "2026-01-15T12:00:00Z",
      },
      {
        id: "eyan-181",
        slug: "eyan-181-english-subbed-my-older-sister-is-a-young-mama-breastfeeding-in-our-parents-home-live-version",
        title: "[EYAN-181-SUBS] (English subbed) My Older Sister Is A Young Mama Breastfeeding In Our Parents’ Home. Live Version. Mina Kitano",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2022/05/eyan181pl.jpg",
        thumbnailUrl: "/thumbs/2022/193858-eyan-181.jpg",
        duration: "2h 05m",
        addedAt: "2026-01-16T14:20:00Z",
      },
      {
        id: "dldss-030",
        slug: "dldss-030-english-subbed-my-sister-who-had-sex-with-me-every-day-during-my-adolescence-is-back-home-today-suzume-mino",
        title: "[DLDSS-030-SUBS] (English subbed) My Sister Who Had Sex with me Every Day During My Adolescence Is back Home Today. Suzume Mino",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2023/05/1dldss030pl.jpg",
        thumbnailUrl: "/thumbs/2023/270960-dldss-030.jpg",
        duration: "1h 55m",
        addedAt: "2026-01-18T09:10:00Z",
      },
      {
        id: "ure-088",
        slug: "ure-088-english-subbed-vicepresident-mami-ichinose-the-married-woman-of-the-neighborhood-association-was-very-h-ryo-ayumi-original",
        title: "[URE-088-SUBS] (English subbed) (4K) Vicepresident Mami Ichinose – The married woman of the neighborhood association was very H… Ryo Ayumi",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2022/12/ure088pl.jpg",
        thumbnailUrl: "/thumbs/2022/242080-ure-088.jpg",
        duration: "2h 20m",
        addedAt: "2026-01-20T11:45:00Z",
      },
      {
        id: "mimk-052",
        slug: "mimk-052-english-subbed",
        title: "[MIMK-052-SUBS] (English subbed) Your Chubby Skins Feels So Good Auntie – Auntie Is The Perfect Wanking Tool – Hana Haruna",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2018/10/mimk052pl.jpg",
        thumbnailUrl: "/thumbs/2018/38165-mimk-052.jpg",
        duration: "2h 00m",
        addedAt: "2026-01-22T08:30:00Z",
      },
    ],
  },
  {
    id: "comm_late_night_curated",
    slug: "late-night-cinema-curated-selection",
    name: "Late Night Cinema: Essential Western Hits",
    description: "High-definition Western studio masterworks, POV experiences, and top viral features curated for uninterrupted midnight streaming.",
    emoji: "🌙",
    visibility: "public",
    coverMode: "mosaic",
    authorName: "VelvetCinema",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    rating: 4.84,
    ratingCount: 204,
    views: 9810,
    tags: ["Western", "POV", "HD", "Trending"],
    createdAt: "2026-02-01T18:00:00Z",
    updatedAt: "2026-03-18T22:10:00Z",
    items: [
      {
        id: "lust-sophie-sleepover",
        slug: "sophie-rain-s-sleepover-with-her-lusty-friends",
        title: "Sophie Rain's Sleepover With Her Lusty Friends",
        section: "lust",
        coverUrl: "https://xithumbs.duckdns.org/sophie-rain-s-sleepover-with-her-lusty-friends.webp",
        thumbnailUrl: "https://xithumbs.duckdns.org/sophie-rain-s-sleepover-with-her-lusty-friends.webp",
        duration: "42m",
        addedAt: "2026-02-01T18:00:00Z",
      },
      {
        id: "lust-clarablanc",
        slug: "clarablanc-looks-hot-in-black-lace-lingerie",
        title: "Clarablanc Looks Hot In Black Lace Lingerie",
        section: "lust",
        coverUrl: "https://xithumbs.duckdns.org/clarablanc-looks-hot-in-black-lace-lingerie.webp",
        thumbnailUrl: "https://xithumbs.duckdns.org/clarablanc-looks-hot-in-black-lace-lingerie.webp",
        duration: "38m",
        addedAt: "2026-02-02T19:20:00Z",
      },
      {
        id: "lust-nikitalaiss",
        slug: "nikitalaiss-kattedoll-catawaiss-and-jadeemoon-in-fivesome",
        title: "Nikitalaiss, Kattedoll, Catawaiss And JadeeMoon In Fivesome",
        section: "lust",
        coverUrl: "https://xithumbs.duckdns.org/nikitalaiss-kattedoll-catawaiss-and-jadeemoon-in-fivesome.webp",
        thumbnailUrl: "https://xithumbs.duckdns.org/nikitalaiss-kattedoll-catawaiss-and-jadeemoon-in-fivesome.webp",
        duration: "55m",
        addedAt: "2026-02-05T20:10:00Z",
      },
      {
        id: "lust-bonnie-blue",
        slug: "bonnie-blue-1000-men-in-twenty-four-hours-record",
        title: "Bonnie Blue's 1000 Men In Twenty Four Hours Record",
        section: "lust",
        coverUrl: "https://xithumbs.duckdns.org/bonnie-blue-1000-men-in-twenty-four-hours-record.webp",
        thumbnailUrl: "https://xithumbs.duckdns.org/bonnie-blue-1000-men-in-twenty-four-hours-record.webp",
        duration: "1h 12m",
        addedAt: "2026-02-08T15:40:00Z",
      },
    ],
  },
  {
    id: "comm_staff_picks",
    slug: "staff-picks-s-tier-cinema",
    name: "Staff Picks: S-Tier Premium Releases",
    description: "Hand-selected by XiLust editors: exceptional cinematography, unmatched performance chemistry, and pristine 4K video resolution.",
    emoji: "⭐",
    visibility: "public",
    coverMode: "mosaic",
    authorName: "XiLustEditorial",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    rating: 4.96,
    ratingCount: 420,
    views: 22400,
    tags: ["Staff Pick", "4K", "Cinematic", "S-Tier"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-22T10:00:00Z",
    items: [
      {
        id: "ure-088-staff",
        slug: "ure-088-english-subbed-vicepresident-mami-ichinose-the-married-woman-of-the-neighborhood-association-was-very-h-ryo-ayumi-original",
        title: "[URE-088-SUBS] (English subbed) (4K) Vicepresident Mami Ichinose – The married woman of the neighborhood association",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2022/12/ure088pl.jpg",
        thumbnailUrl: "/thumbs/2022/242080-ure-088.jpg",
        duration: "2h 20m",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "ssni-344-staff",
        slug: "ssni-344-english-subbed-ever-since-that-day-when-my-father-in-law-rped-me-yua",
        title: "[SSNI-344-SUBS] (English subbed) Ever Since That Day When My Father-In-Law R*ped Me… Yua Mikami",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2018/11/ssni344pl.jpg",
        thumbnailUrl: "/thumbs/2019/48870-ssni-344.jpg",
        duration: "2h 15m",
        addedAt: "2026-01-02T00:00:00Z",
      },
      {
        id: "lust-sophie-staff",
        slug: "sophie-rain-s-sleepover-with-her-lusty-friends",
        title: "Sophie Rain's Sleepover With Her Lusty Friends",
        section: "lust",
        coverUrl: "https://xithumbs.duckdns.org/sophie-rain-s-sleepover-with-her-lusty-friends.webp",
        thumbnailUrl: "https://xithumbs.duckdns.org/sophie-rain-s-sleepover-with-her-lusty-friends.webp",
        duration: "42m",
        addedAt: "2026-01-03T00:00:00Z",
      },
      {
        id: "eyan-181-staff",
        slug: "eyan-181-english-subbed-my-older-sister-is-a-young-mama-breastfeeding-in-our-parents-home-live-version",
        title: "[EYAN-181-SUBS] (English subbed) My Older Sister Is A Young Mama Breastfeeding In Our Parents’ Home",
        section: "jax",
        coverUrl: "https://cdn.javmiku.com/wp-content/uploads/2022/05/eyan181pl.jpg",
        thumbnailUrl: "/thumbs/2022/193858-eyan-181.jpg",
        duration: "2h 05m",
        addedAt: "2026-01-04T00:00:00Z",
      },
    ],
  },
];

// Default starter playlists for new users
const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "pl_favorites",
    slug: "my-favorites",
    name: "Favorites",
    emoji: "🔥",
    description: "My all-time favorite videos",
    visibility: "private",
    coverMode: "mosaic",
    authorName: "You",
    authorId: "user_me",
    rating: 5.0,
    ratingCount: 1,
    views: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  },
  {
    id: "pl_watch_later",
    slug: "watch-later",
    name: "Watch Later",
    emoji: "🌙",
    description: "Saved to watch tonight",
    visibility: "private",
    coverMode: "mosaic",
    authorName: "You",
    authorId: "user_me",
    rating: 5.0,
    ratingCount: 1,
    views: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  },
];

export function getPlaylists(): Playlist[] {
  if (typeof window === "undefined") return DEFAULT_PLAYLISTS;
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(DEFAULT_PLAYLISTS));
      return DEFAULT_PLAYLISTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure existing items adhere to expanded schema
      return parsed.map((p) => ({
        ...p,
        visibility: p.visibility || "private",
        coverMode: p.coverMode || "mosaic",
        authorName: p.authorName || "You",
        authorId: p.authorId || "user_me",
        rating: p.rating ?? 5.0,
        ratingCount: p.ratingCount ?? 1,
        views: p.views ?? 1,
      }));
    }
    return DEFAULT_PLAYLISTS;
  } catch (e) {
    console.warn("Failed to read playlists:", e);
    return DEFAULT_PLAYLISTS;
  }
}

export function savePlaylists(playlists: Playlist[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    window.dispatchEvent(new CustomEvent("playlists-change", { detail: playlists }));
  } catch (e) {
    console.error("Failed to save playlists:", e);
  }
}

export function getCommunityPlaylists(
  filter: "trending" | "top" | "recent" | "staff" = "trending",
  limit: number = 6
): Playlist[] {
  // Combine Community seed with any public playlists created by the user
  const userPlaylists = getPlaylists().filter((p) => p.visibility === "public");
  const combined = [...COMMUNITY_PLAYLISTS, ...userPlaylists];

  switch (filter) {
    case "top":
      return [...combined].sort((a, b) => b.rating - a.rating).slice(0, limit);
    case "recent":
      return [...combined].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, limit);
    case "staff":
      return combined.filter((p) => p.tags?.includes("Staff Pick")).concat(combined).slice(0, limit);
    case "trending":
    default:
      return [...combined].sort((a, b) => b.views - a.views).slice(0, limit);
  }
}

export function getPlaylistById(idOrSlug: string): Playlist | null {
  // 1. Search in user personal playlists
  const personal = getPlaylists();
  const match = personal.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (match) return match;

  // 2. Search in community playlists
  const commMatch = COMMUNITY_PLAYLISTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  return commMatch || null;
}

export function createPlaylist(
  name: string,
  emoji: string = "🎬",
  description: string = "",
  visibility: "public" | "private" = "private",
  authorName: string = "Curator"
): Playlist {
  const current = getPlaylists();
  const cleanName = name.trim() || "Untitled Playlist";
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const newPl: Playlist = {
    id: "pl_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4),
    slug: slug ? `${slug}-${Math.random().toString(36).substring(2, 6)}` : `playlist-${Date.now().toString(36)}`,
    name: cleanName,
    emoji: emoji || "🎬",
    description: description.trim(),
    visibility,
    coverMode: "mosaic",
    authorName: authorName.trim() || "Curator",
    authorId: "user_me",
    rating: 5.0,
    ratingCount: 1,
    views: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };

  const updated = [newPl, ...current];
  savePlaylists(updated);
  return newPl;
}

export function updatePlaylistMetadata(
  playlistId: string,
  name: string,
  emoji: string,
  description?: string,
  visibility?: "public" | "private"
): void {
  const current = getPlaylists();
  const updated = current.map((p) => {
    if (p.id === playlistId) {
      return {
        ...p,
        name: name.trim() || p.name,
        emoji: emoji || p.emoji,
        description: description !== undefined ? description.trim() : p.description,
        visibility: visibility || p.visibility || "private",
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  savePlaylists(updated);
}

export function setPlaylistVisibility(playlistId: string, visibility: "public" | "private"): void {
  const current = getPlaylists();
  const updated = current.map((p) => {
    if (p.id === playlistId) {
      return {
        ...p,
        visibility,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  savePlaylists(updated);
}

export function deletePlaylist(playlistId: string): void {
  const current = getPlaylists();
  const updated = current.filter((p) => p.id !== playlistId);
  savePlaylists(updated);
}

export function addToPlaylist(playlistId: string, item: Omit<PlaylistItem, "addedAt">): boolean {
  const current = getPlaylists();
  let changed = false;
  const updated = current.map((p) => {
    if (p.id === playlistId) {
      const exists = p.items.some((i) => i.id === item.id || (i.slug && i.slug === item.slug));
      if (!exists) {
        changed = true;
        return {
          ...p,
          updatedAt: new Date().toISOString(),
          items: [{ ...item, addedAt: new Date().toISOString() }, ...p.items],
        };
      }
    }
    return p;
  });
  if (changed) {
    savePlaylists(updated);
  }
  return changed;
}

export function removeFromPlaylist(playlistId: string, itemIdOrSlug: string): void {
  const current = getPlaylists();
  const updated = current.map((p) => {
    if (p.id === playlistId) {
      return {
        ...p,
        updatedAt: new Date().toISOString(),
        items: p.items.filter((i) => i.id !== itemIdOrSlug && i.slug !== itemIdOrSlug),
      };
    }
    return p;
  });
  savePlaylists(updated);
}

export function togglePlaylistItem(playlistId: string, item: Omit<PlaylistItem, "addedAt">): boolean {
  const current = getPlaylists();
  const target = current.find((p) => p.id === playlistId);
  if (!target) return false;

  const exists = target.items.some((i) => i.id === item.id || (i.slug && i.slug === item.slug));
  if (exists) {
    removeFromPlaylist(playlistId, item.id || item.slug);
    return false; // Removed
  } else {
    addToPlaylist(playlistId, item);
    return true; // Added
  }
}

export function reorderPlaylistItems(playlistId: string, fromIndex: number, toIndex: number): void {
  const current = getPlaylists();
  const updated = current.map((p) => {
    if (p.id === playlistId) {
      const newItems = [...p.items];
      if (fromIndex < 0 || fromIndex >= newItems.length || toIndex < 0 || toIndex >= newItems.length) {
        return p;
      }
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, moved);
      return {
        ...p,
        items: newItems,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  savePlaylists(updated);
}

export function getUserPlaylistRating(playlistId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYLIST_RATINGS_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return typeof map[playlistId] === "number" ? map[playlistId] : null;
  } catch {
    return null;
  }
}

export function ratePlaylist(
  playlistId: string,
  userStars: number
): { success: boolean; newRating: number; newCount: number } {
  if (typeof window === "undefined") {
    return { success: false, newRating: 5.0, newCount: 1 };
  }

  const boundedScore = Math.min(5, Math.max(1, Math.round(userStars)));
  let ratingsMap: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(PLAYLIST_RATINGS_STORAGE_KEY);
    if (raw) ratingsMap = JSON.parse(raw);
  } catch {
    ratingsMap = {};
  }

  const existingVote = ratingsMap[playlistId];
  ratingsMap[playlistId] = boundedScore;
  localStorage.setItem(PLAYLIST_RATINGS_STORAGE_KEY, JSON.stringify(ratingsMap));

  // Find playlist in user storage or community storage
  const currentPlaylists = getPlaylists();
  const foundUserPl = currentPlaylists.find((p) => p.id === playlistId);

  let newRating = 5.0;
  let newCount = 1;

  if (foundUserPl) {
    if (existingVote !== undefined) {
      // Update existing vote
      const currentSum = foundUserPl.rating * foundUserPl.ratingCount;
      const updatedSum = currentSum - existingVote + boundedScore;
      newCount = foundUserPl.ratingCount;
      newRating = Number((updatedSum / newCount).toFixed(2));
    } else {
      // New vote
      const currentSum = foundUserPl.rating * foundUserPl.ratingCount;
      newCount = foundUserPl.ratingCount + 1;
      newRating = Number(((currentSum + boundedScore) / newCount).toFixed(2));
    }

    const updated = currentPlaylists.map((p) =>
      p.id === playlistId ? { ...p, rating: newRating, ratingCount: newCount } : p
    );
    savePlaylists(updated);
  } else {
    // Check community playlists
    const commPl = COMMUNITY_PLAYLISTS.find((p) => p.id === playlistId);
    if (commPl) {
      if (existingVote !== undefined) {
        const currentSum = commPl.rating * commPl.ratingCount;
        newCount = commPl.ratingCount;
        newRating = Number(((currentSum - existingVote + boundedScore) / newCount).toFixed(2));
      } else {
        const currentSum = commPl.rating * commPl.ratingCount;
        newCount = commPl.ratingCount + 1;
        newRating = Number(((currentSum + boundedScore) / newCount).toFixed(2));
      }
      commPl.rating = newRating;
      commPl.ratingCount = newCount;
    }
  }

  window.dispatchEvent(
    new CustomEvent("playlist-rated", {
      detail: { playlistId, rating: newRating, ratingCount: newCount, userRating: boundedScore },
    })
  );

  return { success: true, newRating, newCount };
}

export function duplicatePlaylistToPersonal(source: Playlist): Playlist {
  const cleanName = `${source.name} (Copy)`;
  const newPl = createPlaylist(
    cleanName,
    source.emoji,
    source.description || `Cloned from @${source.authorName}`,
    "private",
    "You"
  );

  // Copy all items
  source.items.forEach((item) => {
    addToPlaylist(newPl.id, {
      id: item.id,
      title: item.title,
      slug: item.slug,
      section: item.section,
      thumbnailUrl: item.thumbnailUrl,
      coverUrl: item.coverUrl,
      duration: item.duration,
    });
  });

  return newPl;
}
