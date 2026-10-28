const STUDIO_LABELS: Record<string, string> = {
  teamskeet: "Team Skeet",
  teamskeetallstars: "Team Skeet Allstars",
  teamskeetsingles: "Team Skeet Singles",
  teamskeetselects: "Team Skeet Selects",
  teamskeetlabs: "Team Skeet Labs",
  teamskeetclassics: "Team Skeet Classics",
  teamskeetvip: "Team Skeet VIP",
};

/** Format known compact catalog labels for display without changing filter values. */
export function formatStudioLabel(value: string): string {
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return STUDIO_LABELS[key] || value.trim();
}
