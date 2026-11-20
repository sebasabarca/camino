# Camino: Serena's Spanish course

A private, mobile-first web app for one learner: short teach-then-quiz lessons in Mexican Spanish, unit checks, delayed
memory checks and spaced review. Next.js 15 (App Router), TypeScript, Tailwind 4, SQLite (better-sqlite3).

## Run locally

```bash
nvm use                  # Node 24 (.nvmrc); Tailwind 4 needs Node >= 20.19
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev              # http://localhost:3000
node --test lib/answer.test.ts lib/steps.test.ts lib/login-guard.test.ts
```

## Data

| File | What | In git |
| --- | --- | --- |
| `data/course.db` | Read-only course content. Built by the separate course-content pipeline (not in this repo) and committed here. | yes |
| `$DATA_DIR/progress.db` | The learner's progress, answers, reports. Created on first use. | **never** |
| `$DATA_DIR/backups/` | One copy of progress.db a day, newest 30 kept. | **never** |

`DATA_DIR` defaults to `./data`. `COURSE_DB` can point at a different content file (defaults to `./data/course.db`).

## Deploy

Docker behind an existing Caddy: see **`DEPLOY.md`**. That covers the environment variables, the first deployment,
updates, rollback and backups. Files: `Dockerfile`, `.dockerignore`, `compose.yaml`.
