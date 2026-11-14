"use client";

import React, { useMemo } from "react";
import { Sparkles, Film } from "lucide-react";

export type TypographyThemeKey =
  | "biohazard"
  | "chiseled"
  | "cyberpunk"
  | "gold_luxury"
  | "tokyo_sakura"
  | "candy_pop"
  | "inferno"
  | "amethyst_noir";

export interface ThemedTitleProps {
  title: string;
  studio?: string | null;
  section?: "lust" | "jax" | "fans";
  code?: string | null;
  className?: string;
  size?: "hero" | "card" | "detail";
}

interface ThemeConfig {
  key: TypographyThemeKey;
  badgeLabel: string;
  badgeClass: string;
  dotColor: string;
}

const THEMES: Record<TypographyThemeKey, ThemeConfig> = {
  biohazard: {
    key: "biohazard",
    badgeLabel: "BIOHAZARD THRILLER",
    badgeClass: "bg-red-950/70 border-red-500/50 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.35)]",
    dotColor: "bg-red-400",
  },
  chiseled: {
    key: "chiseled",
    badgeLabel: "TITAN COLOSSUS",
    badgeClass: "bg-zinc-900/80 border-zinc-400/50 text-zinc-100 shadow-[0_0_12px_rgba(161,161,170,0.2)]",
    dotColor: "bg-zinc-300",
  },
  cyberpunk: {
    key: "cyberpunk",
    badgeLabel: "CYBERPUNK NEON",
    badgeClass: "bg-cyan-950/70 border-cyan-400/50 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.35)]",
    dotColor: "bg-cyan-400",
  },
  gold_luxury: {
    key: "gold_luxury",
    badgeLabel: "24K LUXURY HAUTE",
    badgeClass: "bg-amber-950/70 border-amber-400/50 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.35)]",
    dotColor: "bg-amber-400",
  },
  tokyo_sakura: {
    key: "tokyo_sakura",
    badgeLabel: "TOKYO NIGHT SAKURA",
    badgeClass: "bg-pink-950/70 border-pink-400/50 text-pink-200 shadow-[0_0_14px_rgba(244,114,182,0.35)]",
    dotColor: "bg-pink-400",
  },
  candy_pop: {
    key: "candy_pop",
    badgeLabel: "SWEET CANDY POP",
    badgeClass: "bg-emerald-950/70 border-emerald-400/50 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.35)]",
    dotColor: "bg-emerald-400",
  },
  inferno: {
    key: "inferno",
    badgeLabel: "INFERNO MAGMA",
    badgeClass: "bg-orange-950/70 border-orange-400/50 text-orange-200 shadow-[0_0_14px_rgba(249,115,22,0.35)]",
    dotColor: "bg-orange-400",
  },
  amethyst_noir: {
    key: "amethyst_noir",
    badgeLabel: "AMETHYST NOIR",
    badgeClass: "bg-purple-950/70 border-purple-400/50 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.35)]",
    dotColor: "bg-purple-400",
  },
};

const THEME_KEYS = Object.keys(THEMES) as TypographyThemeKey[];

export function resolveTheme(
  title: string = "",
  studio?: string | null,
  section?: "lust" | "jax" | "fans",
  code?: string | null
): ThemeConfig {
  const t = title.toLowerCase();
  const s = (studio || "").toLowerCase();
  const c = (code || "").toLowerCase();

  // 1. Biohazard / Zombie / Outbreak
  if (/(?:biohazard|outbreak|zombie|virus|toxic|apocalypse|hazard|infected|decay|parasite|mutant)/.test(t)) {
    return THEMES.biohazard;
  }

  // 2. Titan / Stone / Heavy
  if (/(?:titan|stone|granite|rock|concrete|colossus|heavy|armor|smash)/.test(t)) {
    return THEMES.chiseled;
  }

  // 3. Cyberpunk / Sci-Fi Neon Pulse
  if (/(?:cyber|matrix|neon|future|futuristic|vr|tech|glitch|synth|ai|laser|virtual)/.test(t)) {
    return THEMES.cyberpunk;
  }

  // 4. 24K Haute Luxury / Bellesa
  if (s.includes("bellesa") || /(?:luxury|royalty|queen|goddess|gold|golden|champagne|elegance|sensual|silk|couture)/.test(t)) {
    return THEMES.gold_luxury;
  }

  // 5. Tokyo Sakura JAV Neon
  if (section === "jax" || /(?:s1|moodyz|sod|prestige|ideapocket|attackers|madonna|kawaii|tokyo|sakura|japan|japanese|subbed|uncensored)/.test(s + " " + t + " " + c)) {
    return THEMES.tokyo_sakura;
  }

  // 6. Sweet Candy Pop / Pastel Glamour
  if (s.includes("babes") || s.includes("twistys") || /(?:sweet|candy|teen|petite|cute|cherry|peach|honey|angel|bubble|pink)/.test(t)) {
    return THEMES.candy_pop;
  }

  // 7. Inferno / Hardcore Heat / Brazzers
  if (s.includes("brazzers") || s.includes("rkprime") || s.includes("evil angel") || /(?:fire|burn|heat|wild|extreme|raw|taboo|wicked|naughty|lust|hardcore)/.test(t)) {
    return THEMES.inferno;
  }

  // 8. Amethyst Velvet Noir / Vixen Media Group
  if (s.includes("vixen") || s.includes("blacked") || s.includes("tushy") || s.includes("deeper") || s.includes("slayed") || /(?:midnight|shadow|noir|dream|siren|mystery|stars|velvet|violet)/.test(t)) {
    return THEMES.amethyst_noir;
  }

  // Fallback hash distribution across themes
  let hash = 0;
  const str = `${title}-${studio || ""}-${code || ""}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % THEME_KEYS.length;
  return THEMES[THEME_KEYS[index]];
}

/**
 * Pure Cinema Minimalist Title:
 * High-contrast solid white typography with crisp letterspacing.
 */
export function ThemedTitle({
  title,
  className = "",
  size = "hero",
}: ThemedTitleProps) {
  const sizeClass =
    size === "hero"
      ? "text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]"
      : size === "detail"
      ? "text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug"
      : "text-base sm:text-lg font-bold leading-snug";

  return (
    <h1
      className={`font-display text-white text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] line-clamp-2 ${sizeClass} ${className}`}
    >
      {title}
    </h1>
  );
}

/**
 * Colourful Themed Studio & Performer Badge (Present on Live Website)
 */
export function ThemedThemeBadge({
  title = "",
  studio,
  section,
  code,
}: {
  title?: string;
  studio?: string | null;
  section?: "lust" | "jax" | "fans";
  code?: string | null;
}) {
  const theme = useMemo(
    () => resolveTheme(title, studio, section, code),
    [title, studio, section, code]
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase backdrop-blur-md transition-all duration-300 shadow-md ${theme.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${theme.dotColor}`} />
      <span>{studio || theme.badgeLabel}</span>
    </span>
  );
}
