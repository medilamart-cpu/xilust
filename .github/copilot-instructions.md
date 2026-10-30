# GitHub Copilot & Codex Instructions for XiLust

## CRITICAL: Multi-Agent Synchronization Protocol (Codex & Antigravity)
This repository is concurrently worked on by two agents: **Antigravity** and **Codex**.
To prevent code overwrites, missing commits, or merge conflicts, you MUST follow this protocol:

### 1. Mandatory Pull Before ANY Work (Step 0)
Before reading files, writing code, or making edits:
```powershell
git fetch origin main
git pull --rebase origin main
```
Never assume local files reflect the latest remote state.

### 2. Surgical Edits Only — Never Blindly Overwrite Files
- ALWAYS make targeted diffs / search-and-replace edits.
- NEVER rewrite an entire file or component from scratch. Full-file overwrites will erase functions, fixes, and imports recently added by the other agent.
- Keep all existing comments, docstrings, imports, and utility functions intact.

### 3. Check Recent Commits
Before modifying shared critical files (`catalog-db.ts`, `page.tsx`, `TitleWatchClient.tsx`, `Hero.tsx`), run:
```powershell
git log -n 5 --stat
```
Understand recent commits to avoid undoing recently deployed work.

### 4. Mandatory Rebase & Push
When concluding work:
1. Stage and commit:
   ```powershell
   git add -A
   git commit -m "feat/fix(scope): clear description of changes"
   ```
2. Rebase on top of any remote commits:
   ```powershell
   git pull --rebase origin main
   ```
3. Push:
   ```powershell
   git push origin main
   ```
   **`git push --force` or `git push -f` is STRICTLY FORBIDDEN.**
4. Trigger Cloudflare Pages deployment:
   ```powershell
   python trigger_deploy.py
   ```
5. Verify live deployment at `https://xilust.pages.dev/`.
