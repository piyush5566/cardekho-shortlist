# Car shortlist MVP (CarDekho take-home)

**Screen recording (required):** _Add your Loom / Google Drive / YouTube (unlisted) link here before submit._

Synthetic data only — [CarDekho](https://www.cardekho.com/) is UX inspiration; no affiliation or scraping.

## Run (warm path, under ~2 minutes)

Prerequisites: Node 20+, npm.

```bash
cd cardekho-shortlist
cp .env.example .env
# default DATABASE_URL=file:./dev.db is fine for local SQLite
npm ci
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First `npm ci` on a slow network may exceed 2 minutes; **warm** `npm run dev` after deps + DB are ready should be fast.

**Production locally**

```bash
npm run build
npm run start
```

`next start` respects `PORT` (e.g. Render).

**Tests**

```bash
npm run test        # Vitest + SQLite test.db (migrate + seed in globalSetup)
npm run build       # same typecheck as deploy
```

**End-to-end (Playwright)** — uses its own SQLite file `e2e.db`, **`AI_PROVIDER=mock`**, and dev server on **port 3333** (see `playwright.config.ts`). First time only, install browsers:

```bash
npx playwright install chromium
npm run test:e2e    # starts Next via webServer: migrate + seed + next dev
```

`npm run test:all` runs Vitest then Playwright. For a full release gate locally: `npm run test && npm run build && npm run test:e2e` (E2E does not require a prior `build`; it runs against `next dev`).

If **`reuseExistingServer`** is enabled outside CI and port **3333** is already taken by another app, tests may attach to the wrong server — free the port or set **`CI=1`** for a clean web server.

**Parallel tip:** Vitest uses `test.db`; Playwright uses `e2e.db`, so `npm run test` and `npm run test:e2e` can be run in parallel in separate terminals if desired.

Optional: `npm run db:prepare` runs `prisma migrate deploy && prisma db seed` (for local DB refresh; same steps run during Render **build** on Free tier).

## Deploy (Render)

- Set **`DATABASE_URL`** to Postgres (`sslmode=require` when required). It must be set **before** the first deploy so the **build** can reach the database.
- **Free web services** do not support Render’s **`preDeployCommand`** (paid feature). This repo runs **`npm run db:prepare`** inside **`buildCommand`** after `npm ci` and before `npm run build` (see [`render.yaml`](render.yaml)). Seed uses **upsert by `slug`**, so re-running seed on each deploy is safe.
- **Build:** `npm ci` (runs **`postinstall` → `prisma generate`**), then **`db:prepare`** (migrate + seed), then **`npm run build`**.
- **Start:** `npm run start` (unchanged).
- If **build** fails during migrate/seed, fix `DATABASE_URL` / SSL, or run `npx prisma migrate deploy && npx prisma db seed` from your machine against **production** `DATABASE_URL`, then redeploy.
- **Paid instances:** If you upgrade, you can optionally move migrate/seed back to **`preDeployCommand`** and shorten **`buildCommand`** to `npm ci && npm run build`.

## README questions (assignment)

### 1. What did you build and why? What did you deliberately cut?

Built a **guided car shortlist**: hard filters (budget band, fuel, segment, seats, sunroof, automatic) hit **Prisma**; results are **deterministically** capped; **POST** re-ranks the **same candidate multiset** by a transparent JS score; **one** optional **AI insight** call (Groq or **mock**) grounded to returned car ids only.

**Cut:** full **make / model / variant** normalization — data is a **flat `Car`** row with synthetic **`reviewSummary`** so filters + shortlist + AI fit a **2–3h** slice. No scraping, no real inventory.

### 2. Tech stack and why?

- **Next.js App Router** + TypeScript — fast full-stack in one repo, Route Handlers for GET/POST APIs.
- **Prisma + SQLite** locally (Postgres on Render) — quick schema + seed + deploy story.
- **Zod** — shared prefs for GET query + POST JSON; empty query strings normalized.
- **Vitest** — fast checks for prefs, scoring, GET/POST multiset parity, error paths (not ceremonial).

### 3. AI vs manual — where tools helped most?

**AI / editor assist** sped up **boilerplate** (Prisma schema, seed rows, README structure, Vitest wiring) and **Groq JSON** plumbing. **Manual** decisions: **determinism contract** (single `where`, shared `take`/`orderBy`), **soft vs hard prefs**, and **test matrix** (what must not regress).

### 4. Where did tools get in the way?

Risk of **over-building** if prompts follow a long plan literally; mitigated by shipping **vertical slice first**. Prisma **6 `prisma.config.ts`** + seed wiring had extra warnings vs older `package.json`-only flow.

### 5. If you had another 4 hours?

- **Normalized schema** (Make → Model → Variant) + richer specs.
- **Auth + saved shortlists** (server-side) instead of localStorage only.
- **Rate limits** on LLM route (Playwright smoke is in-repo now).
- **Explain scores** in UI (per-dimension breakdown).

## Environment

See [`.env.example`](.env.example). **`AI_PROVIDER=mock`** avoids Groq for review. For Groq, set **`AI_PROVIDER=groq`** and **`GROQ_API_KEY`**.

## API

- `GET /api/cars?...` — browse ordering; **`meta.count`**, **`meta.capped`**, **`meta.take`**.
- `POST /api/shortlist` — same candidate pool as GET for identical prefs; **`cars[].score`**; **`aiInsight`** or `null` on LLM failure (HTTP **200**).

## TypeScript / build notes

- Run **`npm run build`** before deploy (same gate as CI/host).
- **`skipLibCheck: true`** already in `tsconfig.json`.
- Avoid **`typescript.ignoreBuildErrors`** unless emergency (would hide real bugs).

## Recording hygiene

Do not show real **`GROQ_API_KEY`** or production DB URLs on screen; use placeholders in `.env` for the recording segment where env is shown.
