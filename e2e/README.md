# E2E Test Quick Reference

## Running Tests

```bash
# Local E2E (default) - Chromium desktop baseline, 35 tests
npm run test:e2e

# Tier 1 / CI - same suite, explicit projects
npm run test:e2e:ci

# Tier 2 - Firefox + WebKit desktop (@cross-browser journeys, 8 runs)
npm run test:e2e:cross-browser

# Tier 2 - Chromium mobile + tablet viewports (@responsive, 16 runs)
npm run test:e2e:responsive

# Full local matrix - all 6 projects, 59 runs
npm run test:e2e:full

# Headed mode (visible browser)
npm run test:e2e:headed

# Debug mode (Playwright Inspector)
npm run test:e2e:debug

# Staging E2E (requires deployed staging - see "Staging E2E" below)
npm run test:e2e:staging

# Clean up stale test data (dry-run by default)
npm run e2e:cleanup-stale

# Force cleanup (actually deletes)
npm run e2e:cleanup-stale:force
```

> **Windows note:** the `test:e2e:cross-browser`, `test:e2e:responsive`,
> `test:e2e:full` and `test:e2e:staging` scripts use POSIX `VAR=1` prefixes,
> which cmd.exe cannot parse. On PowerShell run the underlying command instead:
> `$env:E2E_EXTENDED_MATRIX='1'; npx playwright test --project=chromium-mobile --project=chromium-tablet`
> `$env:E2E_STAGING='1'; npx playwright test --project=chromium-staging`
> (Git Bash/WSL/macOS/Linux can use the npm scripts as written.)

## Browser & Viewport Matrix

The matrix targets one deliberate slice per axis: **engine differences** on
desktop, **breakpoint behavior** at viewports straddling the app's only
Tailwind breakpoint (`sm:` 640px). The full local matrix is 59 executions.

| Project             | Engine   | Viewport | Scope                                                                    | Runs in                           |
| ------------------- | -------- | -------- | ------------------------------------------------------------------------ | --------------------------------- |
| `chromium`          | Chromium | 1280x720 | Full baseline suite (untagged + `@cross-browser`)                        | `npm run test:e2e`, CI Tier 1     |
| `chromium-isolated` | Chromium | 1280x720 | Empty-catalog test (depends on `chromium`)                               | with baseline                     |
| `firefox-desktop`   | Firefox  | 1280x720 | 4 `@cross-browser` journeys                                              | `test:e2e:cross-browser`, nightly |
| `webkit-desktop`    | WebKit   | 1280x720 | 4 `@cross-browser` journeys                                              | `test:e2e:cross-browser`, nightly |
| `chromium-mobile`   | Chromium | 375x667  | 8 `@responsive` tests (below `sm:`)                                      | `test:e2e:responsive`, nightly    |
| `chromium-tablet`   | Chromium | 768x1024 | 8 `@responsive` tests (at/above `sm:`)                                   | `test:e2e:responsive`, nightly    |
| `chromium-staging`  | Chromium | 1280x720 | Same set as `chromium`, against deployed staging; empty-catalog excluded | manual, `E2E_STAGING=1` only      |

Rationale:

- **Single breakpoint:** the app only switches layout at `sm: 640px`, so two
  viewports (375 / 768) cover pre- and post-breakpoint behavior; desktop
  Chromium covers full layout. Extra viewports would add runtime without new
  layout states.
- **Desktop-only Firefox/WebKit:** engine differences (JS/CSS parsing,
  default styles) surface on desktop; Firefox/WebKit mobile emulation adds
  little over desktop for this CSS-only responsive design while doubling CI
  time. Layout at small sizes is covered by the Chromium viewport projects.
- **Explicit viewports, not device descriptors:** Playwright 1.63 device
  presets (e.g. iPhone SE = 320x568) do not match the chosen sizes and their
  `defaultBrowserType` would override the intended engine. Projects use
  plain `viewport` + `hasTouch` (see limitations for why `isMobile` is
  omitted).
- **Gating:** extended projects only exist when `E2E_EXTENDED_MATRIX=1`, so
  the default `npm run test:e2e` baseline stays exactly as before (Story 40
  AC6/AC7).

## Test Annotations

| Annotation       | Meaning                                     | Executed by                                                                                      |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| _(untagged)_     | Baseline regression coverage                | `chromium` + `chromium-isolated` + `chromium-staging`                                            |
| `@cross-browser` | Critical journeys that must work on engines | baseline **and** `firefox-desktop` + `webkit-desktop`                                            |
| `@responsive`    | Viewport/breakpoint behavior                | `chromium-mobile` + `chromium-tablet` only (excluded from baseline and staging via `grepInvert`) |

There is no separate `@baseline` tag: baseline membership is simply the
absence of `@responsive` (the baseline project runs everything except
`@responsive`). `@cross-browser` tests still run in the baseline, so engine
coverage never reduces desktop coverage.

## CI Execution (`.github/workflows/e2e-ci.yml`)

| Tier | Job                                                   | Command                                                   | Trigger                         |
| ---- | ----------------------------------------------------- | --------------------------------------------------------- | ------------------------------- |
| 1    | `e2e-chromium-desktop`                                | `npm run test:e2e:ci`                                     | nightly, manual, push to `main` |
| 2    | `e2e-cross-browser` (firefox-desktop, webkit-desktop) | `E2E_EXTENDED_MATRIX=1 npx playwright test --project=<p>` | nightly, manual, push to `main` |
| 2    | `e2e-responsive` (chromium-mobile, chromium-tablet)   | `E2E_EXTENDED_MATRIX=1 npx playwright test --project=<p>` | nightly, manual, push to `main` |
| 3    | staging                                               | `npm run test:e2e:staging`                                | manual only (needs staging)     |

- **No `pull_request` trigger by design** — PR checks (frontend/backend CI)
  are unchanged; E2E feedback lands on `main`/nightly (AC6).
- Each job spins a `mongo:7` service and writes `backend/.env`
  (`MONGODB_URI`, `PORT`) because global setup/teardown read that gitignored
  file directly.
- Traces, screenshots and videos in `test-results/` are uploaded as
  artifacts when a job fails (traces arrive on the first CI retry).

## Known Limitations

- **No WebKit/Firefox mobile projects** — engine coverage is desktop-only;
  small-viewport layout is covered by Chromium (see matrix rationale).
- **WebKit on Linux CI is not Safari on macOS** — font rendering and native
  form controls differ; the suite asserts behavior, not pixels. There is no
  visual-regression, accessibility-scan, performance or real-device testing
  anywhere in this suite (out of scope for Story 40).
- **Firefox `<select>`/control styling differences** exist but are not
  asserted; tests target accessible roles, labels and behavior only.
- **Viewports are emulated, not real devices** — no real touch hardware,
  device pixel ratio or OS browser chrome. `hasTouch` is enabled;
  `isMobile: true` is deliberately **not** used: under mobile emulation
  Chromium expands the layout viewport to fit overflowing content (an
  overflowing catalog table widened `window.innerWidth` past the configured
  viewport), which breaks click geometry in these tests.
- **Touch targets:** the app's pagination controls render at 34-36px, below
  the WCAG 2.5.5 44x44 recommendation the plan aimed at. Responsive tests
  assert >= 24px plus visibility/in-viewport so real regressions still fail;
  closing the gap is a product-side follow-up.
- **Tier 3 (staging) is not wired into CI** — it requires deployed staging
  environments and runs manually via `npm run test:e2e:staging`.
- **`E2E_EXTENDED_MATRIX` and staging scripts are POSIX-only** (see Windows
  note above).
- **Staging rate limit (100 req/15min) bounds staging runs** — repeated runs
  within one window hit `429` responses; the suite has no 429-specific
  handling (see Staging E2E above).
- **Staging run ID is not sent as a header** — backend CORS allows only
  `Content-Type,Authorization`; ownership is enforced solely via the
  `E2E:${runId}:` title prefix.

## Test Data Strategy

- **Run ID**: Each test run gets a unique `E2E_RUN_ID` (8-char hex, e.g., `a3f2b1c9`)
- **Ownership**: Test books have titles prefixed with `E2E:${runId}:`
- **Cleanup**:
  - Per-test: `afterEach` deletes via API
  - Global: Teardown sweeps run-scoped books via API
  - Stale: `npm run e2e:cleanup-stale` removes books older than 24h
- **Seeding** (local/CI only): global setup seeds 15 reference titles into the
  database named by `backend/.env` `MONGODB_URI`. Staging runs skip seeding
  entirely — tests never depend on seed titles, and the staging database is
  only touched through the public API.

## Running Locally

Prerequisites:

- Backend `.env` configured with `MONGODB_URI` pointing to Atlas dev DB
- Frontend `.env` with `VITE_API_URL=/api`

```bash
# Terminal 1: Start backend (or let Playwright do it)
npm run dev --prefix backend

# Terminal 2: Start frontend (or let Playwright do it)
npm run dev --prefix frontend

# Terminal 3: Run E2E tests
npm run test:e2e
```

Playwright's `webServer` config starts both servers automatically if not already running.

## Staging E2E

Requires:

- Deployed staging frontend (Vercel) and backend (Render) reachable
- Explicit opt-in via `E2E_STAGING=1` (what `test:e2e:staging` sets)
- No local servers, no `backend/.env`, and no database credentials: staging
  runs never start `webServer`, never seed MongoDB (global setup skips it in
  staging mode), and talk only to the deployed API and UI

Default endpoints (override with `PLAYWRIGHT_BASE_URL` / `PLAYWRIGHT_API_URL`
if the deployment moves):

```text
Frontend  https://literaria-nocturna.vercel.app
API       https://literaria-nocturna.onrender.com
```

```bash
# POSIX (Git Bash/WSL/macOS/Linux)
npm run test:e2e:staging
npm run test:e2e:staging:full   # + chromium-staging-isolated (empty-catalog, skipped in staging)

# PowerShell
$env:E2E_STAGING='1'; npx playwright test --project=chromium-staging
```

Before the first test, global setup warms both deployed endpoints (up to 3
attempts each, 60 s timeout) so a cold Render instance does not surface as a
test timeout — on 2026-10-21 that absorbed a 31.7 s API cold start in setup
rather than in the first test. If warm-up cannot reach a service, or the API
answers `429`, the run aborts with that reason instead of failing every test.
Staging runs also write an HTML report to `playwright-report/` (gitignored)
alongside the list output; open it with `npx playwright show-report`.

### What runs against staging

- **Included**: the same 34 tests as the local `chromium` baseline (untagged +
  `@cross-browser`: smoke, catalog/details, create/edit/delete, error
  scenarios, recovery, contract validation).
- **Excluded**: `@responsive` tests (viewport-only, via `grepInvert`) and
  `empty-catalog` (destructive — it deletes every book; also guarded by an
  in-test `test.skip(isStagingE2E())` as defense-in-depth, so
  `--project=chromium-staging-isolated` cannot wipe staging data either).

### Data safety on the shared environment

- All test books are titled `E2E:${runId}:...` and created/deleted through the
  public API only; global teardown sweeps the run's books after every staging
  run; `npm run e2e:cleanup-stale` (dry-run first) removes leftovers older
  than 24h and refuses to run in staging without an explicit `E2E_RUN_ID`.
- The staging API is rate-limited (**100 requests / 15 minutes**, shared across
  all clients). A full staging run is close to one entire window — wait for
  `ratelimit-reset` before re-running, and expect `429 RATE_LIMIT_EXCEEDED`
  responses if you run repeatedly within the window. No test asserts on 429,
  so a rate-limited run fails with unrelated symptoms; check response headers
  first when results look inconsistent.
- No request header outside the backend's CORS allow-list
  (`Content-Type,Authorization`) is sent from the browser, or every preflight
  would be rejected (Story 42: the run ID travels in test-data titles).

### Rate-limit batching

A full 34-test run costs ~270 requests — more than the 100 requests / 15
minutes the staging API allows — so one run crosses at least one window and
then fails with misleading symptoms (no test asserts on 429). Split the run
into four batches and wait for the `ratelimit-reset` response header (or ~15
minutes) between them:

```bash
# Batch 1 (6): smoke, catalog, delete-error
E2E_STAGING=1 npx playwright test --project=chromium-staging e2e/smoke.test.ts e2e/books/catalog.e2e.test.ts e2e/books/delete-book.error.e2e.test.ts

# Batch 2 (10): CRUD journeys + details errors
E2E_STAGING=1 npx playwright test --project=chromium-staging e2e/books/create-book.e2e.test.ts e2e/books/edit-book.e2e.test.ts e2e/books/delete-book.e2e.test.ts e2e/books/book-details.error.e2e.test.ts

# Batch 3 (8): recovery + contract validation
E2E_STAGING=1 npx playwright test --project=chromium-staging e2e/books/recovery.e2e.test.ts e2e/books/contract-list-filter-pagination.e2e.test.ts e2e/books/contract-get-book-by-id.e2e.test.ts e2e/books/contract-create-book.e2e.test.ts e2e/books/contract-validation-error.e2e.test.ts

# Batch 4 (10): error scenarios
E2E_STAGING=1 npx playwright test --project=chromium-staging e2e/books/create-book.error.e2e.test.ts e2e/books/edit-book.error.e2e.test.ts
```

PowerShell: set `$env:E2E_STAGING='1'` once, then run the same
`npx playwright test ...` commands without the `E2E_STAGING=1` prefix.

### Verification results (Story 42, 2026-10-15)

| Check                        | Result                                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local baseline               | **35/35 passed** (1.4m) after the shared-fixture refactor — behavior unchanged (AC3/AC8)                                                                                                                                                  |
| Config/URL resolution        | Local → `localhost:5173`/`:3000`; staging → Vercel/Render defaults; env overrides honored                                                                                                                                                 |
| Stale-cleanup script         | Loads and runs (imports fixed); staging dry-run **refuses without `E2E_RUN_ID`** (exit 1)                                                                                                                                                 |
| Destructive-test guard       | `empty-catalog` under `E2E_STAGING=1`: **1 skipped**, no API call made (verified via kill-switch API URL)                                                                                                                                 |
| Staging run — pre-fix        | 8 passed / 26 failed: injected `X-E2E-Run-ID` header failed CORS preflight on every real API call; route-mocked tests passed                                                                                                              |
| Staging run — post-fix       | **34/34 passed** vs. live deployment: full staging project (smoke, CRUD journeys, details, errors, recovery, contract) through deployed Vercel → Render → Atlas (AC5), split across 4 batches (6+10+8+10) to stay inside the rate windows |
| Data safety post-run         | Staging DB re-checked after every batch: only the pre-existing book, **0 `E2E:` leftovers** (per-test `afterEach` + teardown)                                                                                                             |
| Env overrides                | `PLAYWRIGHT_API_URL` override takes effect (verified with a local kill-switch URL during the guard test)                                                                                                                                  |
| Phase 1 staging (2026-10-21) | Warm-up + HTML report verified: staging smoke **1/1 passed** vs. live deployment; warm-up absorbed a **31.7 s API cold start** in setup, not in the first test; selections confirmed 34 staging / 35 staging:full / 35 local              |
| Phase 1 checks (2026-10-21)  | `prettier --check` passed, `eslint frontend`/`eslint backend` passed, `tsc --strict` clean on config + global setup; local baseline not re-run (Atlas unreachable from this machine; Tier 1 CI covers it)                                 |

**Staging run scope:** the deployed API allows **100 requests / 15 minutes**,
and the full 34-test project costs ~8 requests per test (~270 total) — more
than two rate windows. Verification split the project into batches around
`ratelimit-reset` until **all 34 tests passed**; do the same when re-running
(the batches above are a workable split), or run a representative subset if
you only need a smoke-level signal.

**Known environment limits (not test defects):** staging CORS allow-list is
fixed at `Content-Type,Authorization`; staging rate limit is 100 req/15min;
the staging API database cannot be seeded by E2E (by design).

## Stale Data Cleanup

```bash
# Dry-run (default - shows what would be deleted)
npm run e2e:cleanup-stale

# Force delete stale books (older than 24h with E2E: prefix)
npm run e2e:cleanup-stale:force

# Staging cleanup (requires explicit opt-in + explicit run ID)
E2E_STAGING=1 E2E_RUN_ID=abc12345 npm run e2e:cleanup-stale:force
# PowerShell:
$env:E2E_STAGING='1'; $env:E2E_RUN_ID='abc12345'; npx tsx scripts/e2e-cleanup-stale.ts --force
```

## Test Data Patterns

```typescript
// Create unique book data (auto-includes run ID)
import { createUniqueBookData } from "./fixtures/test-data";
const bookData = createUniqueBookData(); // title: "E2E:runId:E2E Book timestamp-random"

// Override specific fields
const bookData = createUniqueBookData({ title: "My Custom Title" });
```

## Key Helpers

| Helper                               | Location                | Purpose                            |
| ------------------------------------ | ----------------------- | ---------------------------------- |
| `gotoCatalog(page)`                  | `helpers/navigation.ts` | Navigate to catalog, wait for data |
| `gotoCreateBook(page)`               | `helpers/navigation.ts` | Navigate to create form            |
| `createBookThroughUI(page, data)`    | `helpers/books.ts`      | Create book via UI, return ID      |
| `deleteRunBooks(api, runId)`         | `helpers/api.ts`        | Delete all books for a run ID      |
| `isE2EOwned(title)`                  | `fixtures/test-data.ts` | Check if title has E2E prefix      |
| `expectRequestMatches(resp, expect)` | `helpers/api.ts`        | Assert outgoing request contract   |
| `expectSuccessResponse(resp, shape)` | `helpers/api.ts`        | Validate and return success body   |
| `expectErrorResponse(resp, s, code)` | `helpers/api.ts`        | Validate and return error body     |

## Staging Safety Checklist

- [ ] `E2E_STAGING=1` explicitly set
- [ ] `E2E_RUN_ID` auto-generated (do not override)
- [ ] `PLAYWRIGHT_BASE_URL` points to staging frontend
- [ ] `PLAYWRIGHT_API_URL` points to staging backend
- [ ] Dry-run cleanup first: `npm run e2e:cleanup-stale`
- [ ] Only run against staging during maintenance windows
