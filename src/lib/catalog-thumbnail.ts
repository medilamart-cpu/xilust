type CatalogThumbnailInput = {
  section: "lust" | "jax" | "fans";
  slug?: string;
  thumbnail_url?: string | null;
  cover_url?: string | null;
};

export function getCatalogThumbnailUrls(item: CatalogThumbnailInput, baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const rawThumbnail = item.thumbnail_url?.trim() ?? "";
  const rawPath = rawThumbnail.replace(/^\/+/, "");
  const coverUrl = item.cover_url?.trim() || null;

  if (item.section === "lust") {
    // 1. Upgraded Porndish master thumbnail (675x425 HD)
    if (rawPath.includes("porndish")) {
      const cleanSubPath = rawPath.startsWith("thumbs/") ? rawPath.slice(7) : rawPath;
      const hqUrl = `${base}/thumbs/${cleanSubPath}`;
      const flatFallback = item.slug ? `${base}/${item.slug}.webp` : coverUrl;
      return {
        posterUrl: hqUrl,
        fallbackUrl: flatFallback && flatFallback !== hqUrl ? flatFallback : coverUrl,
      };
    }

    // 2. Standard XMovies catalog thumbnail: stored flat at VPS root /thumbs/{slug}.webp
    const flatUrl = item.slug ? `${base}/${item.slug}.webp` : null;
    const fallbackPath = rawPath
      ? /^https?:\/\//i.test(rawPath)
        ? rawPath
        : rawPath.startsWith("thumbs/")
          ? `${base}/${rawPath}`
          : `${base}/thumbs/${rawPath}`
      : coverUrl;

    return {
      posterUrl: flatUrl || fallbackPath || coverUrl,
      fallbackUrl: fallbackPath && fallbackPath !== flatUrl ? fallbackPath : coverUrl,
    };
  }

  // Jax and Fans sections
  const catalogPath = rawPath
    ? /^https?:\/\//i.test(rawPath)
      ? rawPath
      : rawPath.startsWith("thumbs/")
        ? `${base}/${rawPath}`
        : `${base}/thumbs/${rawPath}`
    : "";

  return {
    posterUrl: catalogPath || coverUrl,
    fallbackUrl: coverUrl && coverUrl !== catalogPath ? coverUrl : null,
  };
}
