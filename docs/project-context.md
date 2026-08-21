# Project Context

## Project Overview

**Literaria Nocturna** is a REST API for managing a book club. The current MVP implements the **Books** module with full CRUD operations, search/filtering, and pagination. Future modules include Members and Readings.

The backend is a TypeScript/Express application using MongoDB (via Mongoose) as the database. The architecture follows a layered pattern: Routes → Controllers → Services → Models → Database.

## Technology Stack

| Category       | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Runtime        | Node.js (ES2022)                                          |
| Language       | TypeScript (strict mode, NodeNext modules)                |
| Framework      | Express 5                                                 |
| Database       | MongoDB                                                   |
| ODM            | Mongoose 8                                                |
| Testing        | Jest 29, ts-jest, supertest, mongodb-memory-server        |
| Linting        | ESLint 9 + typescript-eslint + eslint-config-prettier     |
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

- DTOs import enums from models (`Genre` from `book.model.ts`)
- No class-validator, no Zod, no runtime validation libraries
- Request body validation delegated to Mongoose (`runValidators: true` on updates)

## Controller Conventions

- **Named exports** for each handler function (e.g., `createBook`, `getAllBooks`)
- **Function-based** (no classes)
- Explicit generic types on `Request<Params, ResBody, ReqBody, ReqQuery>`
- Parameter validation:
  - `mongoose.Types.ObjectId.isValid(id)` for `:id` params → 400 if invalid
  - Enum validation for query params (e.g., `genre`) → 400 if invalid
  - Pagination bounds checking (`page >= 1`, `1 <= limit <= MAX_LIMIT`) → 400 if invalid
- Empty body check for `POST`/`PATCH` → 400 if missing/empty
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

| Layer               | What is Validated                      | How                                       |
| ------------------- | -------------------------------------- | ----------------------------------------- |
| Controller (params) | ObjectId format                        | `mongoose.Types.ObjectId.isValid()`       |
| Controller (query)  | Enum values (genre), pagination bounds | Manual checks                             |
| Controller (body)   | Presence (non-empty)                   | `Object.keys(req.body).length === 0`      |
| Mongoose (schema)   | Required fields, types, enum values    | Schema definition + `runValidators: true` |
| Service             | Business uniqueness (title+author)     | Manual query + `AppError(409)`            |

- No separate validation middleware or libraries
- Mongoose validation errors return `"Validation failed"` with field-level `details` (e.g. `{ title: "Path `title` is required." }`)

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
- `mongodb-memory-server` requires no external services; first run downloads the `mongod` binary

**Frontend** (`.github/workflows/frontend-ci.yml`):

- Triggers: push, pull_request to `main`, workflow_dispatch
- Path filters: `frontend/**`, workflow file
- Pipeline: checkout → setup-node (Node.js 22, npm cache) → install → lint → build → `test:run`
- `test:run` runs `vitest run` (non-watch mode)
- Uses MSW for API mocking; no external services required

Both pipelines use consistent Node.js 22, npm caching, and fail PRs on test/lint/build errors. No coverage thresholds configured yet.

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

### Implemented (Stories 1–21)

- Project setup (TS, Express, ESLint, Prettier, Jest, MongoDB)
- Health endpoint (`GET /api/health`, `GET /`)
- Book CRUD:
  - `POST /api/books` — create (201), duplicate check (409), validation (400)
  - `GET /api/books` — list with filters (genre, author, title) + pagination
  - `GET /api/books/:id` — get by ID (404 if not found, 400 if invalid ID)
  - `PATCH /api/books/:id` — partial update (400 empty body, 409 duplicate, 404 not found)
  - `DELETE /api/books/:id` — delete (204, 404 not found)
- Global error handling with `AppError` and middleware
- Integration test suite with full isolation
- Story 10 — API standardization and documentation:
  - Standardized error response format (`message`, `code`, optional `details`) via `ErrorCodes`/`AppError`
  - Field-level Mongoose validation details for 400 responses
  - Logging cleanup (only 5xx logged)
  - OpenAPI/Swagger documentation (`GET /api/docs`, `/api/docs/swagger.json`)
  - Tests updated for `code` field + Swagger integration tests
- Story 21 — CI/CD standardization and frontend test integration:
  - Frontend CI runs complete Vitest suite (`test:run`) on every PR
  - Backend CI uses `test:ci` script (`jest --ci --coverage --maxWorkers=2`)
  - Both pipelines use Node.js 22 with npm caching
  - Workflow dispatch enabled for manual triggering

### Planned (Story 22+)

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
