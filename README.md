# Auth Service

NestJS authentication and authorization service for the e-commerce platform.

## Features

- JWT-based auth (access + refresh token flow)
- User registration and login
- Password reset flow (forgot/reset)
- OTP send and verify endpoints
- Role and permission management
- Swagger API documentation at `/docs`

## Tech Stack

- NestJS 11
- TypeORM + PostgreSQL
- Redis cache/store
- Swagger (OpenAPI)

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL
- Redis

## Environment Variables

1. Copy the example file:

```bash
cp .env.example .env
```

2. Update values in `.env` as needed.

Main variables:

- `NODE_ENV`, `PORT`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `DB_SYNC`, `DB_LOGGING`, `DB_SSL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `APP_FRONTEND_URL`
- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (for seeding)

## Installation

```bash
npm install
```

## Run the Service

Development:

```bash
npm run start:dev
```

Production build:

```bash
npm run build
npm run start:prod
```

Default port in code is `8000` if `PORT` is not set.

## Database Migrations

Create an empty migration:

```bash
npm run migration:create -- src/database/migrations/<MigrationName>
```

Generate migration from entity changes:

```bash
npm run migration:generate -- src/database/migrations/<MigrationName>
```

Run pending migrations:

```bash
npm run migration:run
```

Revert last migration:

```bash
npm run migration:revert
```

Show migration status:

```bash
npm run migration:show
```

## Seed Super Admin

```bash
npm run seed:permissions
```

Make sure super admin env vars are set in `.env` before running the seeder.

## API Docs

When the app is running, open:

- `http://localhost:<PORT>/docs`

Bearer auth is configured in Swagger using `access-token`.

## Useful Endpoints

Auth endpoints (prefix: `/auth`):

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /forgot-password`
- `POST /reset-password`
- `GET /me`
- `POST /send-otp`
- `POST /verify-otp`

## Quality Commands

```bash
npm run lint
npm run test
npm run test:cov
npm run test:e2e
```
