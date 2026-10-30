type CatalogThumbnailInput = {
  section: "lust" | "jax" | "fans";
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
    // Prefer the hosted catalog thumbnail, then the original catalog cover.
    const nestedUrl = catalogPath ? `${base}/${catalogPath}` : null;
    const flatUrl = item.slug ? `${base}/${item.slug}.webp` : null;
    return {
      posterUrl: nestedUrl ?? coverUrl ?? flatUrl,
      fallbackUrl: coverUrl && coverUrl !== nestedUrl ? coverUrl : flatUrl && flatUrl !== nestedUrl ? flatUrl : null,
    };
  }

  return {
    posterUrl: catalogPath ? `${base}/${catalogPath}` : coverUrl,
    fallbackUrl: coverUrl,
  };
}
