FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Install dependencies ───────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Build ──────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Production runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone output — server.js unpacks to /app
COPY --from=builder /app/.next/standalone ./

# Static assets: must live at /app/.next/static so standalone server.js can serve /_next/static/*
COPY --from=builder /app/.next/static ./.next/static

# ref-doc (DA Manual HTML + images) — read at runtime by manualsRouter
COPY --from=builder /app/ref-doc ./ref-doc

# uploads dir — owned by node before volume is mounted
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

EXPOSE 3050
ENV PORT=3050
ENV HOSTNAME=0.0.0.0
# Run as non-root
USER node
CMD ["node", "server.js"]

# ── Migrator (needs drizzle-kit + full source) ─────────────────────────────────
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "db:push"]
