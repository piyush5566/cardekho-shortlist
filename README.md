# Car shortlist MVP (CarDekho take-home)

**Deliverables (assignment)**

- **Live app:** [https://cardekho-shortlist.onrender.com/](https://cardekho-shortlist.onrender.com/)
- **Repo:** _Add your public GitHub repo URL before submit._
- **Screen recording (required):** _Add your Loom / Google Drive / YouTube (unlisted) link here before submit._

Synthetic data only — [CarDekho](https://www.cardekho.com/) is UX inspiration; no affiliation or scraping.

## Run (warm path, under ~2 minutes)

Prerequisites: Node 20+, npm, [Docker](https://docs.docker.com/get-docker/) (for Postgres).

```bash
cd cardekho-shortlist
docker compose up -d
# Port 5432 busy? CARDEKHO_PG_PORT=5433 docker compose up -d — then use matching ports in .env (see .env.example).
cp .env.example .env
# If you change docker/postgres-init.sql, reset the DB volume once: docker compose down -v && docker compose up -d
npm ci
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First `npm ci` on a slow network may exceed 2 minutes; a second `npm run dev` after deps and DB are ready should be quick.

**Production locally:** `npm run build` then `npm run start` (`next start` uses `PORT`, e.g. on Render).

**Tests**

```bash
npm run test        # Vitest against Postgres test DB (reset + seed in global setup)
npm run build       # same typecheck as deploy
```

**End-to-end (Playwright)** — Postgres database `cardekho_e2e`, `AI_PROVIDER=mock`, dev server on port 3333 (`playwright.config.ts`). Install browsers once: `npx playwright install chromium`, then `npm run test:e2e` (webServer runs migrate, seed, `next dev`).

`npm run test:all` runs Vitest then Playwright. Full local gate: `npm run test && npm run build && npm run test:e2e`.

Outside CI, Playwright can reuse an existing server on 3333; if the wrong app is listening, free the port or set `CI=1` for a clean server.

Vitest uses `cardekho_test` and Playwright uses `cardekho_e2e`, so unit and E2E runs can overlap in separate terminals.

`npm run db:prepare` runs migrate deploy and seed (local refresh; same steps run on Render during build).

## Deploy (Render)

- Production is the **Live app** link at the top. Build steps live in [`render.yaml`](render.yaml): `npm ci`, then `npm run db:prepare` (migrate + seed), then `npm run build`.
- Set `DATABASE_URL` to Postgres (must match Prisma `provider = "postgresql"`). Use Internal or External URL from the Render Postgres dashboard; add `?sslmode=require` when SSL is required. Set it before the first deploy so the build can reach the DB.
- Free web services have no `preDeployCommand` (paid on Render); this repo runs `db:prepare` inside `buildCommand` after `npm ci`. Seed upserts by `slug`, so repeating seed on deploy is safe.
- Start command: `npm run start`. If build fails on migrate/seed, fix `DATABASE_URL` / SSL or run `npx prisma migrate deploy` and `npx prisma db seed` from your machine against production, then redeploy. On paid plans you can move migrate/seed to `preDeployCommand` and shorten `buildCommand` if you prefer.
- Local: `docker compose` plus the same migrations as production.

## README questions (assignment)

### 1. What did you build and why? What did you deliberately cut?

Helps a buyer go from “too many options” to a short ranked list: filters narrow cars, Search shows a capped browse order, Rank matches re-scores the same cars from that search (same query results, re-ranked in JavaScript), and one optional AI tip (Groq or mock) only uses cars in the current response.

**Cut:** no full make/model/variant graph — a flat `Car` table with synthetic `reviewSummary` keeps the work in a 2–3 hour slice. No scraping or real inventory.

### 2. Tech stack and why?

Chosen to ship a typed full-stack MVP quickly:

- Next.js App Router + TypeScript — UI and route handlers in one repo.
- Prisma + PostgreSQL (Docker locally, managed Postgres on Render) — one database stack for app, tests, and deploy.
- Zod — shared validation for GET query and POST JSON.
- Vitest — quick checks on prefs, scoring, GET/POST parity, and errors (focused, not exhaustive).

### 3. AI vs manual — where tools helped most?

**Delegated to Cursor / editor assist:** most implementation — app and API code, database and test setup, README and doc edits from agreed plans, and other in-session repo work. (Not plan sign-off, manual QA, or Render go-live.)

**Done manually:** reviewing the plan and suggesting fixes; exploratory manual testing; Render setup (service, database, env) and verifying the live app.

**Where tools helped most:** faster code and repo iteration once goals and constraints were clear.

### 4. Where did tools get in the way?

Easy to over-build if a long prompt is followed literally — mitigated by shipping the smallest useful version first, then tightening scope. Prisma 6’s separate config file added a bit more setup than older package-only seed flows.

### 5. If you had another 4 hours?

- Normalized schema (make / model / variant) and richer specs.
- Auth and saved shortlists on the server instead of device-only storage.
- Rate limits on the LLM route and clearer score explanations in the UI.

## Environment

See [`.env.example`](.env.example). `AI_PROVIDER=mock` avoids Groq for review. For Groq, set `AI_PROVIDER=groq` and `GROQ_API_KEY`.

## API

- `GET /api/cars?...` — browse ordering; `meta.count`, `meta.capped`, `meta.take`.
- `POST /api/shortlist` — same candidate pool as GET for identical prefs; `cars[].score`; `aiInsight` or `null` on LLM failure (HTTP 200).

## TypeScript / build notes

- Run `npm run build` before deploy (same gate as CI/host).
- `skipLibCheck: true` is already in `tsconfig.json`.
- Avoid `typescript.ignoreBuildErrors` except in a real emergency.

## Recording hygiene

Do not show real `GROQ_API_KEY` or production DB URLs on screen; use placeholders in `.env` when the recording shows env.
