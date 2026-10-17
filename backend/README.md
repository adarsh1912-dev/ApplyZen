# Applyzen Backend

Express + PostgreSQL backend for Applyzen. All database access is raw
parameterized SQL through `pg` — no ORM or query builder anywhere.

## Quick start

```bash
# 1. Start Postgres (from the repo root)
docker compose up -d db

# 2. Configure (from backend/)
cp .env.example .env
# edit .env: set ACCESS_TOKEN_SECRET (32+ random chars), FRONTEND_ORIGIN

# 3. Migrate + (optional) seed demo data
npm install
npm run migrate
npm run seed   # demo@applyzen.local / demo-password-123 (dev only, never prod)

# 4. Run
npm run dev    # watch mode, :4000
npm start      # production
```

Frontend: set `VITE_API_URL=http://localhost:4000` (see `frontend/.env.example`)
and restart Vite. Without it the UI runs offline on localStorage.

## Tests

```bash
npm test   # Vitest + Supertest, real Postgres test DB (applyzen_test)
```

33 integration tests: auth, resumes/versions, applications, analyses.
The suite refuses to run against a non-`*_test` database and runs files
sequentially in one worker (shared DB + truncating setup).

## Auth design

- `POST /api/auth/register|login` → sets two HttpOnly `SameSite=Lax` cookies:
  `az_at` (JWT access, 15 min, **bound to the server-side session id**) and
  `az_rt` (opaque 256-bit refresh token, 30 days; only its SHA-256 is stored).
- `POST /api/auth/refresh` rotates the refresh token (old one revoked atomically).
- `POST /api/auth/logout` revokes the current session — access tokens stop
  working immediately because every request checks session liveness (indexed PK).
- `GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id`, `POST /api/auth/logout-all`.
- Passwords: bcrypt (12 rounds; 4 in tests). Emails normalized + unique.
  Login errors are identical for unknown email vs wrong password.
- CSRF: `SameSite=Lax` + strict Origin/Referer check on mutating requests
  when cookie auth is present. CORS allowlists `FRONTEND_ORIGIN` only.

## API

Envelope: `{ success: true, data }` / `{ success: false, error: { code, message, details } }`.

| Method | Route | Notes |
|---|---|---|
| GET | `/health`, `/ready` | readiness checks DB connectivity |
| POST | `/api/auth/register`, `/login`, `/refresh`, `/logout`, `/logout-all` | rate-limited |
| GET | `/api/auth/me`, `/api/auth/sessions` | |
| DELETE | `/api/auth/sessions/:id` | revoke one session |
| POST/GET | `/api/resumes` | list paginated, content omitted |
| GET/PATCH/DELETE | `/api/resumes/:id` | `expected_updated_at` → 409 on stale write |
| POST | `/api/resumes/:id/duplicate` | copy + fresh v1 snapshot |
| GET/POST | `/api/resumes/:id/versions` | snapshots, `MAX+1` in a transaction |
| GET | `/api/resumes/:id/versions/:version` | |
| POST/GET | `/api/applications` | filter `status,q,from,to`, sort allowlist, pagination |
| GET/PATCH/DELETE | `/api/applications/:id` | |
| GET | `/api/applications/stats` | SQL `GROUP BY` counts |
| POST/GET | `/api/analyses` | heuristic engine (labeled); LLM if configured |
| GET | `/api/analyses/:id` | |
| POST | `/api/resumes/:id/tailor` | AI rewrite for a posting (review-then-apply; 503 if unconfigured) |
| POST | `/api/resumes/import` | file → AI-structured résumé (PDF/DOCX/TXT/MD, ≤5 MB) |
| GET | `/api/templates` | static catalog |

Statuses are stored lowercase (`saved…rejected`, CHECK-constrained) and
returned as display labels (`Saved…Rejected`).

## Analysis engine

Default: deterministic skill-lexicon overlap (`engine: "heuristic"`,
`result.simulated: true`). It only cites text already in the resume — it never
invents qualifications. If `LLM_API_URL/KEY/MODEL` are set, an
OpenAI-compatible provider is tried with a system prompt that treats documents
as untrusted data; its JSON is Zod-validated and any failure falls back to the
heuristic engine. Keys and provider errors never reach clients. No queue:
analysis is synchronous (single HTTP call); `status: "complete"` is stored for
forward compatibility.

DeepSeek example (set in `backend/.env`, then restart the server):

```
LLM_API_URL=https://api.deepseek.com
LLM_API_KEY=sk-...          # create one at https://platform.deepseek.com/api_keys
LLM_MODEL=deepseek-chat     # JSON output mode; deepseek-reasoner does not support it
LLM_TIMEOUT_MS=25000
```

Analyses are rate-limited to 20/min per IP and the client labels which engine
ran (`AI analysis` vs `Simulated analysis`) so users always know where results
came from.

### Autoconfigure (resume tailoring)

`POST /api/resumes/:id/tailor` rewrites the summary, bullets, and skill order
for a posting and returns a `changes` changelog. Nothing is persisted by the
endpoint: the client shows a review dialog, then applies it (snapshotting the
previous version first) or saves it as a copy. The server reassembles the final
content around the model's output, so education, projects, certifications,
contact details, visibility, and section order can never be altered or lost —
and if the model drops or invents an experience entry, the call fails instead
of saving. Requires a configured provider (503 `AI_NOT_CONFIGURED` otherwise);
provider failures return 502 `AI_PROVIDER_FAILED` with internals hidden.

### Import: bring your own résumé

`POST /api/resumes/import` accepts `{ filename, data_base64 }` (≤ 5 MB decoded;
this one route allows an 8 MB JSON body) and stores a new résumé. Text is
extracted server-side — `unpdf` for PDF, `mammoth` for DOCX, UTF-8 for
TXT/MD — normalized, then structured into resume content by the provider.
Scanned (image-only) PDFs return 422 `IMPORT_EMPTY_TEXT`, unsupported
extensions 415 `UNSUPPORTED_FILE`, password-protected files 422. Structuring
needs the provider, so without one the endpoint returns 503
`AI_NOT_CONFIGURED`. The result is a normal résumé: analyze, autoconfigure,
and edit it like any other.

## Security notes

- Zod validation on bodies, params, and query strings; 1 MB JSON limit.
- Helmet headers, explicit CORS (never wildcard + credentials).
- Ownership enforced inside SQL (`AND user_id = $…`), never just in the UI.
- Error middleware maps PG codes (23505→409) and hides internals (no stacks/SQL).
- Safe logging: no passwords, tokens, cookies, or resume content in logs.
- Graceful shutdown drains the HTTP server and closes the pool.

## Limitations / not built

OAuth, email delivery, payments, file uploads (PDF/DOCX import), and
server-side PDF rendering (frontend uses print-to-PDF). Resume content is
Zod-bounded but otherwise schemaless JSONB.
