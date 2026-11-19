# Camino: Serena's Spanish course

A private, mobile-first web app for one learner: short teach-then-quiz lessons in Mexican Spanish, unit checks, delayed
memory checks and spaced review. Next.js 15 (App Router), TypeScript, Tailwind 4, SQLite (better-sqlite3).

## Run locally

```bash
nvm use                  # Node 24 (.nvmrc); Tailwind 4 needs Node >= 20.19
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev              # http://localhost:3000
node --test lib/answer.test.ts lib/steps.test.ts
```

## Data

| File | What | In git |
| --- | --- | --- |
| `data/course.db` | Read-only course content. Built by the separate course-content pipeline (not in this repo) and committed here. | yes |
| `$DATA_DIR/progress.db` | The learner's progress, answers, reports. Created on first use. | **never** |
| `$DATA_DIR/backups/` | One copy of progress.db a day, newest 30 kept. | **never** |

`DATA_DIR` defaults to `./data`. `COURSE_DB` can point at a different content file (defaults to `./data/course.db`).

## Deploy

1. On the server: `git clone`, `npm ci`, `npm run build`.
2. Set `APP_PASSWORD`, `OWNER_PASSWORD` (≥ 8 chars) and `AUTH_SECRET` (≥ 32 chars). Without them production returns 503.
3. Set `DATA_DIR` to a persistent directory **outside** the checkout, so progress survives redeploys.
4. Serve behind HTTPS (the session cookie is marked secure when `x-forwarded-proto` is https): `npm start -- -p 3000`.
5. Content updates: re-export `course.db`, commit, push, then `git pull && npm run build` on the server and restart.
6. Copy `$DATA_DIR/backups/` off the server now and then.
