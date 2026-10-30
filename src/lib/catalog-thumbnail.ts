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
  const catalogPath = rawPath
    ? /^https?:\/\//i.test(rawPath)
      ? rawPath
      : rawPath.startsWith("thumbs/")
        ? `${base}/${rawPath}`
        : `${base}/thumbs/${rawPath}`
    : "";
  const coverUrl = item.cover_url?.trim() || null;

  if (item.section === "lust") {
    // Prefer the hosted catalog thumbnail, then the original catalog cover.
    const nestedUrl = catalogPath || null;
    const flatUrl = item.slug ? `${base}/${item.slug}.webp` : null;
    return {
      posterUrl: flatUrl ?? coverUrl ?? nestedUrl,
      fallbackUrl: nestedUrl && nestedUrl !== flatUrl ? nestedUrl : coverUrl && coverUrl !== flatUrl ? coverUrl : null,
    };
  }

  return {
    posterUrl: catalogPath || coverUrl,
    fallbackUrl: coverUrl,
  };
}
