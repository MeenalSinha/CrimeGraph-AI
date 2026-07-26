# CrimeGraph AI

Predictive Crime Intelligence & Criminal Network Analytics Platform -- a hackathon
prototype built for a police datathon demo. Synthetic data only; see `AUDIT.md`
for an honest account of what's fully real vs. simplified, and read the fairness
note there before considering any real-world use.

Three apps in one repo: a FastAPI + ML backend, a Next.js web dashboard, and an
Expo/React Native mobile companion app -- plus a GitHub Actions CI pipeline that
tests and builds all of it.

## Quick start (Docker, recommended)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs

## Quick start (manual)

```bash
# Terminal 1 -- backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# First boot auto-generates the synthetic city and trains the ML model (~10-20s)

# Terminal 2 -- frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 -- it redirects to `/dashboard`.

Demo login (if you land on `/login`): any of `admin` / `commissioner` / `inspector`
/ `analyst` / `viewer`, password `demo1234` for all.

## Quick start (mobile companion app)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `w` for a quick web preview. See
`mobile/README.md` for full details, including how to point it at a backend
running on your machine instead of localhost when testing on a physical device.

## Optional: real Mapbox tiles

By default the crime map is a dependency-free stylized SVG driven by real risk
data (no external key needed). To use real Mapbox GL tiles instead, get a token
from https://account.mapbox.com and set `NEXT_PUBLIC_MAPBOX_TOKEN` in `frontend/.env`
(or `.env` at the repo root if using Docker Compose) -- the dashboard switches to
live tiles automatically when the token is present.

## Folder structure

```
crimegraph-ai/
├── README.md
├── AUDIT.md                     <- honest limitations & verification log, read this
├── ARCHITECTURE.md              <- system diagram, request flow, data model (mermaid)
├── docker-compose.yml
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml                <- CI: backend tests, frontend build, docker build
│
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py              <- FastAPI entrypoint, mounts all routers
│   │   ├── core/
│   │   │   ├── config.py        <- settings, env vars
│   │   │   └── middleware.py    <- rate limiting, security headers, request logging
│   │   ├── data/
│   │   │   ├── synthetic_generator.py   <- Module 17: fake city generator
│   │   │   ├── store.py                 <- dual-backend data access layer (CSV or Postgres)
│   │   │   ├── db_models.py             <- SQLAlchemy ORM models (production database)
│   │   │   ├── db_seed.py               <- seeds PostgreSQL from synthetic data
│   │   │   └── generated/               <- generated CSVs (gitignored)
│   │   ├── ml/
│   │   │   ├── train_risk_model.py      <- Module 1: trains + tunes + cross-validates XGBoost models
│   │   │   └── artifacts/               <- trained model files + metrics.json
│   │   ├── models/
│   │   │   └── schemas.py       <- pydantic request/response models
│   │   ├── services/
│   │   │   ├── risk_service.py          <- Module 1 + 5: prediction & explainability
│   │   │   ├── graph_service.py         <- Module 2 + 8: criminal intelligence graph
│   │   │   │                               + temporal evolution + link prediction
│   │   │   ├── patrol_service.py        <- Module 3: patrol optimization (heuristic + real OR-Tools VRP)
│   │   │   ├── investigation_service.py <- Module 4: investigation copilot
│   │   │   ├── chat_service.py          <- Module 10: AI chat assistant
│   │   │   ├── scenario_service.py      <- Module 11: what-if simulator
│   │   │   ├── alerts_service.py        <- Module 12: alerts engine
│   │   │   ├── entity_resolution.py     <- Module 13: duplicate detection
│   │   │   ├── search_service.py        <- Module 14: global search
│   │   │   ├── report_service.py        <- Module 15: PDF/CSV reports
│   │   │   ├── analytics_service.py     <- Module 9: district comparison, officer productivity, recurrence
│   │   │   └── auth_service.py          <- Module 16: JWT + roles
│   │   └── api/
│   │       ├── deps.py          <- auth dependencies
│   │       └── routers/         <- one file per module's REST endpoints
│   └── tests/
│       └── test_services.py     <- 31 pytest tests (30 run + 1 Postgres test,
│                                    skipped unless CRIMEGRAPH_DATABASE_URL is set)
│
├── scripts/
│   ├── setup.sh                 <- one-shot local (non-Docker) setup
│   ├── verify_database.py       <- 5-stage real PostgreSQL verification
│   └── benchmark.py             <- p50/p95/p99 latency profiler against a live server
│
├── frontend/
│   ├── package.json
│   ├── Dockerfile
│   ├── next.config.js / tailwind.config.ts / tsconfig.json
│   ├── vitest.config.ts, vitest.setup.ts   <- unit/component test config
│   ├── playwright.config.ts                <- E2E test config (see AUDIT.md re: unverified here)
│   ├── __tests__/                <- 18 Vitest component/hook/API-client tests
│   ├── e2e/                      <- 17 Playwright E2E tests
│   ├── public/
│   │   ├── sw.js                 <- offline-first service worker
│   │   ├── manifest.json         <- PWA manifest
│   │   ├── offline.html          <- offline fallback page
│   │   └── icon-192.png, icon-512.png
│   ├── hooks/
│   │   └── useVoice.ts           <- Web Speech API voice input/output
│   ├── app/
│   │   ├── layout.tsx, globals.css
│   │   ├── error.tsx, global-error.tsx, loading.tsx  <- error boundaries
│   │   ├── page.tsx              <- redirects to /dashboard
│   │   ├── login/page.tsx        <- Module 16 UI
│   │   ├── dashboard/page.tsx    <- Module 6: command center
│   │   ├── prediction/page.tsx   <- Module 1 + 7 + 11: prediction, map, scenarios
│   │   ├── network/page.tsx      <- Module 2 + 8 + 13: graph explorer + temporal + link prediction
│   │   ├── investigations/       <- Module 4: case list + AI copilot detail view
│   │   ├── patrol/page.tsx       <- Module 3: full patrol view
│   │   ├── analytics/page.tsx    <- Module 9: district comparison, officer productivity, anomalies
│   │   ├── alerts/page.tsx       <- Module 12: alerts feed
│   │   └── reports/page.tsx      <- Module 15: PDF + CSV export
│   ├── components/               <- Sidebar, Topbar, KpiCard, HeatmapPanel,
│   │                                 MapboxHeatmap, CommandConsole (voice-enabled),
│   │                                 OfflineProvider, GraphCanvas, chart panels
│   └── lib/api.ts                <- typed fetch client for the backend
│
└── mobile/                        <- Expo Router / React Native companion app
    ├── README.md                  <- mobile-specific setup & verification notes
    ├── app.json, package.json, tsconfig.json, babel.config.js
    ├── app/                       <- file-based routes: login, tabs, case detail
    ├── components/CacheBadge.tsx  <- offline indicator
    └── lib/{api.ts,theme.ts}      <- offline-first API client (AsyncStorage cache)
```

## Tech stack actually used

**Frontend:** Next.js 14 (App Router) · React 18 · TypeScript · TailwindCSS ·
Recharts · d3-force (graph layout) · mapbox-gl (real tiles, optional, see below) ·
custom SVG map fallback (no Mapbox key required to run the demo) · Web Speech API
(voice interface) · a hand-written service worker (offline-first mode) ·
Vitest + React Testing Library (unit/component tests) · Playwright (E2E, see AUDIT.md)

**Mobile:** Expo Router · React Native · TypeScript · AsyncStorage (offline-first
caching) -- see `mobile/README.md`

**Backend:** FastAPI · Pandas · NetworkX · XGBoost (with RandomizedSearchCV
hyperparameter tuning + StratifiedKFold/KFold cross-validation) · scikit-learn ·
Google OR-Tools (real constrained VRP solver for patrol optimization) ·
SQLAlchemy + PostgreSQL (production database, optional) · RapidFuzz ·
ReportLab · python-jose (JWT) · passlib (bcrypt) · Faker (synthetic data)

**CI/CD:** GitHub Actions (`.github/workflows/ci.yml`) -- backend tests against
both CSV and a real Postgres service container, frontend unit tests + build,
E2E tests (written for GitHub Actions' full-internet-access runners), Docker
image builds, bandit security scan, npm audit report

## Regenerating the demo city


The synthetic city is deterministic (fixed seed) so the dashboard tells the same
story every time you run it. To generate a different city, either change
`CRIMEGRAPH_SEED` in `.env` and restart, or call the admin endpoint at runtime:

```bash
curl -X POST "http://localhost:8000/api/admin/regenerate-city?seed=123"
```

This regenerates all synthetic data, rebuilds the graph, and retrains the ML
models in one call -- useful as a "Reset Demo Scenario" action.

## Demo script (under 5 minutes)

1. **Dashboard** -- show live KPIs, the risk heatmap, and Command AI answering
   "why is [ward] high risk" with a graph/model-grounded answer -- try the mic
   button for voice input, and toggle "voice reply" to hear it read the answer.
2. **Prediction** -- pick a ward, move the hour/weekday sliders, set weather and
   toggle festival day, show the risk score changing with a real explanation,
   then run the Festival scenario to show the what-if delta.
3. **Network** -- click a high-centrality person, show their neighborhood graph,
   switch to the Communities tab to show a detected cluster, and the Hidden Links
   tab to show graph-based link prediction surfacing unconnected-but-plausible pairs.
4. **Investigations** -- open a case, show the AI-generated brief: related cases,
   linked suspect, possible accomplices, missing-evidence flags, next steps.
5. **Patrol** -- show the optimized unit assignments and routes.
6. **Analytics** -- show district comparison, officer productivity, and the
   IsolationForest-flagged anomalous ward-days.
7. **Reports** -- download a PDF and a CSV to show both export formats work.
8. **Mobile** -- open the Expo app on your phone to show the field-officer
   companion view, then toggle airplane mode to show the offline cache banner.

## License / data disclaimer

All data in this repository is synthetically generated (Faker + seeded random
generation). No real persons, real crimes, or real police records are used or
represented anywhere in this codebase.
