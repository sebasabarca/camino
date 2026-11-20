# syntax=docker/dockerfile:1
# Camino production image: multi-stage, Debian slim (glibc, for better-sqlite3), runs as the non-root `node` user.
# Build: docker compose build   (see DEPLOY.md)

ARG NODE_IMAGE=node:24-bookworm-slim

# 1. Dependencies. The toolchain is only a fallback, for when better-sqlite3 has no prebuilt binary for this
#    platform; it stays in this stage and never reaches the final image.
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
# fail the build here (not at runtime) if the native SQLite module didn't install, e.g. if npm skipped its install script
RUN node -e "new (require('better-sqlite3'))(':memory:').prepare('select 1').get()"

# 2. Build. No secrets are needed here: they are read at runtime. next/font downloads the Google fonts now.
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN test -f data/course.db || (echo "data/course.db is missing: it is committed with the app" && exit 1)
RUN npm run build

# 3. Runtime: just the standalone server, static files, public assets and the read-only course content.
FROM ${NODE_IMAGE} AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data \
    NODE_OPTIONS=--max-old-space-size=256
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# course content lives in the image at /app/data; learner progress lives in the /data volume. Never mount over /app/data.
COPY --from=build --chown=root:root --chmod=444 /app/data/course.db ./data/course.db
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
