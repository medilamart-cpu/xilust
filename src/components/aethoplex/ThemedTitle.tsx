"use client";

import React, { useMemo } from "react";

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
  eyebrow: string;
  badgeLabel: string;
  fontFamilyClass: string;
  titleClass: string;
  badgeClass: string;
  decorElement?: React.ReactNode;
}

const THEMES: Record<TypographyThemeKey, ThemeConfig> = {
  biohazard: {
    key: "biohazard",
    eyebrow: "☣ BIOHAZARD PROTOCOL // LEVEL-4 OUTBREAK",
    badgeLabel: "BIOHAZARD THRILLER",
    fontFamilyClass: "font-biohazard tracking-[0.06em] uppercase",
    titleClass:
      "bg-gradient-to-r from-red-600 via-rose-500 via-50% to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(220,38,38,0.9)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.98)]",
    badgeClass:
      "bg-red-950/60 border-red-500/50 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.4)] backdrop-blur-md",
  },
  chiseled: {
    key: "chiseled",
    eyebrow: "⬡ TITAN COLOSSUS // 3D CHISELED STONE",
    badgeLabel: "3D CHISELED STONE",
    fontFamilyClass: "font-chiseled uppercase tracking-normal text-shadow-chiseled",
    titleClass:
      "bg-gradient-to-b from-white via-zinc-200 via-45% to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]",
    badgeClass:
      "bg-zinc-900/70 border-zinc-500/50 text-zinc-100 shadow-[0_0_14px_rgba(161,161,170,0.25)] backdrop-blur-md",
  },
  cyberpunk: {
    key: "cyberpunk",
    eyebrow: "⚡ CYBER_GRID // NEON SYNTH PULSE v2.4",
    badgeLabel: "CYBERPUNK NEON",
    fontFamilyClass: "font-cyberpunk tracking-[0.14em] uppercase text-shadow-cyberpunk",
    titleClass:
      "bg-gradient-to-r from-cyan-300 via-sky-300 via-40% to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.9)]",
    badgeClass:
      "bg-cyan-950/60 border-cyan-400/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.45)] backdrop-blur-md",
  },
  gold_luxury: {
    key: "gold_luxury",
    eyebrow: "✦ 24K HAUTE LUXURY // PRIVATE RESERVE ✦",
    badgeLabel: "24K LUXURY HAUTE",
    fontFamilyClass: "font-luxury italic font-bold tracking-wide",
    titleClass:
      "bg-gradient-to-r from-[#fff9e6] via-[#ffd700] via-45% to-[#d4af37] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(245,158,11,0.7)] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]",
    badgeClass:
      "bg-amber-950/60 border-amber-400/50 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.4)] backdrop-blur-md",
  },
  tokyo_sakura: {
    key: "tokyo_sakura",
    eyebrow: "🌸 特選 TOKYO NIGHTS // 独占配信 4K JAV",
    badgeLabel: "TOKYO NIGHT SAKURA",
    fontFamilyClass: "font-tokyo uppercase tracking-[0.08em] text-stroke-tokyo",
    titleClass:
      "bg-gradient-to-r from-pink-300 via-rose-300 via-50% to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(244,114,182,0.9)]",
    badgeClass:
      "bg-pink-950/60 border-pink-400/50 text-pink-200 shadow-[0_0_16px_rgba(244,114,182,0.4)] backdrop-blur-md",
  },
  candy_pop: {
    key: "candy_pop",
    eyebrow: "🍭 SWEET CANDY POP // PASTEL GLAMOUR",
    badgeLabel: "SWEET CANDY POP",
    fontFamilyClass: "font-candy tracking-wide",
    titleClass:
      "bg-gradient-to-r from-emerald-300 via-teal-200 via-50% to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(52,211,153,0.75)] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]",
    badgeClass:
      "bg-emerald-950/60 border-emerald-400/50 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.4)] backdrop-blur-md",
  },
  inferno: {
    key: "inferno",
    eyebrow: "🔥 REDLINE INFERNO // MAXIMUM HEAT",
    badgeLabel: "INFERNO MAGMA",
    fontFamilyClass: "font-inferno italic uppercase tracking-normal",
    titleClass:
      "bg-gradient-to-r from-yellow-200 via-orange-500 via-45% to-red-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(249,115,22,0.9)] drop-shadow-[0_4px_18px_rgba(0,0,0,0.98)]",
    badgeClass:
      "bg-orange-950/60 border-orange-400/50 text-orange-200 shadow-[0_0_16px_rgba(249,115,22,0.45)] backdrop-blur-md",
  },
  amethyst_noir: {
    key: "amethyst_noir",
    eyebrow: "✦ AMETHYST NOIR // VELVET FANTASY ✦",
    badgeLabel: "AMETHYST NOIR",
    fontFamilyClass: "font-amethyst uppercase tracking-[0.18em]",
    titleClass:
      "bg-gradient-to-r from-purple-200 via-violet-300 via-50% to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(167,139,250,0.85)] drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]",
    badgeClass:
      "bg-purple-950/60 border-purple-400/50 text-purple-200 shadow-[0_0_16px_rgba(167,139,250,0.4)] backdrop-blur-md",
  },
};

const THEME_KEYS: TypographyThemeKey[] = [
  "biohazard",
  "chiseled",
  "cyberpunk",
  "gold_luxury",
  "tokyo_sakura",
  "candy_pop",
  "inferno",
  "amethyst_noir",
];

export function resolveTheme(
  title: string,
  studio?: string | null,
  section?: "lust" | "jax" | "fans",
  code?: string | null
): ThemeConfig {
  const t = (title || "").toLowerCase();
  const s = (studio || "").toLowerCase();
  const c = (code || "").toLowerCase();

  // 1. Horror / Biohazard / Gothic / Dark Thriller (Resident Evil archetype)
  if (
    /(?:resident|evil|biohazard|horror|blood|dark|zombie|gothic|nightmare|demon|curse|creepy|sinister|haunted|dead|killer|slasher)/.test(
      t
    )
  ) {
    return THEMES.biohazard;
  }

  // 2. Chiseled / Heavy Brutalist / Clayface / Titan (Clayface archetype)
  if (
    /(?:clayface|batman|titan|beast|stone|iron|heavy|brutal|colossus|steel|monster|smash|shatter|armor|concrete|rock)/.test(
      t
    )
  ) {
    return THEMES.chiseled;
  }

  // 3. Cyberpunk / Sci-Fi Neon Pulse
  if (
    /(?:cyber|matrix|neon|future|futuristic|vr|tech|glitch|bot|synth|ai|wire|electric|pulse|laser|virtual|hacker)/.test(
      t
    )
  ) {
    return THEMES.cyberpunk;
  }

  // 4. 24K Haute Luxury / Bellesa
  if (
    s.includes("bellesa") ||
    /(?:luxury|royalty|queen|goddess|gold|golden|champagne|elegance|elegant|secret|romance|silk|velvet|passion|sensual|erotic|couture)/.test(
      t
    )
  ) {
    return THEMES.gold_luxury;
  }

  // 5. Tokyo Sakura JAV Neon
  if (
    section === "jax" ||
    /(?:s1|moodyz|sod|prestige|ideapocket|attackers|madonna|kawaii|tokyo|shibuya|sakura|japan|japanese|geisha|subbed|uncensored)/.test(
      s + " " + t + " " + c
    )
  ) {
    return THEMES.tokyo_sakura;
  }

  // 6. Sweet Candy Pop / Pastel Glamour
  if (
    s.includes("babes") ||
    s.includes("twistys") ||
    /(?:sweet|candy|teen|petite|cute|cherry|peach|honey|angel|bubble|pink|barbie|sugar|blush)/.test(
      t
    )
  ) {
    return THEMES.candy_pop;
  }

  // 7. Inferno / Hardcore Heat / Brazzers
  if (
    s.includes("brazzers") ||
    s.includes("rkprime") ||
    s.includes("evil angel") ||
    /(?:fire|burn|burning|heat|wild|extreme|raw|blast|taboo|wicked|naughty|lust|bang|hardcore|intense)/.test(
      t
    )
  ) {
    return THEMES.inferno;
  }

  // 8. Amethyst Velvet Noir / Vixen Media Group
  if (
    s.includes("vixen") ||
    s.includes("blacked") ||
    s.includes("tushy") ||
    s.includes("deeper") ||
    s.includes("slayed") ||
    /(?:midnight|shadow|noir|dream|siren|mystery|darkness|stars|velvet|amethyst|violet)/.test(
      t
    )
  ) {
    return THEMES.amethyst_noir;
  }

  // Fallback: Deterministic string hash to stably distribute across the 8 bespoke styles
  let hash = 0;
  const str = `${title}-${studio || ""}-${code || ""}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % THEME_KEYS.length;
  return THEMES[THEME_KEYS[index]];
}

export function ThemedTitle({
  title,
  studio,
  section,
  code,
  className = "",
  size = "hero",
}: ThemedTitleProps) {
  const theme = useMemo(
    () => resolveTheme(title, studio, section, code),
    [title, studio, section, code]
  );

  const sizeClass =
    size === "hero"
      ? "text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08]"
      : size === "detail"
      ? "text-2xl sm:text-4xl md:text-5xl leading-tight"
      : "text-lg sm:text-xl leading-snug";

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      {/* Cinematic Studio Eyebrow Pattern */}
      {size === "hero" && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase opacity-85 text-zinc-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {theme.eyebrow}
          </span>
        </div>
      )}

      {/* Bespoke Styled Headline */}
      <h1
        className={`line-clamp-2 break-words transition-all duration-500 font-extrabold ${sizeClass} ${theme.fontFamilyClass} ${theme.titleClass} ${className}`}
      >
        {title}
      </h1>
    </div>
  );
}

export function ThemedThemeBadge({
  title,
  studio,
  section,
  code,
}: {
  title: string;
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
      className={`rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors duration-300 ${theme.badgeClass}`}
    >
      {theme.badgeLabel}
    </span>
  );
}
