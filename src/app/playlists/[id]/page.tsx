import { PlaylistDetailClient } from "./PlaylistDetailClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <PlaylistDetailClient id={resolvedParams.id} />;
}
