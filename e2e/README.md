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

# Staging E2E (requires deployed staging)
E2E_STAGING=1 \
PLAYWRIGHT_BASE_URL=https://staging.literaria-nocturna.vercel.app \
PLAYWRIGHT_API_URL=https://api-staging.literaria-nocturna.render.com \
npm run test:e2e:staging

# Clean up stale test data (dry-run by default)
npm run e2e:cleanup-stale

# Force cleanup (actually deletes)
npm run e2e:cleanup-stale:force
```

> **Windows note:** the `test:e2e:cross-browser`, `test:e2e:responsive` and
> `test:e2e:full` scripts use POSIX `VAR=1` prefixes (same convention as the
> pre-existing `test:e2e:staging`), which cmd.exe cannot parse. On PowerShell
> run the underlying command instead:
> `$env:E2E_EXTENDED_MATRIX='1'; npx playwright test --project=chromium-mobile --project=chromium-tablet`
> (Git Bash/WSL/macOS/Linux can use the npm scripts as written.)

## Browser & Viewport Matrix

The matrix targets one deliberate slice per axis: **engine differences** on
desktop, **breakpoint behavior** at viewports straddling the app's only
Tailwind breakpoint (`sm:` 640px). The full local matrix is 59 executions.

| Project             | Engine   | Viewport | Scope                                             | Runs in                           |
| ------------------- | -------- | -------- | ------------------------------------------------- | --------------------------------- |
| `chromium`          | Chromium | 1280x720 | Full baseline suite (untagged + `@cross-browser`) | `npm run test:e2e`, CI Tier 1     |
| `chromium-isolated` | Chromium | 1280x720 | Empty-catalog test (depends on `chromium`)        | with baseline                     |
| `firefox-desktop`   | Firefox  | 1280x720 | 4 `@cross-browser` journeys                       | `test:e2e:cross-browser`, nightly |
| `webkit-desktop`    | WebKit   | 1280x720 | 4 `@cross-browser` journeys                       | `test:e2e:cross-browser`, nightly |
| `chromium-mobile`   | Chromium | 375x667  | 8 `@responsive` tests (below `sm:`)               | `test:e2e:responsive`, nightly    |
| `chromium-tablet`   | Chromium | 768x1024 | 8 `@responsive` tests (at/above `sm:`)            | `test:e2e:responsive`, nightly    |
| `chromium-staging*` | Chromium | 1280x720 | Staging smoke (deployed environment)              | manual, `E2E_STAGING=1` only      |

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

| Annotation       | Meaning                                     | Executed by                                                                          |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| _(untagged)_     | Baseline regression coverage                | `chromium` + `chromium-isolated` only                                                |
| `@cross-browser` | Critical journeys that must work on engines | baseline **and** `firefox-desktop` + `webkit-desktop`                                |
| `@responsive`    | Viewport/breakpoint behavior                | `chromium-mobile` + `chromium-tablet` only (excluded from baseline via `grepInvert`) |

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
- **`E2E_EXTENDED_MATRIX` scripts are POSIX-only** (see Windows note above).

## Test Data Strategy

- **Run ID**: Each test run gets a unique `E2E_RUN_ID` (8-char hex, e.g., `a3f2b1c9`)
- **Ownership**: Test books have titles prefixed with `E2E:${runId}:`
- **Cleanup**:
  - Per-test: `afterEach` deletes via API
  - Global: Teardown sweeps run-scoped books via API
  - Stale: `npm run e2e:cleanup-stale` removes books older than 24h

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

- Deployed staging frontend (Vercel) and backend (Render)
- Atlas `staging` database
- Explicit opt-in via `E2E_STAGING=1`

```bash
E2E_STAGING=1 \
PLAYWRIGHT_BASE_URL=https://staging.literaria-nocturna.vercel.app \
PLAYWRIGHT_API_URL=https://api-staging.literaria-nocturna.render.com \
npm run test:e2e --project=chromium-staging
```

## Stale Data Cleanup

```bash
# Dry-run (default - shows what would be deleted)
npm run e2e:cleanup-stale

# Force delete stale books (older than 24h with E2E: prefix)
npm run e2e:cleanup-stale:force

# Staging cleanup (requires explicit opt-in)
E2E_STAGING=1 E2E_RUN_ID=abc12345 npm run e2e:cleanup-stale:force
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
