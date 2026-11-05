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
  label: string;
  titleClass: string;
  tagClass: string;
}

const THEMES: Record<TypographyThemeKey, ThemeConfig> = {
  biohazard: {
    key: "biohazard",
    label: "BIOHAZARD CRIMSON",
    titleClass:
      "font-serif tracking-[0.05em] font-black uppercase bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(220,38,38,0.85)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]",
    tagClass: "bg-red-500/15 border-red-500/30 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]",
  },
  chiseled: {
    key: "chiseled",
    label: "3D CHISELED STONE",
    titleClass:
      "font-black uppercase tracking-tighter bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_3px_0_#27272a] drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]",
    tagClass: "bg-zinc-700/30 border-zinc-500/40 text-zinc-200 shadow-[0_0_12px_rgba(161,161,170,0.2)]",
  },
  cyberpunk: {
    key: "cyberpunk",
    label: "CYBERPUNK NEON",
    titleClass:
      "font-mono tracking-[0.14em] font-black uppercase bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(34,211,238,0.85)] drop-shadow-[0_0_40px_rgba(217,70,239,0.5)]",
    tagClass: "bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.4)]",
  },
  gold_luxury: {
    key: "gold_luxury",
    label: "24K HAUTE GOLD",
    titleClass:
      "font-serif italic font-bold tracking-wide bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.65)] drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]",
    tagClass: "bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.35)]",
  },
  tokyo_sakura: {
    key: "tokyo_sakura",
    label: "TOKYO NIGHT SAKURA",
    titleClass:
      "font-extrabold uppercase tracking-[0.12em] bg-gradient-to-r from-pink-300 via-rose-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(244,114,182,0.8)] drop-shadow-[0_0_35px_rgba(168,85,247,0.5)]",
    tagClass: "bg-pink-500/15 border-pink-400/40 text-pink-300 shadow-[0_0_14px_rgba(244,114,182,0.35)]",
  },
  candy_pop: {
    key: "candy_pop",
    label: "SWEET CANDY POP",
    titleClass:
      "font-black tracking-normal bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(52,211,153,0.7)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]",
    tagClass: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)]",
  },
  inferno: {
    key: "inferno",
    label: "INFERNO MAGMA",
    titleClass:
      "font-black italic uppercase tracking-tight bg-gradient-to-r from-yellow-200 via-orange-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(249,115,22,0.85)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]",
    tagClass: "bg-orange-500/15 border-orange-400/40 text-orange-300 shadow-[0_0_14px_rgba(249,115,22,0.4)]",
  },
  amethyst_noir: {
    key: "amethyst_noir",
    label: "AMETHYST NOIR",
    titleClass:
      "font-semibold uppercase tracking-[0.08em] bg-gradient-to-r from-purple-200 via-violet-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(167,139,250,0.75)] drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]",
    tagClass: "bg-violet-500/15 border-violet-400/40 text-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.35)]",
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

function resolveTheme(
  title: string,
  studio?: string | null,
  section?: "lust" | "jax" | "fans",
  code?: string | null
): ThemeConfig {
  const t = (title || "").toLowerCase();
  const s = (studio || "").toLowerCase();
  const c = (code || "").toLowerCase();

  // 1. Horror / Biohazard / Gothic / Dark Thriller
  if (
    /(?:resident|evil|biohazard|horror|blood|dark|zombie|gothic|nightmare|demon|curse|creepy|sinister|haunted|dead|killer|slasher)/.test(
      t
    )
  ) {
    return THEMES.biohazard;
  }

  // 2. Chiseled / Heavy Brutalist / Clayface / Colossus
  if (
    /(?:clayface|batman|titan|beast|stone|iron|heavy|brutal|colossus|steel|monster|smash|shatter|armor|concrete)/.test(
      t
    )
  ) {
    return THEMES.chiseled;
  }

  // 3. Cyberpunk / Blade Runner / Sci-Fi Neon Pulse
  if (
    /(?:cyber|matrix|neon|future|futuristic|vr|tech|glitch|bot|synth|ai|wire|electric|pulse|laser|virtual|hacker)/.test(
      t
    )
  ) {
    return THEMES.cyberpunk;
  }

  // 4. 24K Haute Luxury / Bellesa & Elegance
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
      ? "text-2xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.12]"
      : size === "detail"
      ? "text-xl sm:text-3xl md:text-4xl leading-tight"
      : "text-base sm:text-lg leading-snug";

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5">
      <h1
        className={`line-clamp-2 break-words transition-all duration-500 ${sizeClass} ${theme.titleClass} ${className}`}
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
      className={`rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-wider backdrop-blur-md uppercase transition-colors duration-300 ${theme.tagClass}`}
    >
      {theme.label}
    </span>
  );
}
