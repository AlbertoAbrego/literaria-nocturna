# Project Context

## Project Overview

**Literaria Nocturna** is a REST API for managing a book club. The current MVP implements the **Books** module with full CRUD operations, search/filtering, and pagination. Future modules include Members and Readings.

The backend is a TypeScript/Express application using MongoDB (via Mongoose) as the database. The architecture follows a layered pattern: Routes → Controllers → Services → Models → Database.

## Technology Stack

| Category       | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Runtime        | Node.js 22 (ES2022)                                       |
| Language       | TypeScript 6 (strict mode, NodeNext modules)              |
| Framework      | Express 5                                                 |
| Database       | MongoDB                                                   |
| ODM            | Mongoose 9                                                |
| Testing        | Jest 30, ts-jest, supertest, mongodb-memory-server        |
| Linting        | ESLint 10 + typescript-eslint + eslint-config-prettier    |
| Formatting     | Prettier                                                  |
| Validation     | Manual in controllers + Mongoose schema validation        |
| Error Handling | Custom `AppError` class + global Express error middleware |
| API Docs       | OpenAPI 3.0 (swagger-jsdoc + swagger-ui-express)          |

## Architecture

```
src/
├── app.ts                    # Express app factory
├── server.ts                 # Entry point (starts server)
├── config/
│   ├── database.ts           # MongoDB connection
│   └── swagger.ts            # OpenAPI spec generation (swagger-jsdoc)
├── constants/
│   └── genres.ts             # Single source of truth for Genre enum + GENRES array
├── utils/
│   ├── validation.ts         # Shared validators (ObjectId, Genre, Page, Limit)
│   └── dto-validation.ts     # DTO-level validation (CreateBookDto, UpdateBookDto, BookQueryDto)
├── controllers/              # HTTP layer (request/response handling)
│   ├── health.controller.ts
│   └── book.controller.ts
├── services/                 # Business logic layer
│   └── book.service.ts
├── models/                   # Mongoose schemas & types
│   └── book.model.ts
├── dto/                      # Data Transfer Objects (plain TS types)
│   └── book/
│       ├── create-book.dto.ts
│       ├── update-book.dto.ts
│       └── book-query.dto.ts
├── routes/                   # Route definitions
│   ├── health.routes.ts
│   ├── book.routes.ts
│   └── swagger.routes.ts     # Serves Swagger UI + raw swagger.json
├── middleware/
│   └── error.middleware.ts   # Global error handler
├── errors/
│   └── AppError.ts           # Custom error class + ErrorCodes
└── test/                     # Integration test infrastructure
    ├── globalSetup.ts
    ├── globalTeardown.ts
    ├── setup.ts
    ├── helpers/
    │   ├── database.ts
    │   ├── request.ts
    │   ├── factories.ts
    │   └── assertions.ts
    └── integration/
```

**Request Flow:**

```
HTTP Request
    → Express Router (routes/*.ts)
    → Controller (controllers/*.ts)
        → Validates params/query/body
        → Calls Service
    → Service (services/*.ts)
        → Business logic
        → Calls Model
    → Model (models/*.ts)
        → Mongoose operations
    → MongoDB
    → Response flows back through layers
    → Global Error Middleware (if error thrown)
```

## Layer Responsibilities

### Routes (`src/routes/`)

- Define endpoint paths and HTTP methods
- Wire controllers to routes
- No business logic
- `swagger.routes.ts` serves the Swagger UI at `/api/docs` and the raw OpenAPI JSON at `/api/docs/swagger.json`

### Controllers (`src/controllers/`)

- Handle HTTP concerns: request parsing, response formatting, status codes
- Validate route parameters (ObjectId), query parameters (pagination, filters), and request body presence
- Delegate to services
- Catch service errors and pass to `next(error)`
- **Never** contain business logic

### Services (`src/services/`)

- Pure business logic functions (no Express types)
- Throw `AppError` for business rule violations (409 Conflict, etc.)
- Perform data access via Mongoose models
- Return domain objects or pagination results

### Models (`src/models/`)

- Mongoose schema definitions
- Export `InferSchemaType` for type-safe documents
- Define enums (e.g., `Genre`) used across layers
- No business logic

### DTOs (`src/dto/`)

- Plain TypeScript `type` aliases (not classes, no decorators)
- Three categories per entity:
  - `CreateXxxDto` — required fields for creation
  - `UpdateXxxDto` — all fields optional for partial updates
  - `XxxQueryDto` — query parameters (filters, pagination)
- No validation logic; validation happens in controllers (query) and Mongoose (body via schema)

### Middleware (`src/middleware/`)

- Global error handler only (`error.middleware.ts`)
- Maps error types to HTTP responses
- Logs only 5xx errors (not 4xx)

## DTO Conventions

| DTO Type | Convention                                                        | Example                                                      |
| -------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Create   | All fields required, matches model required fields                | `CreateBookDto`                                              |
| Update   | All fields optional (`?`), same types as create                   | `UpdateBookDto`                                              |
| Query    | Optional filters + `page`/`limit`; exports constants for defaults | `BookQueryDto`, `DEFAULT_PAGE`, `DEFAULT_LIMIT`, `MAX_LIMIT` |

- DTOs import `Genre` type from `constants/genres.ts` (single source of truth)
- No class-validator, no Zod, no runtime validation libraries
- Runtime DTO validation centralized in `src/utils/dto-validation.ts` (consumed by controllers)

## Controller Conventions

- **Named exports** for each handler function (e.g., `createBook`, `getAllBooks`)
- **Function-based** (no classes)
- Explicit generic types on `Request<Params, ResBody, ReqBody, ReqQuery>`
- Parameter validation:
  - `mongoose.Types.ObjectId.isValid(id)` for `:id` params → 400 if invalid
  - DTO validation via `validateCreateBookDto()`, `validateUpdateBookDto()`, `validateBookQueryDto()` from `dto-validation.ts`
  - Returns 400 with `{ message: "Validation failed", code: "VALIDATION_ERROR", details: { field: "error" } }` on failure
- Call service in `try/catch`, forward errors with `next(error)`
- Response status codes:
  - `201` for creation
  - `200` for successful reads/updates
  - `204` for successful deletion (no body)
- Never catch and handle `AppError` locally; let global middleware handle it

## Service Conventions

- **Named exports** for each function (e.g., `createBook`, `getAllBooks`)
- **Function-based** (no classes, no dependency injection)
- Input: DTO types or primitive values (IDs, filter objects)
- Output: Mongoose documents, arrays, or pagination result objects
- Business rules enforced by throwing `AppError`:
  - Duplicate book (title + author) → `AppError("Book already exists.", 409)`
- Use `findByIdAndUpdate` with `{ new: true, runValidators: true }` for updates
- Use `Promise.all` for parallel queries (e.g., data + count)
- Pagination calculation in service: `skip = (page - 1) * limit`
- Default pagination values imported from DTO constants
- Sort by `title: 1` (ascending) for list queries

## Error Handling Conventions

### `AppError` (`src/errors/AppError.ts`)

- Extends `Error`
- Constructor: `new AppError(message: string, statusCode: number, code?: ErrorCode, details?: Record<string, string>)`
- Public `statusCode` and `code` properties, optional `details`
- `ErrorCodes` constant holds the canonical code strings; `ErrorCode` type is a union of its literal values
- `code` is optional: when omitted it is derived from `statusCode` (404 → `NOT_FOUND`, 409 → `CONFLICT`, 5xx → `INTERNAL_ERROR`, else `VALIDATION_ERROR`)
- Used for all expected business errors (400, 404, 409)

### Standardized Error Response Format

Every error response follows the shape:

```json
{
  "message": "string",
  "code": "string",
  "details": {}
}
```

- `message` — human-readable message
- `code` — machine-readable error identifier (`VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`)
- `details` — optional, only present when field-level validation messages exist

### Global Error Middleware (`src/middleware/error.middleware.ts`)

- Single `ErrorRequestHandler` registered last in `app.ts`
- Checks `res.headersSent` before responding
- Handles error types:
  - `mongoose.Error.ValidationError` → 400, `{ message: "Validation failed", code: "VALIDATION_ERROR", details: { field: message } }`
  - `AppError` → its `statusCode`/`code`, with `details` only when attached; 5xx messages are masked as `"Internal Server Error"`
  - Unknown errors → 500, `{ message: "Internal Server Error", code: "INTERNAL_ERROR" }`
- **Logging**: Only logs 5xx errors (`console.error`). Client errors (4xx) are silent.
- No stack traces or internal details are exposed to the client.

## Validation Conventions

| Layer               | What is Validated                                  | How                                                          |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Controller (params) | ObjectId format                                    | `mongoose.Types.ObjectId.isValid()`                          |
| Controller (body)   | Required fields, genre, empty body                 | `validateCreateBookDto()`, `validateUpdateBookDto()`          |
| Controller (query)  | Genre enum, page/limit bounds                      | `validateBookQueryDto()`                                     |
| Mongoose (schema)   | Required fields, types, enum values (defense in depth) | Schema definition + `runValidators: true`                |
| Service             | Business uniqueness (title+author)                 | Manual query + `AppError(409)`                               |

- Validation functions live in `src/utils/dto-validation.ts` (DTO-level) and `src/utils/validation.ts` (primitives)
- Both controller-level and Mongoose-level validation produce the same error format: `{ message: "Validation failed", code: "VALIDATION_ERROR", details: { field: "error message" } }`

## Query, Filtering and Pagination Conventions

### Query Parameters (`BookQueryDto`)

- `genre?: Genre` — exact match
- `author?: string` — case-insensitive partial match (`$regex`, `$options: "i"`)
- `title?: string` — case-insensitive partial match (`$regex`, `$options: "i"`)
- `page?: number` — default `1`, min `1`
- `limit?: number` — default `10`, min `1`, max `100`

### Filter Combination

- All filters combined with AND (`{ genre, author: regex, title: regex }`)
- Multiple filters can be used simultaneously

### Pagination Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

- `totalPages = Math.ceil(total / limit)`
- Empty page (beyond `totalPages`) returns `data: []` with correct metadata

### Defaults

- `DEFAULT_PAGE = 1`
- `DEFAULT_LIMIT = 10`
- `MAX_LIMIT = 100`

## Testing Architecture

### Strategy

**Integration tests only** — the real Express app is exercised against a real in-memory MongoDB.

| Tool                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `supertest`             | Sends HTTP requests to the app (no port opened) |
| `mongodb-memory-server` | Spawns isolated `mongod` per test run           |
| Jest                    | Test runner, assertions, lifecycle hooks        |

**Trade-off**: Slower than unit tests, but verifies the full Route → Controller → Service → Model contract.

### Test Infrastructure

```
src/test/
├── globalSetup.ts       # Starts MongoMemoryServer, writes URI to temp file
├── globalTeardown.ts    # Stops MongoMemoryServer
├── setup.ts             # Per-worker: connects Mongoose, clears collection beforeEach
├── helpers/
│   ├── database.ts      # clearDatabase(), seedBooks()
│   ├── request.ts       # testRequest (supertest client)
│   ├── factories.ts     # createBookDto(), createBookModel()
│   └── assertions.ts    # expectValidationError, expectConflictError, expectNotFoundError
└── integration/         # One file per endpoint group
```

### Isolation Model

- `globalSetup` creates **one** `MongoMemoryServer` for the entire test run
- URI shared via temp file (workers don't share globals)
- Each Jest worker connects to a **unique database** (`test-${process.pid}`)
- `beforeEach` clears `BookModel` collection → tests never see each other's data
- Parallel execution safe (`--maxWorkers=2` in CI)

## Testing Conventions

### File Organization

- One test file per endpoint group: `<entity>.<action>.integration.test.ts`
- Examples: `books.create.integration.test.ts`, `books.list.integration.test.ts`

### Test Naming

- Each `it()` references a story test case ID: `TC-H2-001`, `TC-H8-003`, etc.
- Descriptive names: `"TC-H2-001: create a valid book and respond with status 201 Created"`

### Helper Usage

| Helper                                     | Usage                                            |
| ------------------------------------------ | ------------------------------------------------ |
| `testRequest`                              | `await testRequest.post("/api/books").send(dto)` |
| `seedBooks([...])`                         | Insert test data, returns documents with `_id`   |
| `createBookDto({ title: "X" })`            | Valid create payload with overrides              |
| `createBookModel({ genre: Genre.Horror })` | Full document with timestamps                    |
| `expectValidationError(res)`               | Asserts 400 + "Validation failed"                |
| `expectConflictError(res)`                 | Asserts 409 + "Book already exists."             |
| `expectNotFoundError(res)`                 | Asserts 404 + "Book not found"                   |

### Test Patterns

- **Arrange**: `seedBooks` or inline `createBookDto`
- **Act**: `testRequest.<method>(url).send(body).query(params)`
- **Assert**: `expect(res.status).toBe(...)` + `expect(res.body).toMatchObject(...)`
- **Error simulation**: `jest.spyOn(Model, "method").mockRejectedValueOnce(...)`

### Commands

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # coverage report (text, lcov, html)
npm run test:ci       # CI mode: --ci --coverage --maxWorkers=2
```

### CI/CD

**Backend** (`.github/workflows/backend-ci.yml`):

- Triggers: push, pull_request to `main`, workflow_dispatch
- Path filters: `backend/**`, workflow file
- Pipeline: checkout → setup-node (Node.js 22, npm cache) → install → lint → build → `test:ci`
- `test:ci` runs `jest --ci --coverage --maxWorkers=2`
- Coverage thresholds: statements ≥80%, branches ≥75%, functions ≥75%, lines ≥80%
- `mongodb-memory-server` requires no external services; first run downloads the `mongod` binary

**Frontend** (`.github/workflows/frontend-ci.yml`):

- Triggers: push, pull_request to `main`, workflow_dispatch
- Path filters: `frontend/**`, workflow file
- Pipeline: checkout → setup-node (Node.js 22, npm cache) → install → lint → `contract:check` → build → `test:coverage`
- `contract:check` extracts OpenAPI types/endpoints and verifies MSW handlers match
- `test:coverage` runs `vitest run --coverage` with threshold enforcement
- Coverage thresholds: statements ≥90%, branches ≥85%, functions ≥90%, lines ≥90%
- Uses MSW for API mocking; no external services required

Both pipelines use consistent Node.js 22, npm caching, and fail PRs on test/lint/build errors.

## Git Workflow

- **Story-driven development**: Each feature tracked in `docs/stories/story-XX-*.md`
- **Roadmap** (`docs/roadmap.md`) tracks completed/current/upcoming stories
- **No explicit branching strategy** documented (assume trunk-based or feature branches)
- **No commit message convention** documented
- **Pre-commit**: ESLint + Prettier (via config, not husky)

## Documentation Workflow

- **Story documents** (`docs/stories/`) serve as requirements + acceptance criteria
- **Planning documents** (`docs/planning/`) for complex stories
- **Architecture decisions** captured in this file (`project-context.md`)
- **API documentation**: OpenAPI 3.0 via Swagger (see below)
- **Test documentation**: `docs/testing.md` (this file's companion) + `docs/tests.md` (test case index)

## API Documentation (OpenAPI / Swagger)

- **Spec generation**: `src/config/swagger.ts` builds the OpenAPI document with `swagger-jsdoc`, reading `@openapi` JSDoc annotations from `src/routes/*.ts` and `src/controllers/*.ts`.
- **UI**: Swagger UI is served at `GET /api/docs` (mounted via `src/routes/swagger.routes.ts`).
- **Raw spec**: `GET /api/docs/swagger.json` returns the machine-readable OpenAPI document.
- **Shared components**: `components.schemas` defines `Genre`, `Book`, `CreateBookDto`, `UpdateBookDto`, `BookQueryDto`, `PaginatedResponse`, and `ErrorResponse`; `components.responses` defines reusable `ValidationError`, `NotFoundError`, `ConflictError`, and `InternalError` responses matching the standardized error format.
- Endpoint annotations are the source of truth for paths, params, request bodies, and responses; keep them in sync when API contracts change.

## Current Project State

### Implemented (Stories 1–26)

- **Story 1** — Project setup (TS, Express, ESLint, Prettier, Jest, MongoDB)
- **Story 2** — Book creation (`POST /api/books`, 201, duplicate check 409, validation 400)
- **Story 3** — Error handling (`AppError` class, global error middleware)
- **Story 4** — Book listing (`GET /api/books`, filters: genre/author/title, pagination)
- **Story 5** — Book by ID (`GET /api/books/:id`, 404/400 handling)
- **Story 5.5** — Testing foundation (integration test infrastructure, helpers, factories)
- **Story 6** — Book update (`PATCH /api/books/:id`, partial update, 400/409/404)
- **Story 7** — Book deletion (`DELETE /api/books/:id`, 204, 404)
- **Story 8** — Search and filter (case-insensitive partial matching, genre exact match)
- **Story 9** — Pagination (configurable page/limit, metadata: total, totalPages)
- **Story 10** — API standardization and documentation:
  - Standardized error response format (`message`, `code`, optional `details`)
  - Field-level Mongoose validation details for 400 responses
  - Logging cleanup (only 5xx logged)
  - OpenAPI/Swagger documentation (`/api/docs`, `/api/docs/swagger.json`)
- **Story 11** — CI/CD with GitHub Actions (backend pipeline)
- **Story 12** — Frontend foundation (React, TypeScript, Vite, routing, TanStack Query)
- **Story 12.5** — Frontend testing foundation (Vitest, React Testing Library, MSW)
- **Story 13** — Books list page (BookTable, SearchBar, PaginationControls)
- **Story 14** — Book details page (BookCard, not-found state, navigation)
- **Story 15** — Create book form (BookForm, validation, optimistic UI)
- **Story 16** — Update book form (edit mode, partial update, cache sync)
- **Story 17** — Delete book (confirmation modal, cache-syncing mutation)
- **Story 18** — Search and filter (URL-synchronized filter state, useBookFilters)
- **Story 19** — Pagination (PaginationControls, page size, URL sync)
- **Story 20** — Local dev environment standardization
- **Story 21** — CI/CD standardization and frontend test integration:
  - Frontend CI runs complete Vitest suite (`test:run`) on every PR
  - Backend CI uses `test:ci` script (`jest --ci --coverage --maxWorkers=2`)
  - Both pipelines use Node.js 22 with npm caching
  - Workflow dispatch enabled for manual triggering
- **Story 22** — MSW & API contract synchronization:
  - Contract-driven MSW handlers (`src/test/contract/`)
  - Automated extraction from OpenAPI spec (`contract:extract`)
  - Contract verification (`contract:verify`, `contract:check`)
  - 32 contract verification tests (`msw-contract.test.ts`)
- **Story 23** — Pagination, search & data integrity fixes
- **Story 24** — API contract, validation & Swagger hardening
  - Runtime DTO validation for CreateBookDto, UpdateBookDto, BookQueryDto
  - Consistent error format across all validation layers
- **Story 25** — Build, types & repository hygiene
- **Story 26** — Documentation & project context consolidation

### Current (Story 27)

- Security, health coverage & final hardening:
  - Security middleware: Helmet, CORS allowlist, rate limiting, body size limits
  - Health endpoints: `/api/health` (liveness), `/api/health/ready` (readiness with DB check)
  - Version sourced from `package.json` (no hardcoded version)
  - Coverage thresholds enforced: backend ≥80/75/75/80, frontend ≥90/85/90/90
  - Example tests excluded from suite
  - Frontend CI runs `test:coverage` with threshold enforcement
  - Test layer strategy documented (4 layers: backend integration, frontend unit/component, frontend integration+MSW, Playwright E2E)

### Planned

- Playwright E2E implementation
- Members module
- Readings module

## AI Collaboration Rules

1. **Do not implement immediately** — propose architecture first
2. **Explain trade-offs** when multiple alternatives exist
3. **Point out bad practices** — assume the goal is learning, not just finishing
4. **Use the codebase as source of truth** — stories may be outdated
5. **Follow existing conventions** — functions over classes, named exports, DTO patterns
6. **Keep it simple** — avoid over-engineering, prefer minimal solutions
7. **Update documentation** when conventions change (this file, `testing.md`, `tests.md`)
8. **Run lint/typecheck** after changes: `npm run lint`, `npx tsc --noEmit`
9. **Tests must pass** — `npm run test:ci` before considering work done
