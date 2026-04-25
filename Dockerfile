# Build NestJS; final image matches docker-compose `target: production` and fly.toml `build-target`.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS production
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 8080
CMD ["node", "dist/main.js"]
