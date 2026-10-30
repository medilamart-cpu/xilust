const STUDIO_LABELS: Record<string, string> = {
  teamskeet: "Team Skeet",
  teamskeetallstars: "Team Skeet Allstars",
  teamskeetsingles: "Team Skeet Singles",
  teamskeetselects: "Team Skeet Selects",
  teamskeetlabs: "Team Skeet Labs",
  teamskeetclassics: "Team Skeet Classics",
  teamskeetvip: "Team Skeet VIP",
  naughtyamerica: "Naughty America",
  evilangel: "Evil Angel",
  elegantangel: "Elegant Angel",
  blackedraw: "Blacked Raw",
  puretaboo: "Pure Taboo",
  julesjordan: "Jules Jordan",
  newsensations: "New Sensations",
  sweetheartvideo: "Sweetheart Video",
  realityjunkies: "Reality Junkies",
  backroomcastingcouch: "Backroom Casting Couch",
  touchmywife: "Touch My Wife",
  mylifeinmiami: "My Life In Miami",
  familytherapyxxx: "Family Therapy",
  familystrokes: "Family Strokes",
  mypervyfamily: "My Pervy Family",
  penthousegold: "Penthouse Gold",
  atkgirlfriends: "ATK Girlfriends",
  hussiepass: "Hussie Pass",
  immorallive: "Immoral Live",
  nubilefilms: "Nubile Films",
  jacquieetmicheltv: "Jacquie et Michel TV",
  loveherfeet: "Love Her Feet",
  cherrypimps: "Cherry Pimps",
  devilsfilm: "Devil's Film",
  deeplush: "Deep Lush",
  seehimfuck: "See Him Fuck",
  hotmilfsfuck: "Hot MILFs Fuck",
  freeusemilf: "FreeUse MILF",
  brattymilf: "Bratty MILF",
  stayhomemilf: "Stay Home MILF",
  latinamilf: "Latina MILF",
  milfslikeitbig: "MILFs Like It Big",
  milfpornsite: "MILF Porn Site",
  "50plusmilfs": "50+ MILFs",
  "50plusmilf": "50+ MILF",
  "60plusmilfs": "60+ MILFs",
  "8kmilfs": "8K MILFs",
};

/** Format known compact catalog labels for display without changing filter values. */
export function formatStudioLabel(value: string): string {
  if (!value) return "";
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (STUDIO_LABELS[key]) return STUDIO_LABELS[key];

  let cleaned = value.trim();

  // Pattern 1: Clean prefix like "50plusmilfs" -> "50+ MILFs", "8kmilfs" -> "8K MILFs"
  cleaned = cleaned.replace(/^(\d+)plus(.*)$/i, "$1+ $2");
  cleaned = cleaned.replace(/^(\d+k)(.*)$/i, "$1 $2");

  // Pattern 2: Replace trailing random numbers if any (e.g. "Studio123" -> "Studio")
  // Only strip trailing digits if preceded by a letter and not part of 4K/8K/1080p
  cleaned = cleaned.replace(/([a-zA-Z])\d{3,}$/, "$1");

  // Pattern 3: Capitalize standard MILF strings cleanly
  cleaned = cleaned.replace(/\bmilfs\b/gi, "MILFs").replace(/\bmilf\b/gi, "MILF");

  // Capitalize first letter of each word if all lowercase
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return cleaned;
}
