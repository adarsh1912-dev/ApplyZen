# ApplyZen — AI Resume Builder

**Build, tailor, and track job-ready resumes with AI — without inventing a single fact.**

<p align="center">
  <img src="docs/assets/demo.gif" alt="ApplyZen demo: landing page, dashboard, resume editor, job analyzer, and templates" width="920" />
</p>

<p align="center">
  <strong>53 integration tests</strong> · 8 templates · 3 MB import limit · ~120 KB gzipped frontend · <a href="https://applyzen.space">Live demo</a>
</p>

<p align="center">
  <img src="docs/assets/landing.png" alt="ApplyZen landing page" width="45%" />
  <img src="docs/assets/editor.png" alt="ApplyZen resume editor with a live A4 preview" width="45%" />
</p>

ApplyZen is a full-stack resume workspace: a structured editor with a true-to-print A4 live preview, ATS-conscious templates, a job-description analyzer, evidence-based AI writing assistance, and an application tracker. Run it against the bundled Postgres backend with accounts and sync, or entirely offline in your browser — the same UI works both ways.

---

## Table of contents

- [Highlights](#highlights)
- [Screenshots](#screenshots)
- [Feature tour](#feature-tour)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [API](#api)
- [How the AI features work](#how-the-ai-features-work)
- [Data & privacy](#data--privacy)
- [Testing](#testing)
- [Security notes](#security-notes)
- [Limitations](#limitations)

---

## Highlights

- **True A4 document, not a web page.** The preview is a fixed 794 × 1123 px sheet that fits your pane, zooms 50–200% (buttons or scroll-wheel, cursor-anchored), pans by dragging when zoomed, and prints at exact 210 × 297 mm with zero margins — what you see is what the PDF contains.
- **Eight templates**, all single-column or ATS-parse-friendly: four classics plus four engineering-focused layouts.
- **Job-description matching that stays honest.** Skill overlap, demonstrated-vs-missing breakdowns, and rewrite suggestions — never a fake "hiring probability."
- **AI that cites evidence.** Bullet rewrites strengthen verbs and add metrics only where the source text supports them, and every suggestion can be reviewed before use. Tailoring is server-guarded: invented or dropped experience entries fail instead of saving. Out of the box the same UI runs on a clearly-labeled deterministic simulator; connect any OpenAI-compatible provider (DeepSeek, OpenAI, …) to go live.
- **Import your existing resume** (PDF, DOCX, TXT, MD) and have it structured into editable sections.
- **Application tracker** with pipeline statuses, search/filter, and SQL-backed stats.
- **Works offline.** With no backend configured, everything autosaves to localStorage — sign-up-free evaluation mode. Point the frontend at the API to enable accounts, sync, and AI.

---

## Screenshots

| Dashboard | Job analyzer |
| --- | --- |
| ![Dashboard with resume and application stats](docs/assets/dashboard.png) | ![Job analyzer with compatibility results](docs/assets/analyzer.png) |
| **Templates** | **Application tracker** |
| ![Template gallery with real resume thumbnails](docs/assets/templates.png) | ![Application tracker with pipeline statuses](docs/assets/tracker.png) |

---

## Feature tour

### Resume editor

- Structured sections with proper labels and validation: personal info, summary, experience, education, skills, projects, certifications.
- Reorder experience roles and sections with keyboard-accessible move controls; add/remove bullets per role.
- Explicit **Save** plus autosave; every save takes a **version snapshot** (online mode) so you always have an undo point.
- Duplicate any resume from the dashboard with its own version history.
- Live document: the A4 pane updates as you type.

### A4 preview & export

- Fixed A4 geometry (794 × 1123 px ≈ 96 dpi) — no layout drift between screen and paper.
- Auto-fits the preview pane (ResizeObserver), manual zoom 50–200% with buttons; **scroll-wheel zoom** anchored at the cursor.
- **Drag-to-pan** when zoomed beyond fit (grab cursor; touch devices keep native scrolling).
- **Print to real PDF** via the browser: `@page { size: A4; margin: 0 }` and print rules that flatten the app chrome, leaving only the document.

### Templates

| Template | Character | Suited to |
|---|---|---|
| Classic Professional | Serif headlines, ruled sections | Finance, law, consulting |
| Modern Minimal | Clean sans, generous whitespace | Product, design, marketing |
| Technical | Dense mono details, skill groups | Software & data roles |
| Compact One-Page | Two-column, tight spacing | Experienced hires, one page |
| Engineer Pro | Grouped skills, impact-first bullets | Backend, frontend, platform SWEs |
| Terminal | Monospace CLI aesthetic | Developer roles (still prints clean) |
| Open Source | Projects-forward with link chips | Full-stack & OSS engineers |
| Staff Engineer | Senior IC polish, scope & systems thinking | Senior/staff engineering |

Switch templates at any time from the templates gallery; content is template-independent.

### Job description analyzer

- Paste any posting (minimum length enforced). The analyzer extracts **required** and **preferred** skills.
- Shows what your resume already demonstrates, what's missing, and per-skill evidence — as a text estimate, labeled by engine (`Simulated analysis` vs `AI analysis`).
- Analysis history is persisted per resume (online mode) and listed without full payloads.

### AI writing assistance

- **Bullet rewrites** inside the editor's AI panel: stronger verbs, concrete metrics, tighter phrasing — each suggestion can be accepted, edited, or rejected.
- **Tailoring (autoconfigure):** `POST /api/resumes/:id/tailor` rewrites the summary, bullets, and skill order for a specific posting and returns a changelog. The server reassembles the final document itself — education, projects, certifications, contact details, visibility, and section order can never be altered or dropped; if the model invents or deletes an experience entry, the call **fails** instead of saving. You review the diff, then apply in place (with an automatic undo snapshot) or save as a copy.
- **Résumé import:** upload PDF/DOCX/TXT/MD (≤ 3 MB decoded). Text is extracted server-side (`unpdf`, `mammoth`), then structured into sections by the provider. Scanned/image-only PDFs are rejected with a clear 422; password-protected files are rejected; unsupported extensions get 415.

### Application tracker

- Pipeline statuses: `Saved → Applied → Assessment → Interview → Offer` (+ `Rejected`), stored lowercase with a CHECK constraint, displayed as labels.
- Company, role, date, notes, URL. Search, status filter chips, date-range filtering, and pagination.
- Dashboard tiles computed with SQL `GROUP BY`: totals, per-status counts, late-stage counts, and recent activity.

### Accounts, sync & offline mode

- **Online:** register/login over cookie-based auth. Passwords are bcrypt-hashed (12 rounds). Sessions are server-side rows; the access token is a 15-minute JWT *bound to the session id*, so logout revokes access immediately. Refresh tokens are opaque, 30 days, rotated on use, stored only as SHA-256 hashes. Manage devices via a sessions list with per-session revoke and logout-all.
- **Offline:** the entire app runs from localStorage with the same components and flows — a sample resume and tracker entries seed on first run. A demo seed (`npm run seed`) creates `demo@applyzen.local` / `demo-password-123` for the online mode.

### Interface

- Light/dark theme (system-preference aware, persisted, no flash on load).
- Fully responsive: sidebar app shell on desktop, top bar with icon nav on mobile; the tracker renders a table on wide screens and cards on narrow ones.
- Accessible by construction: labeled inputs, `sr-only` labels where visuals are compact, keyboard-operable reordering, visible focus, ARIA labels on icon-only controls, and print CSS that strips chrome.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, lucide-react, Oxlint |
| Backend | Node.js, Express, Zod, `pg` (raw parameterized SQL — no ORM), cookie JWT auth, Helmet, CORS allowlist, rate limiting |
| AI | Any OpenAI-compatible chat-completions provider (e.g. DeepSeek) — optional; deterministic heuristic engine built in |
| Database | PostgreSQL 18 (Docker Compose for dev) |
| Testing | Vitest + Supertest against a real Postgres test DB |

## Project structure

```
.
├── frontend/           # React 19 + Vite SPA
│   └── src/
│       ├── pages/      # Landing, Dashboard, Editor, Analyzer, Templates, Tracker, Login
│       ├── components/ # layout (nav/shell), resume (A4 preview + renderers), ui
│       └── lib/        # api client, unified data layer, store (templates + offline mode)
├── backend/            # Express API
│   ├── src/
│   │   ├── routes/     # auth, resumes, applications, analyses, templates
│   │   ├── services/   # auth, tailoring, analysis engine, import
│   │   ├── repositories/  # SQL (pg), one file per table
│   │   ├── middleware/ # authenticate, CSRF origin check, rate limit, errors
│   │   └── db/         # migrations (plain SQL), seed
│   └── tests/          # integration suite
└── docker-compose.yml  # dev Postgres
```

## Quick start

Prerequisites: Docker, Node.js 22+.

```bash
# 1. Start Postgres (from the repo root)
docker compose up -d db

# 2. Backend (from backend/)
cp .env.example .env
# edit .env: set ACCESS_TOKEN_SECRET (32+ random chars); the rest has dev defaults
npm install
npm run migrate
npm run seed      # optional: demo@applyzen.local / demo-password-123
npm run dev       # http://localhost:4000

# 3. Frontend (from frontend/)
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev       # http://localhost:5173
```

To try the offline mode instead, omit `frontend/.env` (or leave `VITE_API_URL` empty) — the UI runs entirely in the browser.

### Scripts

| Where | Command | Does |
|---|---|---|
| `backend/` | `npm run dev` | API with watch, `:4000` |
| `backend/` | `npm run migrate` | Apply pending SQL migrations |
| `backend/` | `npm run seed` | Demo user + resume + applications (dev only) |
| `backend/` | `npm test` | Integration suite (real Postgres test DB) |
| `frontend/` | `npm run dev` | Vite dev server, `:5173` |
| `frontend/` | `npm run build` | Production build to `dist/` |
| `frontend/` | `npm run lint` | Oxlint |

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | e.g. `postgres://applyzen:applyzen_dev@127.0.0.1:5432/applyzen` |
| `DATABASE_SSL` | no | `true` for Heroku Postgres and other TLS-required managed databases |
| `ACCESS_TOKEN_SECRET` | yes | 32+ random chars; signs access JWTs |
| `REFRESH_TOKEN_PEPPER` | no | Extra pepper for refresh-token hashes |
| `FRONTEND_ORIGIN` | yes | Comma-separated exact origins for CORS + CSRF, e.g. `http://localhost:5173`. Required in production. |
| `FRONTEND_ORIGIN_PATTERNS` | no | Comma-separated wildcard patterns for preview deployments, e.g. `https://applyzen-*-team.vercel.app` |
| `TRUST_PROXY` | no | Express trust-proxy hops. Default `1` (Railway edge); use `2` behind Vercel → Railway. |
| `PORT` | no | Default `4000` |
| `COOKIE_SECURE` | no | `true` in production (HTTPS) |
| `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` | no | OpenAI-compatible provider; unset = heuristic engine |
| `LLM_TIMEOUT_MS` | no | Default `25000` |

### Frontend (`frontend/.env`)

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend origin (e.g. `http://localhost:4000`). Leave empty for offline mode. On Vercel with the `/api` proxy, set `/`. |

## Deployment (Vercel + Heroku/Railway)

The included setup proxies `/api/*` from Vercel to the backend. The browser sees
one origin, so the `SameSite=Lax` auth cookies stay first-party. Use either
Heroku or Railway for the API. The repo ships a root `Dockerfile` and
`heroku.yml` for Heroku, and `backend/Dockerfile` for Railway.

### Backend on Heroku

1. Install the Heroku CLI and create the app with Postgres:

```bash
heroku login
heroku create <your-app-name>
heroku stack:set container -a <your-app-name>
heroku addons:create heroku-postgresql:essential-0 -a <your-app-name>
```

Use `heroku addons:plans heroku-postgresql` to see the plans available to your
credits. After the first deploy, choose the dyno size explicitly:

```bash
heroku ps:scale web=1:eco -a <your-app-name>    # ~$10/mo total; sleeps when idle
# or
heroku ps:scale web=1:basic -a <your-app-name>  # ~$12/mo total; always on
```

2. Set config vars (do **not** set `PORT`; Heroku injects it, and the add-on sets
   `DATABASE_URL`):

```bash
heroku config:set -a <your-app-name> \
  NODE_ENV=production \
  ACCESS_TOKEN_SECRET=$(openssl rand -hex 32) \
  REFRESH_TOKEN_PEPPER=$(openssl rand -hex 32) \
  FRONTEND_ORIGIN=https://your-app.vercel.app \
  COOKIE_SECURE=true \
  TRUST_PROXY=2 \
  DATABASE_SSL=true
```

3. Deploy. Either connect the repo in the Heroku dashboard and enable automatic
   deploys from `main` (`heroku.yml` builds the root Dockerfile and runs
   migrations in the release phase), or push the image:

```bash
heroku container:login
heroku container:push web -a <your-app-name>
heroku container:release web -a <your-app-name>
```

Run the container commands from the repo root so the root `Dockerfile` is used.

4. Verify:

```bash
curl https://<your-app-name>.herokuapp.com/health
curl https://<your-app-name>.herokuapp.com/ready
```

5. Add the Heroku URL to the Vercel rewrite below. Add
   `FRONTEND_ORIGIN_PATTERNS=https://your-project-*-your-team.vercel.app` if
   preview deployments should authenticate.

#### Keeping within the $13/month Heroku student credit

- **Eco dyno + Heroku Postgres Essential 0 ≈ $10/month.** Leaves a $3 buffer;
  the dyno sleeps after inactivity, so the first request is slow.
- **Basic dyno + Essential 0 ≈ $12/month.** Always on, but only a $1 buffer
  before tax/proration. Verify your first invoice; if tax applies, use Eco.
- **Basic dyno + Neon free Postgres ≈ $7/month.** More headroom and always-on,
  at the cost of an external database dependency. Set `DATABASE_URL` to Neon
  and `DATABASE_SSL=true`.
- Keep exactly **one** web dyno. Do not add Standard dynos, worker dynos, Redis,
  or other paid add-ons. Heroku Postgres Essential 0 includes 1 GB, which is
  plenty for this app's JSONB data.
- Credits are not a hard cap: set a billing alert/spending limit in the Heroku
  dashboard and check **Usage & Billing** after the first month.
- If the student credit ever ends, stop charges with
  `heroku ps:scale web=0 -a <your-app-name>`, then destroy the Postgres
  add-on/app, or move the database to a free provider.

### Backend on Railway

1. Create a Railway project from this repo and add a PostgreSQL database.
2. Backend service settings: **Root Directory** `backend`, **Builder** Dockerfile,
   **Healthcheck Path** `/ready`.
3. Generate a public domain, then set:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=${{Postgres.DATABASE_URL}}
ACCESS_TOKEN_SECRET=<openssl rand -hex 32>
REFRESH_TOKEN_PEPPER=<openssl rand -hex 32>
FRONTEND_ORIGIN=https://your-app.vercel.app
COOKIE_SECURE=true
TRUST_PROXY=2
```

The Dockerfile runs migrations on start. Do not run `npm run seed` in production.

### Frontend on Vercel

1. Import the repo, set **Root Directory** `frontend` (the framework/build
   settings come from `frontend/vercel.json`).
2. Add `VITE_API_URL=/` for the Production and Preview environments.
3. Replace the placeholder in the `/api/:path*` rewrite in
   `frontend/vercel.json` with the Heroku or Railway domain, then deploy.
4. Set the backend's `FRONTEND_ORIGIN` to the final Vercel domain and redeploy.

For separate custom domains (`app.example.com` on Vercel, `api.example.com` on
the backend host), delete the `/api` rewrite, set
`VITE_API_URL=https://api.example.com`, and set `TRUST_PROXY=1`. Both hosts must
share a registrable domain for `SameSite=Lax` cookies. The frontend CSP in
`vercel.json` also needs the API origin added to `connect-src`.

## API

All responses use one envelope: `{ "success": true, "data": … }` or `{ "success": false, "error": { "code", "message", "details"? } }`.

| Method | Route | Notes |
|---|---|---|
| GET | `/health`, `/ready` | `ready` checks DB connectivity |
| POST | `/api/auth/register`, `/login`, `/refresh`, `/logout`, `/logout-all` | Rate-limited; sets `az_at` / `az_rt` HttpOnly cookies |
| GET | `/api/auth/me`, `/api/auth/sessions` | |
| DELETE | `/api/auth/sessions/:id` | Revoke one session |
| POST/GET | `/api/resumes` | List paginated (content omitted from lists) |
| GET/PATCH/DELETE | `/api/resumes/:id` | Optimistic concurrency via `expected_updated_at` → 409 on stale writes |
| POST | `/api/resumes/:id/duplicate` | Copy with fresh v1 snapshot |
| GET/POST | `/api/resumes/:id/versions` | Snapshots (`MAX+1` in a transaction) |
| GET | `/api/resumes/:id/versions/:version` | |
| POST | `/api/resumes/:id/tailor` | AI rewrite for a posting (review-then-apply; 503 if no provider) |
| POST | `/api/resumes/import` | File → structured resume (PDF/DOCX/TXT/MD, ≤ 3 MB) |
| POST/GET | `/api/applications` | Filter `status,q,from,to`; allowlisted sort; pagination |
| GET/PATCH/DELETE | `/api/applications/:id` | |
| GET | `/api/applications/stats` | SQL aggregation per status |
| POST/GET | `/api/analyses` | Heuristic engine by default; LLM if configured |
| GET | `/api/analyses/:id` | |
| GET | `/api/templates` | Static template catalog |

Interactive details and error codes are documented in [`backend/README.md`](backend/README.md).

## How the AI features work

ApplyZen separates *capability* from *honesty*:

1. **Heuristic engine (default).** Deterministic skill-lexicon overlap between the resume and the job description. Labeled `Simulated analysis` / `engine: "heuristic"` with `simulated: true`. It only ever cites text already present in the resume.
2. **LLM engine (optional).** If `LLM_API_URL`/`LLM_API_KEY`/`LLM_MODEL` are set, analyses and tailoring go to an OpenAI-compatible provider. The system prompt treats the resume and posting as untrusted data; the JSON response is Zod-validated; any failure falls back to the heuristic. Provider errors and keys never reach clients.
3. **Guardrails on tailoring.** The server — not the model — decides the final document structure. Education, projects, certifications, contact details, section visibility, and order are re-asserted around the model's output. Invented or dropped experience entries fail the request (502) rather than corrupting your resume.
4. **Client labeling.** The UI always shows which engine produced a result (`AI analysis` vs `Simulated analysis`), so users never mistake simulation for a live model.

DeepSeek example (in `backend/.env`, then restart):

```
LLM_API_URL=https://api.deepseek.com
LLM_API_KEY=sk-...
LLM_MODEL=deepseek-chat     # JSON output mode; deepseek-reasoner does not support it
```

## Data & privacy

- **Offline mode:** resumes, applications, active selection, and theme live in your browser's localStorage (`az_*` keys; a one-time migration reads pre-rename `rp_*` keys). Nothing leaves the machine.
- **Online mode:** data is stored in your Postgres instance, scoped per user with ownership enforced *inside every SQL query*, not just in the UI. Resume content is Zod-bounded but schemaless JSONB.
- The server logs no passwords, tokens, cookies, or resume content.
- Match estimates are text-based heuristics — never hiring probabilities, never fabricated metrics.

## Testing

```bash
cd backend
npm test
```

53 integration tests across auth, origins, resumes/versions, applications, analyses, import, and tailoring — run against a real Postgres database (`applyzen_test`, created and migrated automatically). The suite refuses to run against a non-`*_test` database and truncates between tests. Provider-facing tests force the LLM off so runs are deterministic.

Frontend: `npm run lint` (Oxlint) and `npm run build`.

## Security notes

- Cookie auth: HttpOnly, `SameSite=Lax`, optional `Secure`; access tokens bound to live server-side sessions (revocation is immediate).
- CSRF: strict Origin/Referer validation on mutations whenever auth cookies are present, on top of `SameSite=Lax`.
- Zod validation on bodies, params, and query strings; 1 MB JSON limit (4.5 MB only on the import route, which is base64-capped to 3 MB decoded).
- Helmet headers including a deny-by-default CSP; explicit CORS allowlist (exact origins or explicitly scoped preview patterns, never a bare wildcard).
- Production CSP and security headers for the static frontend in `frontend/vercel.json`.
- Rate limiting on auth and analysis endpoints.
- Ownership checks in SQL; error middleware maps PG codes (23505 → 409) and hides internals; graceful shutdown drains connections.

## Limitations

Not built (by design, for now): OAuth, email delivery, payments, server-side PDF rendering (export uses the browser's print-to-PDF), and multi-currency billing. Analyses are synchronous (single HTTP call) — no queue. LLM features require you to bring your own provider key.

---

Built for job seekers who want structure without fiction.
