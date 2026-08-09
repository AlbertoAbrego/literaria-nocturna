# Testing

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
- No coverage threshold is configured yet; `coverageThreshold` can be added to `jest.config.ts` once there is a defined goal.

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