# XiLust Live Deployment & Cloudflare Pages Workflow

## ⚠️ MANDATORY RULE FOR ALL AI ASSISTANTS & AGENTS
**ANY modifications made to this codebase (UI fixes, responsive styles, bugfixes, or scraper updates) DO NOT appear on the public site until pushed to GitHub `main` and deployed to Cloudflare Pages.**

---

### Step 1: Stage and Push to GitHub
```powershell
# 1. Stage all modifications
git add -A

# 2. Commit with descriptive summary
git commit -m "fix: mobile player placement, instant section switching, and responsive UI"

# 3. Push to main branch
git push origin main
```

---

### Step 2: Trigger / Verify Cloudflare Pages Deployment
Cloudflare Pages is linked to the repository at `https://github.com/medilamart-cpu/xilust.git`.
If automatic git webhook triggers take longer than expected, trigger deployment immediately using the Cloudflare API:

```powershell
curl.exe -s -X POST -H "Authorization: Bearer cfoat_2dqtQEnKRjl95gA2AnPYUF7m-iEhFKPuJ89lbByQD5Q.Apd1T94AWMOkd-wlWECXMsCRL5mmEPMfZy26RGgL12c" -H "Content-Type: application/json" -d "{\"branch\":\"main\"}" "https://api.cloudflare.com/client/v4/accounts/87e42b045dc2182ef8f54bd33ea8ee30/pages/projects/xilust/deployments"
```

To check deployment status:
```powershell
curl.exe -s -H "Authorization: Bearer cfoat_2dqtQEnKRjl95gA2AnPYUF7m-iEhFKPuJ89lbByQD5Q.Apd1T94AWMOkd-wlWECXMsCRL5mmEPMfZy26RGgL12c" "https://api.cloudflare.com/client/v4/accounts/87e42b045dc2182ef8f54bd33ea8ee30/pages/projects/xilust/deployments?per_page=1"
```

---

### Step 3: Browser Verification (Hard Requirement)
Before informing the user that a task is done:
1. Open `https://xilust.pages.dev/` in the browser subagent.
2. Verify visual rendering, responsive layout on mobile (375px/414px) and desktop (1366px+).
3. Confirm images have `naturalWidth > 0` and stream players load cleanly.
4. Capture a screenshot artifact as proof of visual verification.
