"use client";

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
  name: string;
  emoji: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: PlaylistItem[];
}

const PLAYLISTS_STORAGE_KEY = "xilust_user_playlists";

// Default starter playlists for new users
const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "pl_favorites",
    name: "Favorites",
    emoji: "🔥",
    description: "My all-time favorite videos",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  },
  {
    id: "pl_watch_later",
    name: "Watch Later",
    emoji: "🌙",
    description: "Saved to watch tonight",
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
      return parsed;
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

export function createPlaylist(name: string, emoji: string = "🎬", description: string = ""): Playlist {
  const current = getPlaylists();
  const cleanName = name.trim() || "Untitled Playlist";
  const newPl: Playlist = {
    id: "pl_" + Math.random().toString(36).substring(2, 9),
    name: cleanName,
    emoji: emoji || "🎬",
    description: description.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };
  const updated = [newPl, ...current];
  savePlaylists(updated);
  return newPl;
}

export function deletePlaylist(playlistId: string): void {
  const current = getPlaylists();
  const updated = current.filter((p) => p.id !== playlistId);
  savePlaylists(updated);
}

export function updatePlaylistMetadata(playlistId: string, name: string, emoji: string, description?: string): void {
  const current = getPlaylists();
  const updated = current.map((p) => {
    if (p.id === playlistId) {
      return {
        ...p,
        name: name.trim() || p.name,
        emoji: emoji || p.emoji,
        description: description !== undefined ? description.trim() : p.description,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
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
