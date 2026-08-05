# Testing

## Strategy

**Integration** tests: the real API (Express) is exercised against a real in-memory MongoDB.

- `supertest` sends HTTP requests to the app (no port is opened).
- `mongodb-memory-server` starts a real isolated `mongod` — no external DB or mocks required.
- Trade-off accepted: slower than unit tests, but they verify the full Route → Controller → Service → Model contract.

There are no unit tests yet. If the service/controller grows, pure logic (domain validations, calculations) could be extracted into functions and covered with unit tests.

## How to run

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage report (text, lcov, html)
npm run test:ci       # for CI: ci mode + coverage + maxWorkers=2
```

The coverage report is generated in `backend/coverage/` (git-ignored).

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
    ├── books.create.integration.test.ts
    ├── books.list.integration.test.ts
    ├── books.getById.integration.test.ts
    ├── books.update.integration.test.ts
    └── books.delete.integration.test.ts
```

## How it works

1. **globalSetup**: creates the `MongoMemoryServer`, writes the URI to a temp file (`os.tmpdir()`) and stores the instance in `globalThis`. `globalSetup`/`globalTeardown` share the process, but tests run in separate workers: that is why the URI travels through a file and not a global variable.
2. **setup.ts** (runs in each worker): reads the URI from the file, connects Mongoose to a **worker-unique database** (`test-${process.pid}`) and clears `BookModel` before each test.
3. **Isolation**: `beforeEach` clears the collection. Each worker uses its own database so parallel test files do not wipe each other's data.

## Helpers

| Helper | Usage |
|---|---|
| `testRequest` | `testRequest.get("/api/books")` — Supertest client with the configured app |
| `clearDatabase()` | empties `BookModel` |
| `seedBooks([...])` | inserts books and returns the created documents (with `_id`) |
| `createBookDto(overrides?)` | valid payload for `POST /api/books` with real defaults |
| `createBookModel(overrides?)` | complete `Book` document (with `createdAt`/`updatedAt`) |
| `expectValidationError(res)` | 400 + `"Validation failed"` |
| `expectConflictError(res)` | 409 + `"Book already exists."` |
| `expectNotFoundError(res)` | 404 + `"Book not found"` |

## Naming conventions

- Integration files: `<entity>.<action>.integration.test.ts` (e.g. `books.create.integration.test.ts`).
- Each test references its story case with a `TC-*` ID (e.g. `TC-H2-001`).
- One file per case group (create, list, getById, update, delete), not one per test.

## CI/CD

The `test:ci` script (`jest --ci --coverage --maxWorkers=2`) is the CI entry point:

- `--ci` fails if there are modified snapshots that need updating.
- `mongodb-memory-server` requires no external services, so the pipeline only needs to install dependencies and run `npm run test:ci`.
- No coverage threshold is configured yet; `coverageThreshold` can be added to `jest.config.ts` once there is a defined goal.

## Troubleshooting

- **`ts-node` is required for the TypeScript configuration files**: `jest.config.ts` needs `ts-node` installed (devDependency). Without it, Jest cannot read the config.
- **`Cannot find name 'describe'`/`'jest'`**: `@types/jest` globals are not auto-included with TypeScript 6; `tsconfig.json` must declare `"types": ["node", "jest"]`.
- **`TS151002` warning from ts-jest**: shows up when `tsconfig.json` uses `module: NodeNext` without `isolatedModules: true`. Add `isolatedModules: true`.
- **Flaky tests in parallel**: each worker must use its own database (`dbName` per pid). Two workers sharing the same DB wipe each other's data.
- **Slow first run**: `mongodb-memory-server` downloads the `mongod` binary on the first run. Run `npm test` once before CI to cache it.
- **Console noise**: the error middleware logs every error with `console.error`, including the expected 400s from tests.
