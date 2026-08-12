FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec babel --out-dir=dist src

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache neovim && corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist 
COPY --from=builder /app/src/db ./src/db/

RUN addgroup -g 1001 -S nodejs && \
      adduser -S nodejs -u 1001 && \
      chown -R nodejs:nodejs /app
USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --eval "process.exit(0)" || exit 1

CMD ["node", "./dist/index.js"]
