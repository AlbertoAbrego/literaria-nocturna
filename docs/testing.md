# Testing

This document covers both backend and frontend testing strategies. See [tests.md](tests.md) for the test case index and [frontend-testing.md](frontend-testing.md) for detailed frontend testing conventions.

---

# Backend Testing

## Strategy

**Integration tests only** — the real Express app is exercised against a real in-memory MongoDB.

| Tool | Purpose |
|------|---------|
| `supertest` | Sends HTTP requests to the app (no port opened) |
| `mongodb-memory-server` | Spawns isolated `mongod` per test run |
| Jest | Test runner, assertions, lifecycle hooks |

**Trade-off accepted**: Slower than unit tests, but they verify the full Route → Controller → Service → Model contract.

There are no unit tests yet. If the service/controller grows, pure logic (domain validations, calculations) could be extracted into functions and covered with unit tests.

---

## How to Run

```bash
cd backend
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage report (text, lcov, html)
npm run test:ci       # for CI: ci mode + coverage + maxWorkers=2
```

The coverage report is generated in `backend/coverage/` (git-ignored).

---

## Structure

```
src/test/
├── globalSetup.ts              # starts mongod, persists the URI, stores the instance
├── globalTeardown.ts           # stops mongod
├── setup.ts                    # per-test-file global hooks
├── helpers/
│   ├── database.ts             # clearDatabase, seedBooks
│   ├── request.ts              # testRequest (supertest over the app)
│   ├── factories.ts            # createBookDto, createBookModel
│   └── assertions.ts           # API error assertions
└── integration/                # per-endpoint integration tests
    ├── health.integration.test.ts
    ├── swagger.integration.test.ts            # Swagger UI + spec (TC-H10)
    ├── books.create.integration.test.ts
    ├── books.list.integration.test.ts    # list + filters (TC-H4, TC-H8)
    ├── books.getById.integration.test.ts
    ├── books.update.integration.test.ts
    └── books.delete.integration.test.ts
```

---

## How It Works

1. **globalSetup**: Creates the `MongoMemoryServer`, writes the URI to a temp file (`os.tmpdir()`) and stores the instance in `globalThis`. `globalSetup`/`globalTeardown` share the process, but tests run in separate workers: that is why the URI travels through a file and not a global variable.

2. **setup.ts** (runs in each worker): Reads the URI from the file, connects Mongoose to a **worker-unique database** (`test-${process.pid}`) and clears `BookModel` before each test.

3. **Isolation**: `beforeEach` clears the collection. Each worker uses its own database so parallel test files do not wipe each other's data.

---

## Helpers

| Helper | Usage |
|--------|-------|
| `testRequest` | `testRequest.get("/api/books")` — Supertest client with the configured app |
| `clearDatabase()` | Empties `BookModel` |
| `seedBooks([...])` | Inserts books and returns the created documents (with `_id`) |
| `createBookDto(overrides?)` | Valid payload for `POST /api/books` with real defaults |
| `createBookModel(overrides?)` | Complete `Book` document (with `createdAt`/`updatedAt`) |
| `expectValidationError(res)` | Asserts 400 + `{ message: "Validation failed", code: "VALIDATION_ERROR" }` |
| `expectConflictError(res)` | Asserts 409 + `{ message: "Book already exists.", code: "CONFLICT" }` |
| `expectNotFoundError(res)` | Asserts 404 + `{ message: "Book not found", code: "NOT_FOUND" }` |

The error assertion helpers assert both the HTTP status and the standardized error body using `toMatchObject`, so they are safe to use across the whole API as long as the standardized `code` format is respected.

---

## Naming Conventions

- **Integration files**: `<entity>.<action>.integration.test.ts` (e.g., `books.create.integration.test.ts`).
- **Test case references**: Each `it()` references its story case with a `TC-*` ID (e.g., `TC-H2-001`).
- **Grouping**: One file per case group (create, list, getById, update, delete), not one per test.

---

## Test Patterns

### Basic CRUD Test
```typescript
it("TC-H2-001: create a valid book and respond with status 201 Created", async () => {
  const res = await testRequest.post("/api/books").send(createBookDto());

  expect(res.status).toBe(201);
  expect(res.body).toMatchObject(createBookDto());
  expect(res.body._id).toBeDefined();
});
```

### Filter Test
```typescript
it("TC-H8-002: filter by author with partial and case-insensitive match", async () => {
  await seedBooks([
    createBookModel({ title: "Dune", author: "Frank Herbert" }),
    createBookModel({ title: "El Principito", author: "Antoine de Saint-Exupéry" }),
  ]);

  const res = await testRequest.get("/api/books").query({ author: "herbert" });

  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].author).toBe("Frank Herbert");
});
```

### Pagination Test
```typescript
it("TC-H9-008: pagination metadata is returned correctly", async () => {
  await seedBooks([...11 books...]);

  const res = await testRequest.get("/api/books").query({ page: 2, limit: 4 });

  expect(res.body.pagination).toEqual({
    page: 2,
    limit: 4,
    total: 11,
    totalPages: 3,
  });
});
```

### Error Simulation Test
```typescript
it("TC-H7-005: return 500 Internal Server Error on a database failure", async () => {
  const [book] = await seedBooks([createBookModel()]);
  const spy = jest
    .spyOn(BookModel, "findByIdAndDelete")
    .mockRejectedValueOnce(new Error("Database failure"));

  const res = await testRequest.delete(`/api/books/${book._id}`);

  expect(res.status).toBe(500);
  expect(res.body).toMatchObject({
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
  });

  spy.mockRestore();
});
```

### Custom Code Assertion
When a test needs a specific non-standard message (e.g. pagination validation), assert both fields with `toMatchObject` instead of inlining a new helper:
```typescript
expect(res.body).toMatchObject({
  message: "Invalid page value",
  code: "VALIDATION_ERROR",
});
```

### Swagger Test
```typescript
it("TC-H10-005: Swagger documentation loads successfully", async () => {
  const res = await testRequest.get("/api/docs").redirects(1);
  // `.redirects(1)` follows the 301 from `/docs` to `/docs/` emitted by swagger-ui-express.

  expect(res.status).toBe(200);
  expect(res.text).toContain("swagger-ui");
});

it("TC-H10-006: All book endpoints appear in Swagger spec", async () => {
  const res = await testRequest.get("/api/docs/swagger.json");

  expect(res.status).toBe(200);
  expect(res.body.paths["/books"]).toBeDefined();
  expect(res.body.paths["/books/{id}"]).toBeDefined();
});
```

---

## CI/CD

The `test:ci` script (`jest --ci --coverage --maxWorkers=2`) is the CI entry point:

- `--ci` fails if there are modified snapshots that need updating.
- `mongodb-memory-server` requires no external services, so the pipeline only needs to install dependencies and run `npm run test:ci`.
- Coverage thresholds are configured in `jest.config.ts` (global: statements ≥80%, branches ≥75%, functions ≥75%, lines ≥80%). CI fails if thresholds are not met.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ts-node` is required for TypeScript config files | `jest.config.ts` needs `ts-node` installed (devDependency). Without it, Jest cannot read the config. |
| `Cannot find name 'describe'`/`'jest'` | `@types/jest` globals are not auto-included with TypeScript 6; `tsconfig.json` must declare `"types": ["node", "jest"]`. |
| `TS151002` warning from ts-jest | Shows up when `tsconfig.json` uses `module: NodeNext` without `isolatedModules: true`. Add `isolatedModules: true`. |
| Flaky tests in parallel | Each worker must use its own database (`dbName` per pid). Two workers sharing the same DB wipe each other's data. |
| Slow first run | `mongodb-memory-server` downloads the `mongod` binary on the first run. Run `npm test` once before CI to cache it. |
| Console noise | The error middleware logs 5xx errors with `console.error`. Client errors (4xx) are not logged. |

---

## Conventions

### Test Organization
- **One file per endpoint group** — not per individual test case
- **Descriptive test names** — include the TC-ID and expected behavior
- **Use helpers** — never inline test data creation or raw assertions

### Assertions
- Use `toMatchObject` for partial response matching
- Use helper assertions (`expectValidationError`, etc.) for standard error responses
- Assert the `code` field on every error response (the standardized error format includes `message` + `code` + optional `details`)
- Verify both status code and response body

### Data Setup
- Use `seedBooks` for multiple records
- Use `createBookDto`/`createBookModel` factories with overrides
- Leverage `beforeEach` clearing for isolation

### Error Testing
- Test both client errors (400, 404, 409) and server errors (500)
- Mock database failures with `jest.spyOn(...).mockRejectedValueOnce(...)`
- Always `mockRestore()` after mocking

### Async Patterns
- All tests are `async`/`await`
- `jest.setTimeout(20000)` in `setup.ts` for slow operations
- `Promise.all` in service tests where applicable

---

# Frontend Testing

## Strategy

Component, hook, and integration tests using Vitest, React Testing Library, and MSW (Mock Service Worker). Contract-driven MSW handlers synchronized with the backend OpenAPI spec.

| Tool | Purpose |
|------|---------|
| Vitest | Test runner and coverage (v8 provider) |
| React Testing Library | Component rendering, user interactions, accessibility |
| MSW | API mocking at the network layer |

**Trade-off accepted**: MSW handlers must stay synchronized with the backend OpenAPI contract. This is enforced by `contract:check` in CI.

---

## How to Run

```bash
cd frontend
npm run test            # watch mode
npm run test:run        # single run
npm run test:ui         # Vitest UI dashboard
npm run test:coverage   # coverage report
npm run contract:check  # verify MSW ↔ OpenAPI contract
npm run contract:extract  # regenerate contract types/endpoints
npm run contract:verify   # compare handlers against OpenAPI
```

---

## Test Types

| Type | Pattern | What It Tests |
|------|---------|---------------|
| Component | `*.test.tsx` | Rendering, user interactions, conditional UI, accessibility |
| Hook | `*.test.ts` | Queries, mutations, loading/error states, derived state |
| Integration | `*.test.tsx` | Full page rendering, routing, API interactions, cache invalidation |
| Contract | `msw-contract.test.ts` | MSW handlers match OpenAPI spec (32 tests) |

---

## Test Structure

```
frontend/src/test/
├── setup.ts                  # jest-dom, MSW lifecycle, RTL cleanup
├── server.ts                 # MSW setupServer instance
├── handlers.ts               # Handler composition root
├── handlers/
│   ├── books.ts              # Feature handlers + in-memory seed DB
│   └── errors.ts             # Standardized error response helpers
├── contract/
│   ├── types.ts              # Contract types (re-exports + ApiErrorResponse)
│   ├── validators.ts         # Backend-mirroring pure validation functions
│   ├── error-messages.ts     # Exact error message constants from backend
│   ├── assertions.ts         # Contract test helpers
│   ├── openapi-types.ts      # Auto-generated from OpenAPI spec
│   ├── endpoints.ts          # Auto-generated endpoint definitions
│   └── msw-contract.test.ts  # 32 contract verification tests
├── utils/
│   ├── render.tsx            # renderWithProviders + re-exported RTL utilities
│   ├── query-client.ts       # createTestQueryClient
│   └── factories/
│       └── book.factory.ts   # Book contract types + test data factories
└── examples/                 # Copy-pasteable reference tests
```

---

## Test Utilities

### renderWithProviders

Wraps UI in a `QueryClientProvider`, returns the `QueryClient` instance used, and supports an optional `route` for router context:

```tsx
const view = renderWithProviders(<BookList />);
const view = renderWithProviders(<BookList />, { route: "/books" });

view.queryClient.setQueryData(["books"], myData);
```

### createTestQueryClient

Creates a fresh `QueryClient` per test with `retry: false` (failures surface immediately) and `gcTime: 0` (no cache survives unmount).

### createQueryClientWrapper

For `renderHook`, compose providers with `createQueryClientWrapper`:

```ts
renderHook(() => useBooks(), {
  wrapper: createQueryClientWrapper(createTestQueryClient()),
});
```

### Test Data Factories

`src/test/utils/factories/` is the single source of truth for API contract types and mock data:

```ts
createBook({ genre: "Horror" });       // single book, unique id and title
createBookList(5);                     // array of 5 distinct books
createBookFormData({ title: "..." });  // create-request body
```

---

## MSW Contract-Driven Strategy

### Contract Layer

| File | Purpose |
|------|---------|
| `contract/validators.ts` | Pure validation functions mirroring backend controllers |
| `contract/error-messages.ts` | Exact error message strings from backend |
| `contract/openapi-types.ts` | Auto-generated TypeScript interfaces from OpenAPI spec |
| `contract/endpoints.ts` | Auto-generated endpoint definitions |
| `contract/msw-contract.test.ts` | 32 test cases validating every endpoint scenario |

### Contract Verification Commands

```bash
npm run contract:check    # extract + verify (run in CI)
npm run contract:extract  # regenerate types/endpoints from OpenAPI spec
npm run contract:verify   # compare handlers against OpenAPI spec
```

The verify script checks that every OpenAPI endpoint has a matching MSW handler. The comprehensive test suite validates response shapes, status codes, error messages, and pagination behavior at runtime.

---

## Isolation Rules

- **Fresh `QueryClient` per test** — `retry: false`, `gcTime: 0` (no cache survives unmount)
- **Fresh memory router per test** — Navigation state doesn't leak between tests
- **Fixed seed data** — Mock database reseeded after every test
- **Unhandled requests fail tests** — `onUnhandledRequest: "error"` catches missing handlers

---

## Conventions

### Test Organization
- **Component tests**: `*.test.tsx` — rendering, interactions, accessibility
- **Hook tests**: `*.test.ts` — queries, mutations, loading/error states
- **Integration tests**: `*.test.tsx` — full page with router, MSW, cache invalidation
- **Contract tests**: `msw-contract.test.ts` — MSW ↔ OpenAPI verification

### Assertions
- Use `getByRole`, `getByText`, `getByLabelText` for accessible queries
- Assert loading/skeleton states with `aria-busy` or `role="status"`
- Assert error states with error message text
- Assert accessibility with `toHaveAttribute('aria-*')` and `toHaveFocus()`

### Data Setup
- Use `createBook`, `createBookList`, `createBookFormData` factories
- Use `server.use(...)` for per-test handler overrides
- Use `renderWithProviders` with `route` option for router context

### Error Testing
- Test both client errors (400, 404, 409) and server errors (500)
- Use MSW `server.use()` to override handlers with error responses
- Assert error UI renders correct messages

### Async Patterns
- All tests are `async`/`await`
- Use `waitFor` for async assertions
- Use `act()` for state updates that trigger effects