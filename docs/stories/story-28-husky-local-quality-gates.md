# Story 28 — Husky & Local Quality Gates

## Objective

Introduce Husky to provide lightweight local quality checks before commits, preventing obvious formatting and linting issues from reaching the repository while keeping CI as the final quality gate.

## Scope

Configure Husky for the monorepo without duplicating the complete CI pipeline.

### Pre-commit

The pre-commit hook should perform fast checks such as:

- ESLint
- Prettier verification
- Other inexpensive static checks if justified

### Pre-push

Evaluate whether a pre-push hook is justified for:

- Frontend tests
- Backend tests
- Build verification

Do **not** automatically duplicate the complete CI pipeline locally.

## Tasks

- Install and configure Husky.
- Create the required Git hooks.
- Determine appropriate commands for frontend and backend.
- Ensure hooks work correctly from the repository root.
- Ensure hooks work in a clean clone after dependency installation.
- Avoid coupling hooks to developer-specific paths or environments.
- Document how to bypass a hook when necessary.
- Document the purpose of each hook.

## Testing

### Manual Verification

- Commit with valid code → succeeds.
- Commit with ESLint violation → blocked.
- Commit with formatting violation → blocked, if Prettier check is configured.
- Valid commit → succeeds.
- Verify hooks work after cloning the repository.
- Verify CI remains independent from Husky.

## Acceptance Criteria

- Husky is installed and configured.
- Pre-commit performs the agreed lightweight quality checks.
- Any configured failing check prevents the commit.
- Hooks work from a clean repository clone.
- CI remains the authoritative quality gate.
- Documentation explains the configured hooks.
- No unnecessary duplication of CI workloads.

## Out of Scope

- Changing application functionality.
- Adding or modifying application tests.
- Replacing GitHub Actions.
- Running the entire CI pipeline on every commit.
- Deployment configuration.

## Definition of Done

- Husky configured.
- Pre-commit hook implemented.
- Pre-push hook implemented only if justified.
- Hooks verified locally.
- Clean-clone behavior verified.
- Documentation updated.
- Existing CI behavior remains unchanged.
