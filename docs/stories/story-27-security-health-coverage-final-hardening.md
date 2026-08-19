# Story 27 — Security, Health, Coverage & Final Repository Hardening

## Objective

Resolve the remaining audit findings, including low-priority issues, and leave the project in a clean state before beginning E2E testing and staging deployment.

---

## Scope

### 1. Security Baseline

Prepare the backend for deployment by reviewing and implementing where appropriate:

- CORS allowlist based on environment configuration
- Helmet
- Rate limiting
- Explicit request body size limits

> **Note:** Authentication is out of scope for this story.

---

### 2. Health Endpoint

Improve `/api/health` behavior:

- The health endpoint should not report the application as healthy when the database is unavailable.
- Evaluate whether a separate database health/readiness endpoint is appropriate.
- Remove hardcoded version information where appropriate.

---

### 3. Coverage

- Define explicit coverage thresholds.
  - **Suggested baseline:** Statements: ≥ 85%, Branches: ≥ 75%.
- These values should be evaluated against the actual project coverage before becoming enforced requirements.
- Once stable, enforce the thresholds in CI.

---

### 4. Test Suite Cleanup

Review:

- Tests coupled to implementation details
- Example tests
- Redundant tests
- Missing important coverage
- Unnecessary duplication

> **Note:** Do not remove valuable tests simply to reduce test count.

---

### 5. Test Layer Strategy

Document and maintain the following test-layer strategy:

- Backend Integration
- Frontend Unit / Component
- Frontend Integration + MSW
- Playwright E2E

> **Note:** Avoid unnecessarily duplicating complete user flows across Vitest and Playwright.

---

### 6. Remaining Low-Priority Findings

Resolve all remaining audit findings, including:

- Package metadata
- Health endpoint version
- Jest coverage glob
- `HomePage` placeholder
- `BookForm.handleSuccess`
- Remaining documentation inconsistencies
- Remaining repository artifacts
- Any other unresolved findings from the audit

---

## Acceptance Criteria

- Every finding from the audit has been resolved or explicitly documented as a conscious decision.
- Coverage thresholds are defined.
- Coverage thresholds are enforced in CI where appropriate.
- Health endpoint behavior is well defined.
- Deployment security baseline is established.
- No unnecessary repository artifacts remain.
- Test strategy is documented.
- Backend tests pass.
- Frontend tests pass.
- Lint passes without warnings.
- TypeScript compilation passes.
- Production builds pass.
- The repository is ready for Playwright E2E implementation.

---

## Related Audit Findings

- **M-07**
- **M-10**
- **M-12**
- **L-01**
- **L-02**
- **L-03**
- **L-04**
- **L-05**
