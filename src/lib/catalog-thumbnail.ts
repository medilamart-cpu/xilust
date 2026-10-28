type CatalogThumbnailInput = {
  section: "lust" | "jax";
  slug?: string;
  thumbnail_url?: string | null;
  cover_url?: string | null;
};

export function getCatalogThumbnailUrls(item: CatalogThumbnailInput, baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const rawPath = item.thumbnail_url?.trim().replace(/^\/+/, "") ?? "";
  const catalogPath = rawPath
    ? rawPath.startsWith("thumbs/")
      ? rawPath
      : `thumbs/${rawPath}`
    : "";
  const coverUrl = item.cover_url?.trim() || null;

  if (item.section === "lust") {
    // Lust thumbnails are split between nested catalog paths and legacy flat files.
    const nestedUrl = catalogPath ? `${base}/${catalogPath}` : null;
    const flatUrl = item.slug ? `${base}/${item.slug}.webp` : null;
    return {
      posterUrl: nestedUrl ?? flatUrl,
      fallbackUrl: flatUrl && flatUrl !== nestedUrl ? flatUrl : coverUrl,
    };
  }

  return {
    posterUrl: catalogPath ? `${base}/${catalogPath}` : coverUrl,
    fallbackUrl: coverUrl,
  };
}
