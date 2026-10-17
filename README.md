# Applyzen — AI Resume Builder

Two independent packages:

| Directory | Stack | Docs |
|---|---|---|
| `frontend/` | React 19 + Vite + Tailwind | `frontend/README.md` |
| `backend/` | Express + PostgreSQL (raw SQL via `pg`) + Zod + cookie JWT auth | `backend/README.md` |

`docker-compose.yml` at the root provides the dev Postgres database.

## Quick start

```bash
# 1. Start Postgres
docker compose up -d db

# 2. Backend (from backend/)
cp .env.example .env      # set ACCESS_TOKEN_SECRET; FRONTEND_ORIGIN defaults to :5173
npm install
npm run migrate
npm run seed              # optional demo data
npm run dev               # http://localhost:4000

# 3. Frontend (from frontend/)
cp .env.example .env      # VITE_API_URL=http://localhost:4000 (omit to run offline on localStorage)
npm install
npm run dev               # http://localhost:5173
```

Each package has its own `package.json`, lockfile, `.env`, and `node_modules` — run
commands from the respective directory.
