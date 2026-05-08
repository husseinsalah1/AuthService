# SERVICE_REVIEW

## Service Overview

This project is a NestJS-based authentication and authorization service for an e-commerce ecosystem.  
Its main purpose is to:

- Register and authenticate users/admins.
- Issue and refresh JWT access/refresh tokens.
- Handle OTP verification and password reset flows.
- Enforce RBAC using roles and permissions.
- Manage users, roles, permissions, and admin creation.

The core domain appears to be identity + access management (IAM) for other services.

## Project Structure Explanation

Main source root: `src/`

- `src/modules/auth`: authentication APIs, JWT strategies, OTP/reset flows orchestration.
- `src/modules/users`: user lifecycle, querying/filtering, updates, soft delete.
- `src/modules/roles`: role CRUD and permission assignment.
- `src/modules/permissions`: permission CRUD and lookup.
- `src/modules/admins`: privileged admin creation flow.
- `src/modules/tokens`: JWT generation.
- `src/modules/password`: password hashing and reset-session management.
- `src/modules/otp`: OTP generation/verification logic.
- `src/modules/redis`: Redis client abstraction.
- `src/shared`: cross-cutting concerns (guards, filters, decorators, error mappers, logger, interfaces, validators, utils).
- `src/database`: migrations and seeders.
- `src/configs`: env, JWT, database, TypeORM config.

The structure is generally feature-oriented and scalable for medium-size backend services.

## Main Modules and Responsibilities

- `AuthController` + `AuthService` (`src/modules/auth`): register, login, refresh, forgot/reset password, OTP send/verify, and token session revocation.
- `UsersService` (`src/modules/users/users.service.ts`): user persistence-facing business logic, uniqueness checks, role assignment integration, pagination/filtering, status helpers.
- `TypeormUserRepository` (`src/modules/users/infrastructure/repositories/typeorm-user.repository.ts`): TypeORM implementation behind `IUserRepository` port.
- `RolesService` (`src/modules/roles/roles.service.ts`): role CRUD, role key generation, uniqueness checks, permission assignment.
- `PermissionsService` (`src/modules/permissions/permissions.service.ts`): permission creation and retrieval.
- `PermissionsGuard` (`src/shared/guards/permissions.guard.ts`): route permission enforcement from user role permissions.
- `JwtAuthGuard` + `JwtStrategy` + `JwtRefreshStrategy`: access token validation and refresh token extraction/validation.
- `AllExceptionsFilter` + mappers (`src/shared/errors/**`): centralized error shape mapping.

## Main Application Flow

1. App bootstrap (`src/main.ts`) configures global `ValidationPipe`.
2. `AppModule` installs global guards (`JwtAuthGuard`, `PermissionsGuard`), interceptors, and exception filter.
3. Public auth routes (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/send-otp`, `/auth/verify-otp`) are marked with `@Public()`.
4. Protected routes require valid JWT and route-specific permissions (`@Permissions(...)`).
5. User, role, permission entities are persisted via TypeORM in Postgres; OTP and password-reset sessions + refresh-session hashes are stored in Redis.

---

## Architecture Review

### What is good

- Clean modularization by business capability.
- Proper usage of Nest global pipeline components (guards/filter/interceptors).
- Repository port pattern exists for users (`USER_REPOSITORY`) and decouples service from ORM.
- Entity design includes timestamps and soft-delete support.
- Refresh tokens are not stored raw in Redis (hashed with SHA-256).

### What needs improvement

- Domain boundaries are partially mixed:
  - `UsersService` depends on `RolesService` directly for role resolution (`src/modules/users/users.service.ts`).
  - `AuthService` handles many responsibilities (authentication + OTP + reset + session policy orchestration) and is becoming a god-service.
- Production migration discipline is weak:
  - Only two migration files exist while entities/relations are broader.
  - `database.synchronize` is configurable through env and can drift schema across environments.
- Inconsistent validation and response contracts across modules (users uses DTO-based list query validation; roles list uses manual string parsing).

### Coupling / circular dependency

- No direct circular dependency was found in module imports.
- There is still tight service coupling in feature flows (not circular, but high orchestration coupling), especially around `AuthService`.

---

## Logic Review

### Business logic correctness

- Register/login/refresh/OTP/reset flows are coherent overall.
- OTP verification updates user status and verification flags properly.
- Role-permission assignment logic in `RolesService.assignPermissions` includes guardrails for fixed roles.

### Duplicate or unnecessary abstractions

- User repository port abstraction is useful, but only one repository has this pattern while other modules directly use TypeORM repositories. This is not wrong, but architecture style is inconsistent.
- Some controllers return service results directly, others map responses explicitly; contract style is mixed.

### Missing validation and runtime bug risks

- Auth DTOs for email mode (`LoginDto`, `ForgotPasswordDto`, `SendOtpDto`, `VerifyOtpDto`) do not validate email format when `identifierType = EMAIL`.
- `ResetPasswordDto` has weaker password constraints than registration/admin creation.
- Route params (`:id`) generally do not use `ParseUUIDPipe`, relying on DB error mapping.
- Auth semantics bug: auth-path user lookup throws `NotFoundException` (404), but token validation should consistently surface `401 Unauthorized`.

### Async/await and error handling

- Async usage is mostly correct.
- Global exception mapping is solid and returns consistent payload structure.
- Error semantics are not always aligned with security best practices (example above, 404 vs 401 in auth context).

### Query safety/performance

- Query builder usage in users listing is parameterized and safe.
- Role listing lacks a maximum limit guard.
- Search query with multiple `LOWER(...) LIKE` predicates may need indexes/trigram strategy at scale.

---

## API Behavior Review

### Controllers and routes

- Routes are clear and REST-like.
- Permission annotations are used consistently on admin/users/roles/permissions routes.
- Public decorator strategy for auth routes is correct.

### Request/response and DTO validation

- Global validation settings are strong (`whitelist`, `forbidNonWhitelisted`, `transform`).
- DTO coverage is good but inconsistent in strictness across endpoints.

### Status codes and error responses

- Standard statuses are used in most flows.
- Structured error response format is strong.
- One significant inconsistency exists: auth invalid user path can produce 404.

### Authentication/authorization

- JWT + permissions guard approach is correct.
- Permission-based RBAC depends on seed data integrity (currently broken for one key; see High issue #1).
- No rate limiting/throttling on high-risk public endpoints.

---

## Database Layer Review

### Entities/relations

- `User` -> `Role` (`ManyToOne`) is straightforward and appropriate.
- `Role` <-> `Permission` (`ManyToMany` with join table `role_permissions`) is standard RBAC modeling.

### Constraints/indexes

- Unique constraints on `users.email`, `users.phoneNumber`, `roles.name`, `roles.key`, `permissions.name`, `permissions.key`.
- Indexes present on commonly queried fields.

### Migrations and seeders

- Migrations are very limited (`src/database/migrations` has only two files).
- Seeders are idempotent-oriented and restore soft-deleted data, which is good.
- Seeder data mismatch exists (`users.list` permission key missing from seeded permissions while used by route guard).

### Repository/query concerns

- Users repository query logic is generally clean and safe.
- Pagination metadata can become inconsistent if callers bypass DTO validation (service assumes valid positive limits).

---

## Issues Found

## Critical

1. **Potential secret exposure through environment file policy**
   - **File:** `auth/.env`
   - **Problem:** Sensitive credentials exist in local env file (DB and super admin bootstrap values).
   - **Why it is a problem:** If this file is tracked, copied, or leaked, it is an immediate security incident.
   - **Suggested fix:** Ensure `.env` is gitignored, commit only `.env.example`, rotate existing exposed credentials, add CI secret scanning.
   - **Assumption:** This is marked critical if `.env` is tracked/shared; if strictly local and ignored, severity reduces.

2. **Schema management risk in production**
   - **Files:** `src/configs/database.config.ts`, `src/configs/typeorm.config.ts`, `src/database/migrations/*`
   - **Problem:** Runtime allows `synchronize=true`, while migration coverage is sparse.
   - **Why it is a problem:** Environment drift and destructive schema changes become more likely in production lifecycle.
   - **Suggested fix:** Enforce `synchronize=false` for all non-local environments and make migration generation/review mandatory in CI/CD.

## High

1. **Permission seed mismatch blocks users listing authorization**
   - **Files:** `src/modules/users/users.controller.ts`, `src/modules/permissions/enums/index.ts`, `src/database/seeders/permissions.seeder.ts`
   - **Problem:** `PermissionKey.USERS_LIST` is required on `GET /users`, but not seeded in permissions seeder.
   - **Why it is a problem:** No role can hold an unseeded permission, so the endpoint is effectively denied.
   - **Suggested fix:** Add seed entry for `users.list`, then assign to intended roles in `role.seeder.ts`.
   - **Example:**
     ```ts
     {
       name: 'List Users',
       key: PermissionKey.USERS_LIST,
       group: 'users',
       description: 'Can list users',
     }
     ```

2. **Auth error semantics leak wrong status in token validation paths**
   - **Files:** `src/modules/users/users.service.ts`, `src/modules/auth/strategies/jwt.strategy.ts`, `src/modules/auth/auth.service.ts`
   - **Problem:** `findAuthUserById` throws `NotFoundException`, while auth layers expect unauthorized semantics.
   - **Why it is a problem:** Security and API consistency issue (404 account existence leakage where 401 is expected).
   - **Suggested fix:** Return `null` from auth lookup methods and map to `UnauthorizedException` in strategy/service.

3. **Missing endpoint throttling for brute-force protection**
   - **File:** `src/modules/auth/auth.controller.ts`
   - **Problem:** No request-level throttling on login, forgot-password, send-otp.
   - **Why it is a problem:** Increases attack surface for credential stuffing and OTP abuse.
   - **Suggested fix:** Add `@nestjs/throttler` policies (route + IP/identifier based) and align with OTP attempt policy.

4. **Incomplete identifier validation in auth DTOs**
   - **Files:** `src/modules/auth/dtos/login.dto.ts`, `src/modules/auth/dtos/forgot-password.dto.ts`, `src/modules/auth/dtos/send-otp.dto.ts`, `src/modules/auth/dtos/verify-otp.dto.ts`
   - **Problem:** Phone path is validated; email path has no explicit `@IsEmail()` when identifier type is email.
   - **Why it is a problem:** Invalid email payloads are accepted to service layer and rejected later, increasing inconsistency and error ambiguity.
   - **Suggested fix:** Add conditional email validator for non-phone identifiers.

## Medium

1. **Password policy inconsistency**
   - **Files:** `src/modules/auth/dtos/register.dto.ts`, `src/modules/admins/dtos/create-admin.dto.ts`, `src/modules/auth/dtos/reset-password.dto.ts`
   - **Problem:** Reset password only enforces min length; register/admin enforce complexity.
   - **Why it is a problem:** Security policy can be bypassed by resetting password.
   - **Suggested fix:** Reuse one shared password validation rule/decorator across all password inputs.

2. **Roles listing lacks max page size guard**
   - **File:** `src/modules/roles/roles.controller.ts`
   - **Problem:** `limit` is parsed but not bounded.
   - **Why it is a problem:** Very large limits can hurt DB and memory.
   - **Suggested fix:** Move to DTO-based query validation with `@Max(100)` similar to users module.

3. **Missing UUID pipes on route params**
   - **Files:** `src/modules/users/users.controller.ts`, `src/modules/roles/roles.controller.ts`, `src/modules/permissions/permissions.controller.ts`
   - **Problem:** Raw string IDs hit DB without early validation.
   - **Why it is a problem:** Unclear client feedback path and avoidable DB load.
   - **Suggested fix:** Use `@Param('id', new ParseUUIDPipe())`.

4. **Single refresh session per user may be unintended**
   - **File:** `src/modules/auth/auth.service.ts`
   - **Problem:** Refresh session key uses only `userId`.
   - **Why it is a problem:** Logging in on one device revokes another device implicitly.
   - **Suggested fix:** If multi-device support is needed, key sessions by `jti/deviceId` and manage revocation list.
   - **Assumption:** This is medium only if multi-device sessions are a product requirement.

## Low

1. **Naming convention inconsistency in command file**
   - **Files:** `src/modules/auth/commands/verify-otp.ts`, imports from `auth.service.ts` and `auth-request.mapper.ts`
   - **Problem:** Command file does not follow `*.command.ts` convention used elsewhere.
   - **Why it is a problem:** Reduces predictability and code discoverability.
   - **Suggested fix:** Rename to `verify-otp.command.ts` and update imports.

2. **Misleading conflict message in roles uniqueness check**
   - **File:** `src/modules/roles/roles.service.ts`
   - **Problem:** Conflict can be on name or key, but message always says role name exists.
   - **Why it is a problem:** Less actionable API response for clients.
   - **Suggested fix:** Differentiate between duplicate name and duplicate key.

3. **Minor code cleanliness issues (unused imports)**
   - **File:** `src/configs/typeorm.config.ts`
   - **Problem:** Unused imports (`Logger`, top-level `DataSource` import).
   - **Why it is a problem:** Small maintainability/lint noise.
   - **Suggested fix:** Remove unused imports and enforce lint rule strictly in CI.

## Suggestions

1. **Add automated tests immediately**
   - **Evidence:** No `*.spec.ts`; no `test/` folder.
   - Add unit tests for services and guards, and e2e tests for auth + RBAC critical paths.

2. **Refactor `AuthService` into focused application services/use-cases**
   - Split register/login/refresh/otp/reset into dedicated handlers to reduce orchestration bloat and improve testability.

3. **Standardize API response contracts**
   - Some endpoints return raw entities, others mapped types, others envelopes. Define one policy and apply across modules.

4. **Improve operational docs**
   - Replace starter `README.md` with real service setup, env contracts, migration/seed order, and API behavior notes.

---

## Suggested Improvements

Short-term (1-2 sprints):

- Fix permission seed mismatch (`USERS_LIST`) and re-seed safely.
- Normalize auth error semantics to always return unauthorized for auth failures.
- Add route-level throttling for auth-critical public endpoints.
- Unify password policy for reset/register/admin creation.
- Add UUID param pipes and bounded pagination everywhere.

Mid-term:

- Create missing migrations for current schema state.
- Enforce migration-only schema changes in deployment pipelines.
- Break down `AuthService` by use-case to improve maintainability.
- Add comprehensive unit and e2e test suites for critical flows.

Long-term:

- Consider full clean-architecture layering consistency across all modules (currently only users module partially follows port/adapter pattern).
- Consider multi-session refresh strategy if product requires multi-device login.

---

## Refactoring Plan

1. **Security and correctness first**
   - Patch permission seed + role seed mapping.
   - Fix auth-path lookup semantics.
   - Add throttler module and per-route limits.

2. **Validation consistency**
   - Introduce shared validation decorators for password and identifier.
   - Migrate manual query parsing controllers to DTO query objects.

3. **Architecture consistency**
   - Extract use-case services from `AuthService`.
   - Decide and document repository port strategy module-wide.

4. **Production readiness**
   - Backfill migrations.
   - Add tests for authz/authn and seed integrity.
   - Replace generic README with real runbook.

---

## Final Recommendations

- The service has a solid NestJS foundation and a workable RBAC model, but it is not fully production-ready yet due to security, consistency, and migration-discipline gaps.
- Prioritize fixing permission seeding, auth error semantics, throttling, and password policy consistency before scaling feature work.
- Treat migration governance and automated test coverage as mandatory next milestones.
- If any assumptions above are incorrect (especially `.env` tracking policy and expected multi-device refresh behavior), update severity accordingly and document final decisions in the repository.
