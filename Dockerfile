FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --ignore-scripts=false

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/index.js"]

# Migrate (has pnpm + source for drizzle-kit)
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
CMD ["pnpm", "db:push"]
