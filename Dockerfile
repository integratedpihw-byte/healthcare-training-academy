# Self-hosting option (the primary target is Vercel). Multi-stage build; runs as non-root.
#   docker build -t chta .
#   docker run --env-file .env.production -p 3000:3000 chta
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN useradd --system --uid 1001 chta
COPY --from=build --chown=chta /app/.next ./.next
COPY --from=build --chown=chta /app/node_modules ./node_modules
COPY --from=build --chown=chta /app/public ./public
COPY --from=build --chown=chta /app/package.json ./package.json
COPY --from=build --chown=chta /app/next.config.ts ./next.config.ts
USER chta
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "start", "-p", "3000"]
