# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are viewers seeking fast, high-quality, distraction-free streaming of adult and JAV (Japanese Adult Video) media. They arrive to watch specific releases or discover new content by actress, studio, genre/category, or production code, expecting instant video playback without aggressive popups, deceptive redirects, or clunky legacy tube interfaces.

## Product Purpose

XiLust provides an ad-free, high-performance streaming web application that unites Western studio releases (`lust`), Japanese Adult Video (`jax`), and Creator leaks (`fans`) inside a responsive, dark obsidian theater interface. Success means sub-second video startup, resilient multi-mirror playback failover, and frictionless content discovery across 260,000+ catalog titles.

## Positioning

Unlike conventional ad-saturated tube sites, XiLust couples a proprietary CleanStream ad-stripping proxy and multi-mirror streaming engine (fast failover between direct 1080p, Streamtape, Mixdrop, Dood, etc.) with sub-15ms edge-cached catalog delivery (Cloudflare R2 + SQLite engine) and a bespoke, luxury obsidian UI inspired by Apple TV+ and modern cinematic streaming platforms.

## Operating Context

- **Devices:** Mobile-first smartphones (320px–480px touchscreens with safe-area insets), tablets, and desktop displays (wide cinematic HD viewing).
- **Session Environment:** Private, high-intent viewing sessions where friction (buffering, broken links, intrusive ads) causes immediate bounce.
- **Network Realities:** Variable cellular and broadband connections requiring instant thumbnail CDN delivery (`xithumbs.duckdns.org` / VPS thumb daemon) and resilient video stream fallback.

## Capabilities and Constraints

- **Three Core Media Sections:**
  - `lust`: Western studio releases and feature scenes.
  - `jax`: Japanese Adult Video releases with code search, decensored, and English-subbed filters.
  - `fans`: Premium creator and leak vault content.
- **Playback Architecture:** CleanStream ad-free player proxy with auto-fallback to direct embeds and one-click manual mirror switching across multiple video hosts.
- **Catalog & Search:** 260,000+ indexed titles queried via local fast SQLite (`catalog.db`) with FTS5 search and pre-baked Cloudflare R2 edge feeds for zero-VPS load on trending queries.
- **Local Playlists:** Private client-side playlist curation (Favorites, Watch Later, Custom Themes) stored locally without mandatory sign-in friction.
- **Strict Multi-Agent Rule:** Repository is co-maintained by distinct AI agents; surgical edits only, mandatory `git pull --rebase origin main` before work, and zero forced pushes.

## Brand Commitments

- **Name:** XiLust (with Aethoplex UI engine architecture).
- **Visual Tone:** Obsidian dark theater (`#080a0f` canvas), pure white typography, cyan/neon accents reserved strictly for functional status/active states, zero cheap emoji clutter.
- **Identity:** Confident, sleek, and premium streaming brand that treats adult entertainment media with the craft, typography, and interface polish of top-tier entertainment platforms.

## Evidence on Hand

- `src/components/aethoplex/`: Production Next.js UI components (Hero carousel, PosterCard grid, Navbar, Watch page player, Playlists).
- `catalog.db`: 540+ MB high-speed indexed catalog with full metadata, stream links, and taxonomies.
- `AGENTS.md` / `GEMINI.md`: Architecture and multi-tier scraping, VPS, and Cloudflare Pages sync workflows.

## Product Principles

1. **Zero-Friction Playback Over Everything:** A stream that plays instantly beats any visual flourish. Mirror fallbacks and CleanStream resolvers must always remain robust and easily accessible.
2. **Imagery is the Light Source:** Keep the UI chrome minimal, deep obsidian, and dark so video covers, backdrops, and previews command focus.
3. **Tactile & Responsive Feedback:** Every button, filter pill, and card must provide immediate physical press feedback (`scale(0.97)`, active indicators, smooth layout transitions) within frame budgets (<300ms).
4. **No Clutter, No Fake Slop:** Replace tacky rainbow borders and raw emojis with precise vector icons, tabular figures, and bespoke cinema badges.
5. **Privacy by Default:** Enable seamless browsing, bookmarking, and playlist creation without intrusive tracking or mandatory user accounts.

## Accessibility & Inclusion

- Adherence to WCAG AA contrast against dark surfaces (`#080a0f`).
- Full `@media (prefers-reduced-motion: reduce)` support: motion gracefully bypasses transform animations to preserve legibility.
- Mobile touch targets meet or exceed minimum 44x44px standards with proper safe-area clearance for notched devices and home bars.

