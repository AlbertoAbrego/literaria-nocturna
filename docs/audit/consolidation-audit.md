# Consolidation Audit — Literaria Nocturna

**Date:** 2026-08-15
**Scope:** Entire repository (backend, frontend, tests, CI/CD, documentation, configuration)
**Type:** Read-only audit. No source files were modified.
**Method:** Manual code review plus executed verification (ESLint runs, git tracking inspection, test-suite inventory).

---

## Executive Summary

The repository is in a good technical state for a project that has completed its initial feature stories. The backend has a clean layered structure (routes → controllers → services → Mongoose models), a consistent error contract (`{ message, code, details? }`), a well-designed error-mapping middleware, and a genuinely useful integration test suite with proper isolation (mongodb-memory-server). The frontend has a coherent feature-based structure, a strong one-way data flow (URL → `useBookFilters` → query params → TanStack Query → UI), careful accessibility work (modal focus trap, `aria-current`, form error wiring), a healthy Vitest + MSW suite, and a design system whose tokens match its documentation almost token-for-token.

However, the audit found serious gaps in exactly the three areas that matter for the upcoming consolidation phase:

1. **Frontend CI executes zero tests.** The largest test suite in the repo (~185 cases) never runs in GitHub Actions. Every PR currently merges with no frontend regression protection.
2. **The local development contract is broken for any fresh clone.** The backend defaults to port 5000, the frontend defaults to `http://localhost:3000/api`, the seed script hardcodes 3000, there is no Vite proxy, and there is no `backend/.env.example`. The stack only works on the author's machine because untracked `.env` files exist there.
3. **The MSW mock layer has drifted from the real backend contract** (sorting, invalid-parameter handling, validation response shapes, PATCH semantics, 500 message casing). Tests currently pass against a mock that would fail against the real API — a false-confidence risk that must be resolved before building a second, E2E test layer on top of it.

Documentation (`project-context.md`, `roadmap.md`, `tests.md`, `testing.md`, root `README.md`) is stale by roughly nine stories and contradicts the actual implementation and CI in several verifiable places.

**Verdict:** Not yet portfolio-ready, but closer than is typical. Architecture, API design, error handling, and test quality are genuine strengths. The critical work is CI, reproducibility (ports/env), MSW contract fidelity, and a handful of small correctness bugs — not structural redesign.

---

## 🔴 Critical Findings

### C-01 — Frontend CI runs no tests

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | CI/CD |
| **File(s)** | `.github/workflows/frontend-ci.yml:29-36`, `frontend/package.json:6-16` |
| **Blocks E2E** | No, but must be fixed in the same consolidation phase |

**Evidence**

```yaml
# .github/workflows/frontend-ci.yml
- name: Install frontend dependencies
  run: npm ci
- name: Run ESLint
  run: npm run lint
- name: Build frontend
  run: npm run build
```

There is no test step. `frontend/package.json` has `test`, `test:ui`, `test:run`, `test:coverage` — but no `test:ci` — and none of them are invoked by CI.

**Problem**

The frontend has 22 test files with ~185 test cases (Vitest + RTL + MSW), covering pages, hooks, components, and integration flows. None of them run on `push` to `main` or on pull requests. A regression in any of them merges silently.

**Why it matters**

- The strongest regression net in the repository is disconnected from PR protection.
- When Playwright is introduced, CI would run E2E tests while the layer beneath them (which detects functional regressions faster and cheaper) stays dark. This inverts the testing pyramid in the worst place.
- `docs/frontend-testing.md:26` labels `npm run test:run` as "Run once (CI)", implying intent that was never wired up.

**Recommended action**

- Add `"test:ci": "vitest run"` (plus `--coverage` if coverage thresholds are introduced) to `frontend/package.json`.
- Add a `Run frontend tests` step to `frontend-ci.yml` after lint, before/after build.
- Align workflow structure with backend CI (see H-01).

---

### C-02 — Local development contract is broken for a fresh clone (port/env mismatch)

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | Configuration / Developer experience |
| **File(s)** | `frontend/src/shared/api/env.ts:2`, `backend/src/server.ts:6`, `backend/src/scripts/seed-books.ts:72`, `frontend/.env.example`, `.gitignore:8-11` |
| **Blocks E2E** | Yes — E2E needs a reproducible local stack |

**Evidence**

```typescript
// frontend/src/shared/api/env.ts
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
}
```

```typescript
// backend/src/server.ts
const PORT = process.env.PORT || 5000;
```

```typescript
// backend/src/scripts/seed-books.ts:72
const response = await fetch("http://localhost:3000/api/books", {
```

- `backend/.env` exists on disk but is **untracked** (`.gitignore` ignores `**/.env`) and there is **no `backend/.env.example`** — the only template is `frontend/.env.example`.
- `backend/src/config/database.ts:4-6` requires `MONGODB_URI` and throws a plain `Error` if missing; a fresh clone has no way to know this variable exists.
- `frontend/vite.config.ts` has no `server.proxy`; Vite runs on 5173 and hits `getApiUrl()` directly.

**Problem**

On a fresh clone: `npm run dev` in backend → server on **5000**. Frontend defaults to **3000** → every request fails with a network error to a dead port. `npm run seed:books` (undocumented) hits **3000**, the one port where nothing listens. Three pieces of the stack reference three different default ports, and none of it is documented.

**Why it matters**

- A portfolio project must be runnable by a reviewer in under five minutes from the README. Today that is impossible without the author's untracked `.env` files.
- This is a prerequisite for Playwright: E2E setup needs webServer(s) that start deterministically.
- The `npm err`-free-looking detail: backend `PORT` default is a magic value never documented anywhere.

**Recommended action**

- Pick one canonical backend port (e.g. 5000) and align: `frontend/.env.example`, `env.ts` default, a Vite `server.proxy` for `/api` (which would make the frontend default URL a same-origin `/api`), and the seed script (read `API_URL`/`PORT` from env with a documented default).
- Add `backend/.env.example` (`PORT`, `MONGODB_URI`) and document both env files in the root README.
- Add a startup error message in `server.ts`/`database.ts` that explains the missing env var instead of a bare `Error`.

---

### C-03 — MSW mock API has drifted from the real backend contract

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | Frontend tests / API contract |
| **File(s)** | `frontend/src/test/handlers/books.ts`, `frontend/src/test/handlers/errors.ts`, `backend/src/services/book.service.ts:27-35`, `backend/src/controllers/book.controller.ts:110-122`, `backend/src/middleware/error.middleware.ts:12-27` |
| **Blocks E2E** | No, but it undermines the test layer E2E will build on |

**Evidence — divergence table**

| Contract point | Backend behavior | MSW behavior (`handlers/books.ts`) |
|---|---|---|
| Sort order of list | `sort({ title: 1 })` — alphabetical (`book.service.ts:35`) | No sort; seed insertion order (`books.ts:101`) |
| Invalid `page`/`limit` | 400 `VALIDATION_ERROR` (`book.controller.ts:117-122`) | Silently clamps to `max(1, …)` / `min(100, …)` (`books.ts:87-88`) |
| Invalid `genre` on GET | 400 `"Invalid genre"` (`book.controller.ts:110-111`) | Returns an empty list (`books.ts:91`) |
| Create validation `details` | Per-field keys: `{title: "Path \`title\` is required.", …}` (`error.middleware.ts:12-27`) | Single key `body: "title, author, genre and synopsis are required"` (`books.ts:121-124`) |
| PATCH conflict semantics | Conflict only over fields present in body (`book.service.ts:50-61`) | Always checks the full (title, author) pair (`books.ts:167-174`) |
| PATCH empty body | 400 `"Request body is missing"` (`book.controller.ts:235-237`) | 400 `"Validation failed"` + `details.body` (`books.ts:160-162`) |
| 500 message | `"Internal Server Error"` (`error.middleware.ts:38,51`) | `"Internal server error"` — lowercase `s` (`handlers/errors.ts:28`) |
| Invalid ObjectId on GET | 400 `"Invalid ID"` (`book.controller.ts:177-179`) | 404 not found (`books.ts:111-114`) |

**Concrete consequence**

`BooksPage.test.tsx:45` and other UI tests assert ordering ("The Whisper of the Void" first). Against the real backend, list responses are sorted by title, so the seeded mock's insertion order would produce a different first row. The mock dataset ordering is not alphabetical, so these assertions would fail against the live API even though the frontend is correct.

**Why it matters**

- The mock is the contract the frontend tests believe in. With five functional divergences and two message/shape divergences, the suite can pass while the real integration is broken in the same scenarios.
- `BookForm.test.tsx` and `CreateBookPage.test.tsx` only ever exercise MSW's `details.body` shape, so the per-field error rendering path (`handleError` in `BookForm.tsx:51-57`) is effectively untested against the real contract.

**Recommended action**

- Realign `handlers/books.ts` and `handlers/errors.ts` to the backend contract exactly (sorting, 400s for invalid params, per-field `details`, PATCH partial-conflict semantics, exact messages).
- Add a parity test that compares the MSW handlers' responses to recorded/fixture responses from the real backend (or generate both sides from the OpenAPI spec).
- If Swagger is kept as the source of the contract, this becomes: "spec → fixtures → MSW handlers", eliminating the manual drift class of bugs.

---

## 🟠 High Priority Findings

### H-01 — CI pipelines are inconsistent with each other and with documented intent

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | CI/CD |
| **File(s)** | `.github/workflows/frontend-ci.yml:18,29-30`, `.github/workflows/backend-ci.yml:29-34,46`, `docs/testing.md:188`, `frontend/package.json` |
| **Blocks E2E** | No |

**Findings**

1. `frontend-ci.yml:18` declares the job as `backend:` — a copy-paste artifact.
2. Backend CI uses `actions/setup-node@v4` with `node-version: 22` and npm caching; frontend CI has **no setup-node step at all** (relies on the runner's preinstalled Node, unversioned and uncached).
3. Backend CI runs `npm test` (`backend-ci.yml:46`) instead of the documented `test:ci` entry point (`jest --ci --coverage --maxWorkers=2`). The `test:ci` script therefore never runs anywhere.
4. Frontend has no `test:ci` script (see C-01).

**Recommended action**

- Rename the frontend job, add `actions/setup-node@v4` + npm cache to the frontend workflow (mirroring the backend), pin the same Node version, and have both workflows invoke `npm run test:ci`.

---

### H-02 — Unescaped user input in MongoDB `$regex` filters

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Backend — search security/correctness |
| **File(s)** | `backend/src/services/book.service.ts:27-28` |
| **Blocks E2E** | No |

**Evidence**

```typescript
if (filters?.author) query.author = { $regex: filters.author, $options: "i" };
if (filters?.title) query.title = { $regex: filters.title, $options: "i" };
```

**Problem**

User-supplied strings are interpolated directly into regular expressions. A query like `.*` matches every character, `^`/`$`/`.([{` change matching semantics, and pathological patterns can be expensive to evaluate (ReDoS-adjacent behavior on the DB server). The Swagger docs advertise the queries as plain "case-insensitive partial match", but the implementation behaves as regex matching.

**Why it matters**

- Correctness: search results for `a.b` or `[` are surprising (or error-500 via bad regex syntax in some MongoDB regions).
- This surface is exactly where an API stabilizes before E2E; changing the semantics later breaks UI behavior tests.

**Recommended action**

- Escape regex metacharacters before building the pattern (`input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`), or switch to a text index (`$text`) if case-insensitive partial matching is not sufficient.

---

### H-03 — Genre domain duplicated across three sources with no parity check

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Architecture / API contract |
| **File(s)** | `backend/src/models/book.model.ts:3-19`, `backend/src/config/swagger.ts:14-33`, `frontend/src/features/books/types/book.types.ts:1-17`, `backend/src/test/integration/swagger.integration.test.ts:12-18` |
| **Blocks E2E** | No |

**Evidence**

The 15 genre values are defined in the Mongoose enum, then **hand-copied** into the Swagger `Genre` schema, then **hand-copied again** into the frontend `GENRES` constant. The Swagger test only asserts that paths `/books` and `/books/{id}` exist — it never checks schema contents against the model.

**Recommended action**

- Generate the Swagger `Genre` schema from `Object.values(Genre)` at spec-build time.
- Add a backend test asserting the Swagger enum equals the model enum.
- Add a type-level parity test on the frontend (`GENRES` vs a fetched `/api/docs/swagger.json` genre list), or generate the frontend constant from a shared artifact.

---

### H-04 — No runtime DTO validation layer; validation is implicit at the DB layer

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Backend — validation |
| **File(s)** | `backend/src/dto/book/*.ts` (all), `backend/src/controllers/book.controller.ts:46-48,110-122,235-241`, `backend/src/models/book.model.ts:21-31` |
| **Blocks E2E** | No |

**Evidence**

All three DTOs are plain TypeScript types — there is no runtime validation anywhere in the request path for shape beyond: (a) presence checks in the controller, (b) genre enum inline check, (c) Mongoose schema validation that only fires at persistence time.

Consequences observed:

- Error messages are Mongoose's: `Path \`title\` is required.` — leaking schema wording into the API (`error.middleware.ts:23-27`).
- Request bodies with unknown keys are silently dropped by Mongoose strict mode instead of rejected.
- Empty-string / whitespace-only values fall through until the DB layer.
- No length or format constraints (e.g., a 10 MB synopsis is valid).

**Why it matters**

Adding new modules (Members, Readings) will multiply this pattern. The error format is already standardized (`details` per field); a validation layer that produces that shape directly (e.g., a small hand-rolled validator or zod with a shared error mapper) would remove the Mongoose-message leak and centralize validation policy.

**Recommended action**

- Introduce a runtime validation layer for `CreateBookDto`/`UpdateBookDto`/`BookQueryDto` (zod is the lightest fit) and map its output into the existing `AppError`/`details` format.
- Keep Mongoose validation as a defense-in-depth second layer; optionally map `ValidationError` into the same shape (already done).

---

### H-05 — Pagination edge-case bugs in delete and filter-count UI

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Frontend — correctness |
| **File(s)** | `frontend/src/features/books/hooks/useDeleteBook.ts:41-56`, `frontend/src/pages/BooksPage.tsx:11` |
| **Blocks E2E** | Yes — both are cheap to trigger in a browser and would surface immediately |

**Bug 1 — delete on last page leaves a stale empty page**

The optimistic update removes the row and decrements `total` but never adjusts `page`. Deleting the only item of the last page leaves the UI on `?page=N` where N > `totalPages`: empty table, "Showing X–Y of Z" with X>Y, and a pagination component that cannot navigate Forward (Next is disabled at `isLast`).

**Bug 2 — active-filter counter counts the page param**

`BooksPage.tsx:11` computes `Object.keys(filters.queryParams).length`. `queryParams` includes `page` when `page > 1` (`searchFilters.ts:66`), so a user with one filter on page 2 sees "2 active filters" and the counter stays wrong when page changes.

**Recommended action**

- After a successful delete, if `page > totalPages && totalPages > 0`, navigate to `totalPages` (via `setPage`), matching the backend's behavior of serving an empty-but-valid last page when the page does exist.
- Compute the active count from the filter fields only (title/author/genre), e.g. count over `EMPTY_SEARCH_FILTERS` comparison rather than `queryParams`.

---

### H-06 — Backend build ships test files in the production output

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Backend — build hygiene |
| **File(s)** | `backend/tsconfig.json:23` (`include: ["src"]`) |
| **Blocks E2E** | No |

**Evidence**

`dist/test/` exists on disk (e.g., `backend/dist/test/setup.js`). `rootDir: ./src` + `include: ["src"]` compiles the entire test suite, helpers, and seed script alongside `server.js`.

**Why it matters**

- `npm start` in production ships Jest/mongodb-memory-server test code paths (imports of `mongo-memory-server` etc. are not real at runtime, but the files are dead weight and can break strict deployment expectations).
- `npm run build` takes longer than necessary and can fail for test-only reasons.

**Recommended action**

- Exclude `src/test` and `src/scripts` from the build via `exclude` in `tsconfig.json`, or introduce a dedicated `tsconfig.build.json`.

---

### H-07 — Seed script is fragile, hardcoded, and undocumented

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Backend — developer tooling |
| **File(s)** | `backend/src/scripts/seed-books.ts:72`, `backend/package.json:16` |
| **Blocks E2E** | No |

**Evidence**

- Hardcodes `http://localhost:3000/api/books` (a dead port on fresh setups — see C-02).
- 57 sequential `fetch` POSTs; a re-run stops at the first seeded book with a 409 (duplicate) — the script's own success path creates its own failure state.
- Mentioned in `backend/package.json` but in **zero** documentation files.

**Recommended action**

- Read the API base URL from `process.env.API_URL` (defaulting to the canonical backend port).
- Use upsert-like semantics (GET/PATCH on existing) or continue on 409, and summarize created/skipped counts.
- Document it in the root README dev section.

---

### H-08 — Duplicate-guard is a find-then-write race; no unique index

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Backend — data integrity |
| **File(s)** | `backend/src/services/book.service.ts:12-15,50-61`, `backend/src/models/book.model.ts:21-31` |
| **Blocks E2E** | No |

**Evidence**

`createBook` (and `updateBook`) check existence with `findOne`, then write. Two concurrent requests with the same title+author can both pass the check (`Book already exists` is a best-effort gate, not a guarantee). There is no unique index on `(title, author)` in the schema.

**Recommended action**

- Add `bookSchema.index({ title: 1, author: 1 }, { unique: true })`.
- Handle Mongo duplicate-key error `11000` in `error.middleware.ts` (map to the existing 409 `CONFLICT` shape) so the race is converted into the same user-facing error.
- Keep the pre-check for friendly early responses; the index makes it correct under concurrency.

---

## 🟡 Medium Priority Findings

### M-01 — Frontend book types are weak and duplicated

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Frontend — typing |
| **File(s)** | `frontend/src/features/books/types/book.types.ts:25,33,39`, `frontend/src/test/utils/factories/book.factory.ts:5-14` |
| **Blocks E2E** | No |

- `Book.genre` and `CreateBookInput.genre`/`UpdateBookInput.genre` are typed `string` while `BooksQueryParams.genre` is `Genre` — the type system allows sending invalid genres that the backend will reject with 400 (currently unreachable from the UI, but the API layer doesn't enforce it).
- The `Book` type is declared twice: production (`genre: string`) and test factory (`genre: Genre`). Two parallel hierarchies that can drift (they already differ in genre typing).
- `DeleteBookResponse = void` (`book.types.ts:71`) and `deleteBook`'s declared `Promise<DeleteBookResponse>` is ceremony around "nothing is returned".

**Recommended action**

- Single `Book` type with `genre: Genre`; have the factory import it; drop the `DeleteBookResponse` alias.

---

### M-02 — Hook tests assert TanStack Query key strings (implementation details)

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Frontend tests |
| **File(s)** | `frontend/src/features/books/hooks/useBooks.test.ts:66-68,98-99`, `useBook.test.ts:56`, `useCreateBook.test.ts:134-145`, `useUpdateBook.test.ts:162-163`, `useDeleteBook.test.ts:23,181-182` |
| **Blocks E2E** | No |

Six hook test files assert on serialized query keys (`["books", undefined]`, `["books","detail",id]`, invalidation spies). Renaming a key (e.g., adding a namespace for Members module) breaks tests for reasons unrelated to behavior. `EditBookPage.test.tsx:78-114` demonstrates the better pattern: asserting invalidation *outcome* behaviorally (stale-time Infinity + refetch visibility).

**Recommended action** — Replace key-string assertions with behavior-level assertions, or centralize keys in a single module (e.g., `queryKeys.ts`) so keys are refactorable in one place and tests can import them instead of hardcoding strings.

---

### M-03 — `src/test/examples/` scaffolding runs in CI but covers no production code

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Frontend tests |
| **File(s)** | `frontend/src/test/examples/{component.example.test.tsx, hook.example.test.ts, integration.example.test.tsx}` (+ `vitest.config.ts:15`) |
| **Blocks E2E** | No |

All three files match `src/**/*.test.{ts,tsx}` and therefore run in every CI run (12 test cases). They use inline throwaway components and **re-implement production hooks inline** (`hook.example.test.ts:22-37`), duplicating scenarios already covered by the real `useBooks`/`useCreateBook` suites. They are documentation, not tests.

**Recommended action**

- Move them out of `src` (e.g., `docs/testing-examples/`), rename to non-`*.test.*` files, or exclude via `vitest.config.ts`. If kept, point the examples at the real hooks/components so they stay true.

---

### M-04 — Missing high-value test scenarios

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Testing |
| **File(s)** | `frontend/src/shared/api/http.ts:28-33`, `frontend/src/features/books/hooks/useBookFilters.ts:26-32`, `backend/src/controllers/book.controller.ts:110-122` |
| **Blocks E2E** | No |

Gaps identified (not an exhaustive mandate):

1. **Axios error branches** in `http.ts`: `ECONNABORTED` → TIMEOUT and network-level `NETWORK_ERROR` have no tests.
2. **Debounce timing behavior**: no test uses fake timers to assert 300 ms (`DEBOUNCE_MS`), timer cancellation on rapid typing, or cleanup on unmount (`useBookFilters.ts:26-32`). The current tests only assert "eventually updates".
3. **Backend 400 paths on GET** (invalid `page`/`limit`/`genre`) are untestable in the frontend because the MSW handler clamps instead of returning 400 (see C-03).
4. **Edit-mode server 500** on PATCH is tested only at hook level, not through the form.
5. **`limit` query param** is never exercised (frontend never sends it — fine — but the contract edge is untested).

**Recommended action** — Add targeted tests for 1 and 2; fix 3 via C-03; decide whether 4-5 are worth coverage.

---

### M-05 — Documentation is stale or contradictory

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Documentation |
| **File(s)** | `docs/project-context.md:17-18,376-399`, `docs/roadmap.md`, `docs/tests.md:69,107,146-161`, `docs/testing.md:188`, `docs/frontend-testing.md:26` |
| **Blocks E2E** | No |

Verified contradictions:

- `project-context.md` claims Mongoose 8 / Jest 29; `backend/package.json` has Mongoose 9 / Jest 30.
- `project-context.md` "Implemented (Stories 1–10) / Planned (Story 11+)": the entire frontend (stories 12–19) and CI/CD are implemented and merged.
- `roadmap.md` says "Current: Story 11" — stale by nine stories.
- `tests.md:69` claims TC-H5-002 is tested in update/delete suites; it is in `books.getById.integration.test.ts:16`. Its summary counts (e.g., Get-by-ID 2/2) and file list (6 files, missing Swagger) contradict actual suites (7 files, 3 Get-by-ID tests).
- `tests.md:107` says validation errors are logged; `error.middleware.ts:31-36` only logs 5xx (correctly documented elsewhere in `testing.md:205` — the two docs contradict each other).
- `testing.md:188` says `test:ci` is the CI entry point; `backend-ci.yml:46` runs plain `npm test`.

**Recommended action** — One consolidation pass over the docs after the consolidation work is done (so they document the fixed reality, not the current one). See also M-06.

---

### M-06 — READMEs are not usable for a portfolio project

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Documentation |
| **File(s)** | `README.md` (root, 3 lines), `frontend/README.md` (untouched Vite boilerplate, incl. React Compiler section) |
| **Blocks E2E** | No |

Root README: title + CI badge with placeholder `https://github.com/usuario/repositorio/...` — no setup, no scripts, no architecture, no env vars. `frontend/README.md` is the default Vite template.

**Recommended action** — Rewrite root README with quickstart (prereqs, ports, env setup, seed, test commands), architecture diagram, repo layout, and links to `docs/`. Fix or remove the badge.

---

### M-07 — Security posture is dev-only (CORS wide open; no hardening)

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium (deployment-dependent) |
| **Area** | Security |
| **File(s)** | `backend/src/app.ts:10` |
| **Blocks E2E** | No |

`app.use(cors())` accepts every origin. There is no helmet, rate limiting, or request-size configuration (Express JSON body default 100 kb — the only implicit limit). No authentication exists anywhere, which is consistent with the MVP scope.

**Recommended action** — Before any public deployment: env-driven CORS allowlist, helmet, rate limiting on the API, and explicit body-size policy. Do not treat this audit's silence on auth as approval to deploy without it.

---

### M-08 — Swagger spec is hand-maintained and only shallowly tested

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | API documentation / contract |
| **File(s)** | `backend/src/config/swagger.ts:12-152`, `backend/src/test/integration/swagger.integration.test.ts:12-18`, `backend/src/routes/swagger.routes.ts` |
| **Blocks E2E** | No |

The OpenAPI `components` (Book, DTOs, Genre, PaginatedResponse, ErrorResponse) are written by hand and are not asserted against the actual Mongoose model or the error-middleware output. The integration test only checks that two paths exist. Spec-vs-code drift (e.g., H-03 genre parity) is currently invisible to CI.

**Recommended action** — Add assertions: Genre enum parity (H-03), `Book` required fields vs model, delete-returns-204-no-content, and that every controller-thrown status has a documented response.

---

### M-09 — Backend environment contract is undocumented; health check is superficial

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Configuration |
| **File(s)** | `backend/src/config/database.ts:4-6`, `backend/src/controllers/health.controller.ts:28-35` |
| **Blocks E2E** | No |

- `PORT`/`MONGODB_URI` exist only in the untracked `.env`; a missing URI produces a bare `Error("Database URI is not provided")`.
- `GET /api/health` returns `{ status: "ok" }` unconditionally — it does not ping MongoDB, so it reports healthy while the DB is unreachable (misleading for E2E readiness probes).

**Recommended action** — `backend/.env.example` (C-02), a friendlier startup error, and optionally a DB-connectivity field in the health response (or a separate `/api/health/db`).

---

### M-10 — Frontend test layers duplicate heavy flows; rebalance before E2E

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Testing strategy |
| **File(s)** | `frontend/src/pages/BooksPage.test.tsx` (25 cases) vs `BookTable/FilterBar/SearchBar/GenreFilter/DeleteBookButton/Modal/*.test.tsx` |
| **Blocks E2E** | No |

`BooksPage.test.tsx` comprehensively re-exercises delete-modal mechanics, filter interactions, keyboard nav, and pagination that the component-level tests already cover; conversely component tests duplicate page-level flows. This is not wrong — defense in depth — but it is the layer where the cost of duplication is highest right now: ~30–40% of the suite re-tests the same flows through different entry points.

**Recommended action** — When Playwright arrives, cut the jsdom layer down to: logic units (searchFilters, http errors, pagination range), the contract-hardened MSW path, and a single page-level smoke per route; let E2E own full user flows. This prevents the jsdom suite from bloating alongside an identical E2E suite.

---

### M-11 — Stale artifacts and lint noise in the frontend repo

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Repo hygiene |
| **File(s)** | `frontend/cov.txt` (tracked), `frontend/cov2.txt` (untracked, stale), `frontend/coverage/**` (generated, on disk), `frontend/eslint.config.js:10` |
| **Blocks E2E** | No |

- `frontend/cov.txt` is committed to git (verified via `git ls-files`) — a stale coverage dump with a hardcoded local path (`C:/programacion-con-ia/...`).
- ESLint (executed during this audit) reports 6 warnings — all from generated `frontend/coverage/lcov-report/*.js` files, because the config ignores `dist` but not `coverage`. `npm run lint` is currently noisy.
- `vitest.config.ts:30` already sends coverage to `coverage/`, and `.gitignore` already ignores it — the artifacts are leftover from local runs.

**Recommended action** — Remove `cov.txt`/`cov2.txt`, add `coverage` to `eslint.config.js` `globalIgnores`, and add `coverage` to `frontend/.prettierignore`/`frontend/.gitignore` if not already (root `.gitignore:19-20` covers it).

---

### M-12 — No coverage thresholds or coverage gating in CI

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **Area** | Testing / CI |
| **File(s)** | `backend/jest.config.ts:9-11` (no thresholds), `frontend/vitest.config.ts:19-31` (no thresholds) |
| **Blocks E2E** | No |

Current measured coverage (from the tracked `cov.txt`): frontend ~89% statements / ~81% branches — healthy. But nothing enforces it, backend CI doesn't run coverage at all, and `collectCoverageFrom: ["src/**/*.ts"]` includes the test helpers themselves, inflating the number slightly.

**Recommended action** — Decide explicit thresholds (e.g., ≥85% statements, ≥75% branches) and wire them into `test:ci` for both apps, once the consolidation fixes land (adding thresholds now would fail the suite for unrelated reasons).

---

## 🟢 Low Priority Findings

### L-01 — `main` field points to a non-existent file
`backend/package.json:5` — `"main": "index.js"` does not exist (build output is `dist/server.js`). Harmless for scripts (they use explicit entrypoints) but wrong metadata for a portfolio repo.

### L-02 — Hardcoded version in health response
`backend/src/controllers/health.controller.ts:32` — `version: "1.0.0"` is hardcoded while `package.json:3` also says `1.0.0`. They will drift; read from `package.json` or keep both updated.

### L-03 — Backend Jest `collectCoverageFrom` includes `src/test/**`
`backend/jest.config.ts:9` — `["src/**/*.ts", …]` counts test code as coverable, slightly inflating coverage figures and masking gaps in helpers.

### L-04 — Home page is a placeholder
`frontend/src/pages/HomePage.tsx` renders a bare heading. Fine for the current scope; flag as content debt before E2E copy-checks (E2E will assert real copy, so fix before writing Home checks).

### L-05 — BookForm `handleSuccess` resets values that no caller observes
`frontend/src/features/books/components/BookForm.tsx:42-49` — both callers navigate away on success, so the reset is dead code. Trivial cleanup during consolidation.

---

## ℹ️ Observations

**Verified strengths (recorded for the portfolio assessment):**

- **Error contract is exemplary**: `AppError` with derived codes (`backend/src/errors/AppError.ts`), `error.middleware.ts` maps Mongoose validation → 400 with field details, masks all 5xx internals with a fixed message, logs only server-side errors, and defers to Express when headers are sent. The frontend mirrors it exactly (`shared/api/errors.ts`, `http.ts` interceptor with `statusToCode` fallback).
- **Backend test isolation is sound**: `mongodb-memory-server` in global setup, per-process `dbName: test-${pid}` (`setup.ts:12`), collection cleared per test file, DB dropped in teardown. Parallel-safe with `--maxWorkers=2` claim verified against config.
- **MSW discipline**: `onUnhandledRequest: "error"` (`setup.ts:8`) — any request the app makes outside the mock contract fails the test. Reset handlers + deterministic seed reset per test.
- **Accessibility**: modal focus trap + Escape + focus restore + overlay (`Modal.tsx`), `aria-current="page"` and arrow-key nav in pagination, `aria-invalid`/`aria-describedby` wired through `FormField`, `role="alert"` on error surfaces, sr-only live region during catalog loading.
- **Design system parity**: every color token, radius, typography token (`font-heading`), and UI-component spec in `docs/design/` matches the actual Tailwind implementation (verified token-by-token).
- **Code hygiene**: zero `any`, zero `@ts-ignore`, zero `TODO/FIXME`, zero `console.log` in `frontend/src`; backend uses `console` only in server/bootstrap/error paths (appropriate for this scale). ESLint: backend clean (exit 0); frontend only the coverage-generated warnings (M-11).
- **TypeScript discipline on the backend**: `strict: true`; `ErrorCodes` derived via `as const` indexed access — a single source of truth for codes.
- **Canonical URL state**: filters and page live in URL search params (`useBookFilters`), so back/forward works in jsdom tests and the browser — the right foundation for E2E.

**Other observations:**

- **Playwright**: confirmed not installed (`frontend/package.json` has no Playwright dependency; no `e2e/` directory; docs explicitly list it as out of scope for stories 12.5/13). The audit treats it as "planned".
- **`useBookFilters` render-phase sync pattern** (`useBookFilters.ts:21-24`) uses the React-documented "adjust state during render" pattern with a dedicated guard — correct as written, but subtle; a comment would help future maintainers.
- **Health endpoint semantics**: see M-09 — intentional scope, recorded so E2E readiness probes don't rely on it.
- **Jest `spyOn(BookModel, "find")` mocks** (`books.list.integration.test.ts:104-106`) cast through `unknown` — fragile but contained; acceptable.
- **No `backend-context.md`** exists; backend conventions live only inside `project-context.md`. When new modules arrive, a dedicated backend doc (mirroring `frontend-context.md`) would be the natural structure.
- **docs/planning/** is gitignored by design (`.gitignore:36-37`); the prior audit prompt lives there. Fine — but the consolidation report (this file) is tracked and should stay tracked.
- `.gitattributes` enforces LF for TS/JS/JSON/MD/YAML — good.
- The MSW seed dataset is thematically excellent for a book-club app; the mock's 5 books are real contract fixtures in training.

---

## Backend Assessment

| Dimension | Verdict |
|---|---|
| Structure | ✅ Routes → controllers → services → models; DTOs in isolation; health/swagger separate. Clean for its size |
| Validation | ⚠️ DB-layer only; no runtime DTO validation (H-04) |
| Error handling | ✅ Strong: `AppError`, `ErrorCodes`, derived codes, standardized body, 5xx masking |
| HTTP semantics | ✅ 201/200/204/400/404/409/500 all used correctly; PATCH for partial update is idiomatic |
| Pagination | ✅ `{data, pagination:{page,limit,total,totalPages}}`; validated `page`/`limit` with max 100; defaults |
| Search/filtering | ⚠️ Regex interpolation of user input (H-02); works but semantics are not "plain partial match" |
| Duplicate handling | ⚠️ find-then-write; no unique index (H-08) |
| Config | ⚠️ Untracked `.env`, no example, silent defaults mismatch (C-02, M-09) |
| Swagger | ⚠️ Hand-maintained schemas; shallow test coverage (H-03, M-08) |
| Build | ⚠️ Ships test files in `dist` (H-06) |
| Logging | ✅ Minimal and appropriate; 5xx-only in middleware |
| TypeScript | ✅ strict, `as const` codes, no `any` |

Notable design decisions worth preserving: the `ErrorCodes`/`deriveCodeFromStatus` single-source pattern; controller-level guard clauses returning `next(new AppError(...))` before `try/catch` (readable); `Promise.all` for parallel count+find in the list service.

---

## Frontend Assessment

| Dimension | Verdict |
|---|---|
| Feature organization | ✅ `features/books/{api,hooks,components,types,utils}` + `pages` + `shared/{api,components}` — scale-friendly |
| API layer | ✅ axios instance with typed error interceptor; single `http` client; env-driven base URL (default is the C-02 problem) |
| TanStack Query | ✅ Keyed queries, `staleTime`/`retry` defaults, optimistic delete with rollback |
| Routing | ✅ Router 7 data-free `createBrowserRouter`; static routes before dynamic; `/books/create` order is safe |
| Loading/error/empty states | ✅ Skeletons (`aria-busy`), ErrorState + Retry, contextual EmptyState (filtered/normal) |
| Forms | ✅ Controlled + per-field errors + `aria-invalid` & `aria-describedby`; 409/400 mapped to form vs banner |
| Typing | ⚠️ `genre: string` instead of `Genre`; duplicated `Book` type (M-01) |
| A11y | ✅ Strong (modal, focus, aria wiring) |
| Responsive | ✅ Responsive grids, `sm:` breakpoints, `max-w-[1200px]` container |
| Design system | ✅ Exact match to `docs/design/` |
| ESLint | ⚠️ Runs, but polluted by `coverage/` warnings (M-11) |
| TypeScript strictness | ⚠️ **`tsconfig.app.json` does not set `"strict": true`** — the project's own docs claim "TypeScript strict checking"; only `noUnusedLocals`/`noUnusedParameters` are on. This should be corrected in consolidation (verify the repo compiles clean under strict before flipping it). |

**Frontend types note:** the claimed "TypeScript strict checking" (task context) is true for the backend (`strict: true`) but **not verified for the frontend** (`tsconfig.app.json:1-29` contains no `strict` flag). This is a documentation-vs-config discrepancy; either enable it or stop claiming it.

---

## Frontend ↔ Backend Integration Assessment

Traced flow-by-flow (request → response → types → hooks → UI):

| Flow | Request | Backend | Frontend types/hook | Verdict |
|---|---|---|---|---|
| List books | `GET /api/books?title&author&genre&page&limit` | `{data, pagination}` sorted by title | `PaginatedResponse<Book>` / `useBooks(queryParams)` | ✅ Shape matches |
| Pagination | `page=1..N`, limit ≤100 | validated; out-of-range → empty data | `filters.page` ↔ URL ↔ `Pagination` | ✅ Consistent (URL only includes `page` when >1 — a clean canonicalization) |
| Search | `title=`/`author=` partial CI regex | `$regex $options:"i"` | debounced 300ms, trimmed, URL-synced | ⚠️ Escape regex (H-02) |
| Genre filter | `genre=` enum | inline enum check → 400 for invalid | `Genre \| ""` from `GENRES` | ✅ (UI can't send invalid values) |
| Get by id | `GET /books/:id` | 200/400 invalid id/404 | `useBook` maps 404 → `isNotFound` | ✅ |
| Create | `POST /books` | 201 `Book` | `useCreateBook` → invalidate `["books"]` | ✅ (409 handled in form) |
| Update | `PATCH /books/:id` | 200; 400 empty body; 404; 409 | `useUpdateBook` invalidates list + detail | ✅ |
| Delete | `DELETE /books/:id` | 204 no body | optimistic remove + rollback + invalidate | ⚠️ Page clamp bug (H-05) |
| Validation errors | 400 `details` per-field | Mongoose-derived messages | `BookForm` maps `details` → field errors | ⚠️ MSW shape differs from real (C-03) |
| Not found | 404 `NOT_FOUND` | consistent | `isNotFound` states on details/edit; inline message on delete | ✅ |
| Conflict | 409 `CONFLICT` | `Book already exists.` | banner via `handleError` | ✅ |
| Server error | 500 `INTERNAL_ERROR` | masked message | generic ErrorState/ErrorAlert | ✅ |

**Contract mismatches found:** 8 (see C-03 table). All are in the mock layer or in parameter-safety (H-02), not in the production frontend code paths — the production client matches the backend correctly in shape, method, and status handling.

**One subtle mismatch in the client:** the MSW's PATCH conflict semantics differ from the backend's partial-field logic (`handler checks the full pair`; backend checks only provided fields). No production UI sends a partial PATCH with only `author`, so this is currently latent — but it will bite E2E fixture scenarios if the mock is used as the E2E backend stand-in.

---

## Testing Assessment

### Backend (Jest + supertest + mongodb-memory-server)

- **Structure**: 7 integration files, all through the real Express app over an in-memory MongoDB. Test IDs (`TC-Hx-###`) tie to `docs/tests.md` — nice traceability, but the doc is stale (M-05).
- **Isolation**: per-pid database + per-file `beforeEach` wipe — clean; verified parallel-safe.
- **Coverage by scenario** (verified per file): create (201, 409, missing title 400); list (sort by `title` for pagination assertions, genre/author/title filters, combined, empty, invalid genre 400, DB failure 500, 9 pagination cases incl. defaults, invalid page/limit, metadata, count-failure 500); getById (200, invalid ObjectId 400, 404); update (200 full/partial, invalid id 400, invalid genre 400, empty body 400, 404, duplicate 409); delete (204, invalid id 400, 404, delete-then-get 404, DB failure 500); health; swagger paths.
- **Gaps**: no test for create with an empty body `{}` (the `req.body` guard branch in `book.controller.ts:46-48` is currently unexecuted — only "missing title" is covered); no sorting-by-title assertion on the unfiltered list; no concurrent-duplicate test (would fail today — H-08); swagger tests are shallow (M-08).
- **Scripts**: `test`, `test:watch`, `test:coverage`, `test:ci` all present; CI uses `npm test` (H-01).

### Frontend (Vitest + RTL + MSW)

- **Structure**: setup (`onUnhandledRequest: "error"`), one MSW server, in-memory seed DB with reset, factory utilities, `renderWithProviders` with per-test QueryClient. Good.
- **Scope**: ~185 cases across pages (4 files / 42 cases), components (10 files), hooks (6 files / 58 cases), shared UI (2 files), utilities (inside hook tests), examples (3 files / 12 cases).
- **Responsibilities are mostly clear**: hooks test query/mutation semantics; component tests test rendering + interaction; page tests test flows; `useBookFilters` + `searchFilters` unit tests test URL logic. The blur is at the page layer duplicating component coverage (M-10).
- **Implementation-detail tests**: query-key strings in 6 hook files (M-02); `onChange` spy assertions in `SearchBar`/`GenreFilter`/`FilterBar` are white-box-ish but cheap.
- **Strong signals**: debounce "no early refetch" and back/forward sync are tested at page level (timing itself is not — M-04); `EditBookPage.test.tsx:78-114` tests cache invalidation behaviorally — the model for M-02.
- **MSW fidelity**: 8 divergences (C-03) — the single most important testing-strategy risk.
- **Examples**: run in CI but cover nothing (M-03).

### Layer responsibilities (post-consolidation target)

1. **Backend integration tests** — API contract, validation, data rules.
2. **Frontend unit/component tests** — logic, rendering, a11y, error mapping (thinned by M-10).
3. **Frontend integration tests (MSW)** — page flows against a contract-faithful mock.
4. **Playwright E2E** — full user journeys against real backend (+ real browser history, debounce timing, network).

### Not recommended

- **Not** adding a parallel unit-test layer for backend services (the integration layer plus DB mocks already covers them; a services unit layer would duplicate).
- **Not** testing the UI's every Tailwind class (only token-level behavior, if anything).
- **Not** enforcing 100% coverage; thresholds at the current measured levels (89/81) are the right target.

---

## CI/CD Assessment

| Aspect | Backend | Frontend | Verdict |
|---|---|---|---|
| Trigger | push+PR to main, path-filtered (`backend/**`) | push+PR to main, path-filtered (`frontend/**`) | ✅ Symmetric, efficient |
| Node version | 22 via setup-node + npm cache | **Runner default, no setup-node, no cache** | ⚠️ H-01 |
| Lint | ✅ `npm run lint` | ✅ `npm run lint` | ✅ |
| Typecheck/build | ✅ `npm run build` (tsc) | ✅ `npm run build` (`tsc -b && vite build`) | ✅ |
| Tests | ✅ `npm test` | ❌ **absent** | 🔴 C-01 |
| Coverage | ❌ not in CI | ❌ not in CI | ⚠️ M-12 |
| Path filters | `backend/**` + workflow file | `frontend/**` + workflow file | ✅ |
| Job naming | `backend` | **`backend`** (copy-paste) | ⚠️ H-01 |

**Does the current setup protect PRs?** Partially. Backend PRs are protected; frontend PRs are only lint+build-checked — no test execution. A frontend behavior regression has zero CI signal. Both pipelines run `npm ci` from lockfiles and checkout `actions/checkout@v4` — both good.

**Frontend `test:ci`**: confirmed missing from `frontend/package.json`. Add `"test:ci": "vitest run"` (coverage optional once thresholds exist).

---

## Documentation Assessment

Verified against implementation (full matrix in M-05; highlights below):

| Doc | State |
|---|---|
| `docs/project-context.md` | ⚠️ Versions stale (Mongoose 8→9, Jest 29→30); state section ends at Story 10; CI/CD listed as "planned"; no frontend coverage at all |
| `docs/roadmap.md` | ⚠️ "Current: Story 11" — 9 stories stale |
| `docs/tests.md` | ⚠️ Wrong TC-H5-002 attribution, wrong TC-H3-005 logging claim, missing Swagger group, 6 vs 7 files, mismatched totals |
| `docs/testing.md` | ⚠️ Accurate strategy, but "test:ci is CI entry point" is false |
| `docs/frontend-testing.md` | ✅ Accurate (scripts match package.json; conventions match code) |
| `docs/design/design-system.md` | ✅ Token-for-token accurate against `index.css` and components |
| `docs/design/design-context.md`, `ui-components.md` | ✅ Accurate (verified buttons, inputs, cards, navbar, pagination, empty/not-found copy) |
| `docs/mvp.md` | 🟢 Skeletal but not contradictory |
| Root `README.md` | 🔴 Placeholder; unusable as documentation (M-06) |
| `frontend/README.md` | 🔴 Untouched Vite boilerplate (M-06) |
| `docs/planning/audit.md` | ℹ️ Prior audit prompt (gitignored by design) |

**Missing decisions documented nowhere:** the error format evolution (story-10's own follow-up items were never written into `project-context.md` — `docs/stories/story-10-...md:91-96` requires documenting malformed-JSON→500 behavior; not done); the port contract (C-02); seed script; `PORT`/`MONGODB_URI`; the storytelling artifacts claim "strict" frontend TS (untrue — see Frontend Assessment).

---

## Portfolio Readiness

### Already strong (publish-worthy as-is)

1. **API design + error handling** — the `{message, code, details}` contract, 204 semantics, pagination shape, and masked 5xx are production-grade and consistent end-to-end. A reviewer inspecting only the API layer will be impressed.
2. **Backend test architecture** — memory-server integration tests with clean isolation, scenario IDs, and meaningful negative coverage (404/409/500, invalid params, DB-failure mocks).
3. **Frontend architecture** — feature-sliced structure, URL-as-state, TanStack Query discipline, optimistic updates with rollback, a11y rigor.
4. **Design system documentation** — rare in portfolios; `docs/design/*` matching code exactly is a differentiator.
5. **Code hygiene** — zero `any`/`ts-ignore`/`TODO`; strict backend TS; clean eslint (modulo M-11); LF consistency; `.gitignore` discipline for env/build/coverage.

### Must improve before publishing

1. **CI (C-01, H-01)** — a reviewer will click the badge. Today the frontend badge would show green while running nothing.
2. **Reproducibility (C-02)** — "clone → run" must work from the README; today it works only with the author's untracked `.env`.
3. **Contract fidelity (C-03)** — mock-vs-real divergence is a red flag to a senior reviewer.
4. **READMEs (M-06)** — the first thing a reviewer reads is currently a 3-line stub.
5. **Docs staleness (M-05)** — a contradiction like "Mongoose 8" vs package.json signals maintenance gaps.
6. **Frontend `strict` typing** — either enable it or stop claiming it; silent type-unsafety is the worst of both.
7. **Stale artifacts (M-11)** — `cov.txt` with a hardcoded local path in git is an amateur signal.

**Overall:** architecture, testing, and API quality are above the bar. The remaining work is polish + correctness in the operational layer (CI, env, docs) — typically 2–4 focused sessions.

---

## Recommended Consolidation Order

### 1. Must fix before E2E

| Priority | Item | Refs |
|---|---|---|
| 1 | Align the local port/env contract; add `backend/.env.example`; Vite proxy or canonical default | C-02 |
| 2 | Run frontend tests in CI (`test:ci` script + workflow step); synchronize workflows (setUp-node, cache, naming, `test:ci` on backend too) | C-01, H-01, M-12 (thresholds can wait) |
| 3 | Realign MSW handlers to the backend contract; add the parity test | C-03 |
| 4 | Fix pagination bugs (delete page clamp; active-filter count) | H-05 |
| 5 | Escaping of regex filters (contract semantics for search) | H-02 |
| 6 | Unique (title, author) index + 11000 → 409 mapping | H-08 |

Rationale: E2E tests need a deterministic local stack (1), a CI that runs the suite they extend (2), mock fixtures that don't lie about the API E2E exercises (3), and a UI without the cheap-to-hit pagination bugs (4). Items 5–6 stabilize the semantics E2E asserts against.

### 2. Should fix before publishing

- Swagger/hand-written schema parity (H-03, M-08) and stricter swagger tests
- Runtime DTO validation layer (H-04) — before new modules (Members/Readings) clone the current pattern
- Build hygiene: exclude tests from `dist` (H-06)
- Seed script quality (H-07)
- Docs consolidation: `project-context.md`, `roadmap.md`, `tests.md`, `testing.md` (M-05)
- Root + frontend READMEs (M-06)
- Frontend type hygiene (`genre: Genre`, single `Book` type) (M-01), and decide on `strict` (Frontend Assessment)
- Remove `cov.txt`/`cov2.txt`, silence `coverage/` lint (M-11); fix `main` field (L-01)
- Decide and wire coverage thresholds (M-12)

### 3. Can be postponed

- CORS/helmet/rate-limit hardening (M-07) — only needed before public deployment
- Test-priority items: query-key decoupling (M-02), examples cleanup (M-03), targeted gap tests (M-04)
- Test-layer rebalancing when E2E lands (M-10)
- Health endpoint DB-awareness (M-09), health version constant (L-02), jest coverage glob (L-03), HomePage content (L-04)

---

## E2E Readiness

**Is the project technically ready to begin Playwright?**

**Yes — with four prerequisites.** The app itself is well-structured for E2E: URL-driven state (shareable scenarios), stable selectors via roles/labels/aria (test ids exist but are not required by tests), deterministic seed data, a documented design system for copy assertions, and a backend that runs standalone. Nothing about the architecture blocks Playwright.

**Must fix first (blocks a meaningful E2E layer):**

1. **C-02** — E2E needs a reproducible way to start backend + frontend (Playwright `webServer` config depends on known ports/env).
2. **C-01 / H-01** — CI must run the unit/integration suites *before* E2E is added; otherwise failures have no bisection layer.
3. **C-03** — if mock stay diverged, E2E against the real backend will chase ghosts the jsdom suite believes are fine, and E2E fixtures built on the mock inherit its wrong behaviors.
4. **H-05** — the delete-last-item-on-last-page flow is a guaranteed E2E flake/failure; fix the two-line bug first.

**Can safely wait:** DTO validation (H-04), security hardening (M-07), documentation refresh (M-05/M-06 — for the portfolio pass, not for E2E), coverage thresholds (M-12 — add them with the `test:ci` wiring), and the test-layer rebalancing (M-10 — do this **after** E2E exists so the split is deliberate).

---

## Final Recommendation

The Literaria Nocturna codebase is technically sound and honestly above average for a portfolio project: clean layered backend with a professional error contract, a frontend with real architectural discipline, an unusually good test suite for its size, and design-system documentation that matches implementation.

Its problems are concentrated in three operational layers — **CI (tests not running), reproducibility (port/env contract), and mock fidelity (MSW drift)** — plus documentation that stopped tracking reality roughly nine stories ago. None of these require architectural change; they are consolidation work, which is exactly what this phase is for.

Execute the consolidation order as written: fix the local stack and CI first (those unblock everything else), then the pagination and search contract bugs, then the mock/contract parity, then the docs. After that, the repository is ready for Playwright E2E and for the Members/Readings modules — and it will be publishable as a portfolio with genuine credibility.