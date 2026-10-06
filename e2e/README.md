# E2E Test Quick Reference

## Running Tests

```bash
# Local E2E (default)
npm run test:e2e

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
import { createUniqueBookData } from './fixtures/test-data';
const bookData = createUniqueBookData(); // title: "E2E:runId:E2E Book timestamp-random"

// Override specific fields
const bookData = createUniqueBookData({ title: "My Custom Title" });
```

## Key Helpers

| Helper | Location | Purpose |
|--------|----------|---------|
| `gotoCatalog(page)` | `helpers/navigation.ts` | Navigate to catalog, wait for data |
| `gotoCreateBook(page)` | `helpers/navigation.ts` | Navigate to create form |
| `createBookThroughUI(page, data)` | `helpers/books.ts` | Create book via UI, return ID |
| `deleteRunBooks(api, runId)` | `helpers/api.ts` | Delete all books for a run ID |
| `isE2EOwned(title)` | `fixtures/test-data.ts` | Check if title has E2E prefix |

## Staging Safety Checklist

- [ ] `E2E_STAGING=1` explicitly set
- [ ] `E2E_RUN_ID` auto-generated (do not override)
- [ ] `PLAYWRIGHT_BASE_URL` points to staging frontend
- [ ] `PLAYWRIGHT_API_URL` points to staging backend
- [ ] Dry-run cleanup first: `npm run e2e:cleanup-stale`
- [ ] Only run against staging during maintenance windows