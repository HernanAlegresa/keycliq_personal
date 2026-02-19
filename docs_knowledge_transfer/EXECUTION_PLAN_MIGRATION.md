# KeyCliq — Execution Plan: Audit → Deploy (Controlled Scope)

This plan moves from audit to a working Vercel deployment with minimal refactors. Product behavior (scan flow, AI signature, matching) is unchanged.

---

## Phase 0 (BLOCKER) — Security and repo hygiene

**Must be done first.** No secrets in repo; key images only accessible to the owning user.

### 0.1 Remove hardcoded API key and lock down secrets

- [x] **Done:** Removed hardcoded `OPENAI_API_KEY` from `tests/results/testv6clean/validate-progressive.js`. Script now requires `OPENAI_API_KEY` from the environment and exits with a clear message if missing.
- [x] **Done:** Added `tests/results/` to `.gitignore` so test output (and any future accidental secrets) are not committed.
- **Verify (you):** Run once before pushing:
  ```bash
  rg "sk-proj-|sk-[a-zA-Z0-9]{30,}|re_[a-zA-Z0-9]{20,}|DATABASE_URL=.*@|CLOUDINARY_API_SECRET=.*"
  ```
  No matches in tracked files. (Already run; no secrets found after fix.)

**Code touchpoints:**
- `tests/results/testv6clean/validate-progressive.js` — removed hardcoded key; env-only check.
- `.gitignore` — added `tests/results/`.

**Outside code:** Rotate the OpenAI key that was previously in the file (in OpenAI dashboard: revoke old key, create new one, set in `.env`).

---

### 0.2 Fix key image route — require auth and scope by user

- [x] **Done:** `app/routes/api.key-image.$id.js` now calls `requireUserId(request)` and `getKeyById(keyId, userId)`. Unauthenticated users are redirected to `/welcome`; authenticated users only get the key image if they own the key.

**Code touchpoints:**
- `app/routes/api.key-image.$id.js` — import `requireUserId`, get `userId`, pass to `getKeyById(keyId, userId)`, re-throw `Response` (e.g. redirect) from `requireUserId`.

**Confirm:** Log in as user A, create a key, note the key ID. In another browser/incognito (user B or not logged in), open `/api/key-image/<key-id>`. You should get redirect to `/welcome` or “Key not found”, not the image.

---

## Phase 1 — Make the project deployable on Vercel

No change to core scan/AI/matching logic; only deployment and dependency fixes.

### 1.1 Vercel deployment path

- [x] **Verified:** `vercel.json` exists with `"framework": "remix"`, `buildCommand`, `installCommand`, `devCommand`, and `regions`. No code change needed.
- **You:** In Vercel dashboard, import the repo and use the existing build settings (or leave defaults). Ensure root directory is the project root.

**Touchpoints:** None (config only).

---

### 1.2 Scan guide image — no fragile filesystem in serverless

- [x] **Done:** Guide image no longer read from `app/assets/` via `fs` + `sharp`.
  - **Frontend:** `app/components/ui/ScanGuidelines.jsx` now uses a single static URL: `/scan-guide-key.png` (served from `public/`).
  - **API route:** `app/routes/api.scan-guide-image.js` now only redirects to `/scan-guide-key.png` (no `fs`, no `sharp`). Old links still work.

**Code touchpoints:**
- `app/components/ui/ScanGuidelines.jsx` — `OPTIMIZED_IMAGE_BASE` replaced with `SCAN_GUIDE_IMAGE_SRC = "/scan-guide-key.png"`; removed responsive `srcSet`/sources; single `<img src={...}>` with same fallback on error.
- `app/routes/api.scan-guide-image.js` — replaced with a loader that `redirect("/scan-guide-key.png", 302)`.

**Outside code:**
- Add the static asset: **`public/scan-guide-key.png`**. Use a key photo (e.g. 720px wide) that shows “properly positioned key for scanning”. `public/` was removed from `.gitignore`; a placeholder `public/scan-guide-key.png` is committed so Vercel has the file. You can replace it with a real key photo; if the image fails to load, the UI shows the same inline fallback placeholder.

---

### 1.3 Remove unused `canvas` dependency

- [x] **Done:** `canvas` removed from `package.json` dependencies. It was not used anywhere in the app (only in docs as optional future use). Avoids heavy native build on Vercel.

**Code touchpoints:**
- `package.json` — deleted `"canvas": "^3.2.0"`.

**You:** Run `npm install` after pull so lockfile updates.

---

### 1.4 Sharp usage and serverless

- [x] **Done:** The only use of `sharp` was in `api.scan-guide-image.js`, which now only redirects. `sharp` has been removed from `package.json` so the serverless build does not depend on it.

**Code touchpoints:**
- `package.json` — removed `"sharp": "^0.34.4"`.

---

## Phase 2 — Infrastructure (minimal change first)

Recommendation: **Database = Supabase Postgres; Storage = keep Cloudinary** until you want to migrate.

### 2.1 Database — Postgres (e.g. Supabase)

- **Recommended:** Supabase (or Neon / Vercel Postgres). Same Prisma schema; only `DATABASE_URL` changes.
- **Format for serverless (connection pooling):**
  - Supabase: use the **“Transaction” pooler** (session mode) or **“Session”** pooler URL from Project Settings → Database. Example:
    ```txt
    postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
    ```
  - Direct (non-pooled) URL is fine for low concurrency; for many serverless invocations use the pooler URL to avoid exhausting connections.
- Prisma: no code change. Use the same `DATABASE_URL` in Vercel env (and locally in `.env`).

**Outside code:**
- Create a Supabase project; create a database (default Postgres).
- Copy the connection string (pooler recommended); set as `DATABASE_URL` in Vercel (and `.env` locally).
- Run DB init once: see **`docs_knowledge_transfer/SUPABASE_AND_PRISMA.md`** for exact commands (this repo has no migrations; use `db:push` with **direct** URL from local).

---

### 2.2 Storage — keep Cloudinary (minimal change)

- **Recommendation:** Keep Cloudinary for now. No code or config change beyond existing env vars.
- Set in Vercel: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and optionally `CLOUDINARY_UPLOAD_PRESET` (for unsigned uploads).
- Later, if you want to move to Supabase Storage, that would be a separate change (upload/delete in `keys.server.js`, URL building in `imageUtils.js`).

**Touchpoints:** None for “keep Cloudinary”.

---

## Phase 3 — OpenAI cost guardrails (portfolio demo)

Add light protections without changing core UX: rate limit, size/caps, logging.

### 3.1 Rate limit (IP and/or user)

- **Suggested:** In-memory or Redis-based rate limit on the **scan action** (e.g. `app/routes/scan_.check.jsx` action).
  - Per IP: e.g. 10 scans per minute (or 20/hour).
  - Per user (when logged in): e.g. 30 scans per hour or 100/day.
- **Touchpoints:** New util e.g. `app/utils/rateLimit.server.js` (in-memory Map keyed by IP and/or userId with sliding window or fixed window). In `scan_.check.jsx` action, call the limiter before `processKeyImageV6`; if over limit return `json({ error: 'RATE_LIMITED' }, { status: 429 })` and show a short message on the client (e.g. “Too many scans; try again in a few minutes”).
- **Note:** In-memory only works for a single instance; for multi-instance Vercel use Vercel KV or Upstash Redis. Start simple (in-memory) for a demo.

### 3.2 Max image size / client-side resize

- **Suggested:** Reject oversized payloads in `scan_.check.jsx` action (e.g. `imageDataURL` length > 4–6 MB base64 ≈ 3–4.5 MB image). Return 400 with a clear message.
- **Optional:** Add a short note in the scan UI: “For best results use a clear photo; very large images may be rejected.”
- **Touchpoints:** `app/routes/scan_.check.jsx` — after reading `imageDataURL`, check length (e.g. `imageDataURL.length > 6_000_000`); optional: `ScanGuidelines.jsx` or scan page copy.

### 3.3 Daily scan caps (demo mode)

- **Suggested:** Optional env var e.g. `MAX_SCANS_PER_USER_PER_DAY=50`. In `scan_.check.jsx` (or in `processKeyImageV6`), count today’s `KeyQuery` rows for the user; if at or over the cap, return 429 and a friendly message.
- **Touchpoints:** `app/routes/scan_.check.jsx` or `app/lib/keyscan.server.js` — query `prisma.keyQuery.count({ where: { userId, createdAt: { gte: startOfToday } } })`; compare to env cap.

### 3.4 Basic logging for scan usage

- **Suggested:** Keep existing `console.log` around `processKeyImageV6` (timing, decision). Add one structured log per scan: e.g. `userId`, `keyQueryId`, `decision`, `processingTimeMs` (no PII beyond userId). Optional: write to a “scan_log” table or external logger for cost monitoring.
- **Touchpoints:** `app/lib/keyscan.server.js` or `scan_.check.jsx` — one log line per scan (e.g. JSON) so you can grep or pipe to a tool later.

---

## Checklist summary

| Phase | Task | Status | Owner |
|-------|------|--------|--------|
| 0.1 | Remove hardcoded key; add tests/results to .gitignore; verify no secrets | Done | Code |
| 0.2 | Fix api.key-image.$id.js auth + userId | Done | Code |
| 1.1 | Confirm Vercel config | Verified | You |
| 1.2 | Guide image from public/; redirect route | Done | Code |
| 1.3 | Remove canvas | Done | Code |
| 1.4 | Remove sharp | Done | Code |
| 2.1 | Postgres (Supabase); DATABASE_URL + pooling | — | You |
| 2.2 | Keep Cloudinary; set env vars | — | You |
| 3.1 | Rate limit (IP/user) on scan | — | You/code |
| 3.2 | Max image size + optional UI note | — | You/code |
| 3.3 | Daily scan cap (demo) | — | You/code |
| 3.4 | Scan usage logging | — | You/code |

---

## Tasks you do outside code

1. **Rotate OpenAI key** that was previously in `validate-progressive.js` (revoke, create new, set in `.env` and Vercel).
2. **Optional:** Replace `public/scan-guide-key.png` with a real key photo (placeholder committed; `public/` no longer gitignored). ~~**Add `public/scan-guide-key.png`**~~ (or ensure it’s created in deploy). If `public/` is gitignored, either stop ignoring it for this file or add the file in CI/deploy.
3. **Supabase:** Create project → Database → copy connection string (pooler URL for serverless) → set `DATABASE_URL` in Vercel and locally.
4. **Vercel:** Set env vars: `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`, `APP_URL`, and mail vars if you use reset; Cloudinary vars if you use images; optional Phase 3 vars later.
5. **After first deploy:** Run DB init once with **direct** connection URL: see `docs_knowledge_transfer/SUPABASE_AND_PRISMA.md` for exact commands (use `npm run db:push`; no migrations in repo).
6. **Phase 3:** Implement rate limit, size check, daily cap, and logging when you want demo guardrails.

---

## Exact files changed (Phase 0 + 1)

- `tests/results/testv6clean/validate-progressive.js` — no hardcoded key; env check.
- `.gitignore` — added `tests/results/`; **removed `public/`** so `public/scan-guide-key.png` can be committed.
- `app/routes/api.key-image.$id.js` — auth + userId scoping.
- `app/components/ui/ScanGuidelines.jsx` — static `/scan-guide-key.png`; single img.
- `app/routes/api.scan-guide-image.js` — redirect only (no fs/sharp).
- `package.json` — removed `canvas` and `sharp`.
- **`public/scan-guide-key.png`** — added (minimal placeholder PNG; replace with real key photo if desired).

**Phase 2 prep (no behavior change):** `.env.example` updated with all required/optional vars and Supabase pooler/direct guidance; **`docs_knowledge_transfer/SUPABASE_AND_PRISMA.md`** added with exact DB init commands for Supabase.

No other files were modified. Core scan, AI, and matching logic are unchanged.
