# syntax=docker/dockerfile:1
FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY apps/desktop/package.json apps/desktop/
COPY packages/tests/package.json packages/tests/
COPY packages/config/package.json packages/config/
# --ignore-scripts keeps electron's postinstall (a ~100MB binary download) out of the web image
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:1.3.14-alpine AS build
WORKDIR /app
# Bun's isolated linker does NOT hoist: every workspace has its own node_modules.
# Copy the whole deps stage, never an enumerated list of node_modules dirs.
COPY --from=deps /app /app
COPY . .
RUN bun packages/tests/build.js

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
# Railway custom domains on the shared project are pinned to target port 8080.
ENV PORT=8080
EXPOSE 8080
CMD ["bun", "apps/web/src/main.js"]
