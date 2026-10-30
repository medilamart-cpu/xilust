# XiLust System Architecture & Agent Instructions

This document provides definitive instructions for any AI agent or developer maintaining **XiLust** (the high-performance streaming web application for Western & JAV media).

---

## 1. 4-Tier Scraper & Storage Architecture

All scraped data is maintained across **4 structured layers** between the **VPS (`130.210.1.146`)** and the **Local PC (`E:\MY PROJECTS\`)**:

```
                       ┌──────────────────────────────────────────────┐
                       │            1. PRIMARY DATABASE               │
                       │   MongoDB: smovie_db.posts (261,613+ docs)   │
                       │    Storage: /home/ubuntu/mongodb_data        │
                       └──────────────────────┬───────────────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              ▼                               ▼                               ▼
  ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
  │ 2. FILE BACKUPS (JSON)│       │ 3. THUMBNAIL STORAGE  │       │ 4. LIVE API & TUNNELS │
  │  posts_by_year/       │       │  /thumbs/ (Port 8088) │       │  catalog_api (8089)   │
  │  posts_2026.json      │       │  .jpg & .webp covers  │       │  Cloudflare Tunnels   │
  └───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

### Layer 1: Primary Database (MongoDB on VPS)
* **Location:** VPS `130.210.1.146` at `mongodb://localhost:27017`
* **On-Disk Path:** `/home/ubuntu/mongodb_data`
* **Database & Collection:** `smovie_db.posts` (261,613+ document records)
* **Contents per document:**
  * **Identifiers:** `url` (unique index), `post_id`, `slug`, `title`, `source` (`"javguru"` or `"xmovies"`).
  * **Taxonomies:** Actresses / models, studio, series, tags, categories.
  * **Dates:** `published_at`, `release_date`, publication `year`.
  * **Stream Links:** Resolved playable stream embeds and gateways (STREAM SB, LU, DD, JK, Dood, Mixdrop, Streamtape).
  * **Image Paths:** Remote `cover_url` and local relative path `thumb_rel_path`.

### Layer 2: Year-Wise JSON Backup Catalogs
1. **On VPS (`/home/ubuntu/smovie-scraper/`):**
   * JAV Guru: `/home/ubuntu/smovie-scraper/jav-guru-scraper-toolkit/posts_by_year/posts_2026.json`
   * XMovies: `/home/ubuntu/smovie-scraper/posts_by_year/posts_2026.json`
   * Archive: `/home/ubuntu/javguru_full_catalog_2016_2026.tar.gz` (82 MB)
2. **On Local Machine (`E:\MY PROJECTS\SCREAPPER SMOVIE\`):**
   * JAV Guru: `E:\MY PROJECTS\SCREAPPER SMOVIE\jav-guru-scraper-toolkit\posts_by_year\posts_2026.json`
   * PimpBunny Prebuilt: `E:\MY PROJECTS\SCREAPPER SMOVIE\pimpbunny\pimpbunny-prebuilt-catalog\videos_by_year\videos_2026.json`

### Layer 3: Thumbnail Storage (Port 8088)
* **Location on VPS:** `/home/ubuntu/smovie-scraper/thumbs/`
* **File Structure:**
  * JAV Guru: `/thumbs/<year>/<post_id>-<code>.jpg` (or `/thumbs/javguru/...`)
  * XMovies / Lust: `/thumbs/xmovies/<year>/<slug>.webp`
* **Web Server:** Python HTTP daemon running on Port 8088 exposed via Cloudflare Tunnel.
* **Live Tunnel:** `https://marriage-editorials-tyler-clark.trycloudflare.com/thumbs/`

### Layer 4: Live Query API & SQLite Mirror
* **Catalog API (`/home/ubuntu/catalog_api.py`):** Runs on Port 8089 on VPS, backed by `/home/ubuntu/catalog.db`.
* **Local Fast SQLite Engine (`catalog.db`):** 540+ MB high-speed database in repository root queried directly by Next.js server runtime (`node:sqlite DatabaseSync`) with FTS5 search index.
* **Remote Fallback API (`CATALOG_API_URL`):** `https://supervisor-demonstrated-rhythm-ignored.trycloudflare.com` for Edge/serverless deployments.

---

## 2. Instant Scraper Sync Workflow

When the scraper finishes new items or updates `posts_2026.json`:

### Step 1: Pull the latest JSON from the VPS
```powershell
scp -i "$HOME\.ssh\oracle_key" ubuntu@130.210.1.146:/home/ubuntu/smovie-scraper/jav-guru-scraper-toolkit/posts_by_year/posts_2026.json "E:\MY PROJECTS\SCREAPPER SMOVIE\jav-guru-scraper-toolkit\posts_by_year\posts_2026.json"
```

### Step 2: Ingest into Local `catalog.db`
Run the automated sync tool in the repository root:
```powershell
python sync_scraper_catalog.py
```
This automatically:
- Reads the new posts from `posts_by_year/posts_2026.json`.
- Calculates thumbnail paths: `/thumbs/<year>/<post_id>-<code>.jpg`.
- Performs upserts (`INSERT ... ON CONFLICT(section, slug) DO UPDATE`).
- Preserves all video source links and taxonomy metadata.

---

## 3. GitHub & Cloudflare Pages CI/CD & Multi-Agent Protocol

> [!CAUTION]
> **CRITICAL MULTI-AGENT PROTOCOL (Antigravity & Codex)**
> This repository is actively maintained by two distinct AI agents (**Antigravity** and **Codex**).
> To prevent one agent from overwriting, missing, or reverting the other agent's changes, EVERY agent MUST strictly adhere to this protocol.

### Step 0: Mandatory Pull Before ANY Work Begins
Before reading files or making ANY code edits, the agent MUST run:
```powershell
git fetch origin main
git pull --rebase origin main
```
*Never assume the local disk or working tree has the latest code. The other agent may have pushed changes minutes ago.*

### Step 1: Surgical Edits Only — Never Blindly Overwrite Files
- ALWAYS use targeted search/replace edits (`edit_file` / unified diffs).
- **NEVER** rewrite an entire file or component from scratch. Replacing full files from memory silently deletes functions, imports, bug fixes, or features newly implemented by the other agent.
- Always preserve existing comments, docstrings, imports, and helper functions unrelated to your immediate task.

### Step 2: Check Recent Commit History
Before modifying shared critical files (`catalog-db.ts`, `page.tsx`, `TitleWatchClient.tsx`, `Hero.tsx`), run:
```powershell
git log -n 5 --stat
```
Inspect recent commit messages to understand what the other agent recently built and avoid conflicting regressions.

### Step 3: Mandatory Pre-Push Rebase & Deployment
When finishing work:
1. Stage and commit with a clear, descriptive message:
   ```powershell
   git add -A
   git commit -m "feat/fix(scope): clear description of changes"
   ```
2. Rebase on top of any concurrent remote commits:
   ```powershell
   git pull --rebase origin main
   ```
3. Push to `main`:
   ```powershell
   git push origin main
   ```
   > [!WARNING]
   > **`git push --force` or `git push -f` is STRICTLY PROHIBITED.** If a push is rejected, rebase cleanly and resolve conflicts by keeping BOTH agents' logic intact.
4. Trigger or verify Cloudflare Pages deployment via the API:
   ```powershell
   python trigger_deploy.py
   ```
5. Test live deployment at `https://xilust.pages.dev/`. Never mark a task complete without visually checking the live site!

### Required Environment Variables (Cloudflare Pages Dashboard):
Set these in **Cloudflare Pages -> Project Settings -> Environment Variables**:
* `NEXT_PUBLIC_CLEANSTREAM_URL`: `https://marriage-editorials-tyler-clark.trycloudflare.com`
* `NEXT_PUBLIC_THUMBS_CDN`: `https://xithumbs.duckdns.org`
* `CATALOG_API_URL`: `https://supervisor-demonstrated-rhythm-ignored.trycloudflare.com`

---

## 4. Frontend Coding Rules & Conventions

1. **Sections:**
   - `"lust"`: Western studio releases.
   - `"jax"`: Japanese Adult Video (JAV).
   - `"fans"`: Premium Creator & Fans leaks (Jolly & Molly servers).
2. **Taxonomy & Redirection URL Patterns:**
   - Actress / Pornstar: `/?section=<sec>&actor=<name>`
   - Studio / Production: `/?section=<sec>&studio=<name>`
   - Categories / Genres: `/?section=<sec>&category=<name>`
   - Search: `/?section=<sec>&q=<query>`
3. **Mobile-First Responsive Standards:**
   - Always guarantee zero horizontal overflow (`max-width: 100%`, `overflow-x: hidden`).
   - Catalog grids must reflow to `grid-cols-2` on mobile (`< 640px`) for optimal tile density.
   - Header must respect safe area insets (`pt-[env(safe-area-inset-top)]`).
   - Bottom navigation bar is pinned at `bottom-0` with safe area clearance (`pb-[calc(0.5rem+env(safe-area-inset-bottom))]`).
   - Touch targets must be at least 44x44px or have minimum `h-8 w-8` clickable areas.
4. **Thumbnail Resolution:**
   - JAX: `${process.env.NEXT_PUBLIC_CLEANSTREAM_URL}${item.thumbnail_url}`
   - LUST: `${process.env.NEXT_PUBLIC_THUMBS_CDN}/${item.slug}.webp`
   - Fallback to remote `cover_url` if local thumb is not available.
